// WebGL scene: point-cloud skin, hairline organs and skeleton, selection highlight, spring camera rig.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Spring, project, rubberband, historyVelocity, clamp, lerp } from './spring.js';
import { buildStandIns, STANDIN_REF } from './standins.js';
import { contraction, breath } from './vitals.js';
import { ALL_GROUPS } from './model-groups.js';
import { BODY, by } from './body.js';

const MODEL_DIR = by('assets/models/opt/', 'assets/models/opt/female/');
const GROUPS = ALL_GROUPS[BODY];
const FOV = 30;
const TAN = Math.tan((FOV * Math.PI) / 360);
const ORBIT_RAD_PER_PX = 0.0075;
const POL_LIMIT = 0.55;
const ZOOM_MIN = 0.7, ZOOM_MAX = 2.4;

// Scan-derived parts (HRA 3D Reference Object Library, simplified copies in assets/models/opt).
// A part can load several files and belong to several sections. base 0 = hidden until its section is selected.
// split(): one model set becomes several selectable parts, using the mesh-to-part map in model-groups.js
// (generated from the original files by tools/build-groups.mjs).
const VEIN = /vein|vena|venous|sinus/i;
const split = (set, files, sections, base, ids, extra = {}) => ids.map((id) => ({
  id, label: id.replace(/_/g, ' '), set, files, sections, base, take: (name) => GROUPS[set][name] === id, ...extra }));
// `body` marks parts only one of the two bodies has. optIn parts light up only when chosen by name.
const ALL_PARTS = [
  { id: 'skin', label: 'Skin', files: ['skin_points', 'skin_shell'], role: 'points' },
  ...split('vertebrae', ['vertebrae'], ['skeleton'], 0.15, ['spine_cervical', 'spine_thoracic', 'spine_lumbar']),
  ...split('pelvis', ['pelvis'], ['skeleton'], 0.2, ['pelvis_sacrum', 'pelvis_ilium', 'pelvis_ischium', 'pelvis_pubis']),
  ...split('leg', ['leg_l', 'leg_r'], ['skeleton'], 0.16, ['leg_femur', 'leg_patella', 'leg_tibia', 'leg_fibula', 'leg_cartilage']),
  ...split('brain', ['brain'], ['nervous'], 0.1, ['brain_frontal', 'brain_parietal', 'brain_temporal', 'brain_occipital', 'brain_insula', 'brain_limbic',
    'brain_deep', 'brain_cerebellum', 'brain_stem', 'brain_ventricles', 'brain_white', 'brain_olfactory']),
  ...split('spinal_cord', ['spinal_cord'], ['nervous'], 0.2, ['cord_cervical', 'cord_thoracic', 'cord_lumbar', 'cord_sacral']),
  ...split('eye', ['eye_l', 'eye_r'], ['nervous'], 0.05, ['eye_cornea', 'eye_iris', 'eye_lens', 'eye_retina', 'eye_coats', 'eye_inner']),
  { id: 'eye_muscles', label: 'Eye muscles', files: ['eye_muscles_l', 'eye_muscles_r'], sections: ['nervous'], base: 0.05 },
  { id: 'optic_nerves', label: 'Optic nerves', files: ['optic_nerve_l', 'optic_nerve_r'], sections: ['nervous'], base: 0 },
  ...split('heart', ['heart'], ['heart'], 0.2, ['heart_lv', 'heart_rv', 'heart_la', 'heart_ra']),
  ...split('heart', ['heart'], ['heart'], 0.12, ['heart_septum', 'valve_mitral', 'valve_tricuspid', 'valve_aortic', 'valve_pulmonary', 'heart_papillary']),
  { id: 'heart_vessels', label: 'Aorta and coronary vessels', files: ['heart_vessels'], sections: ['heart'], base: 0, frame: false },
  ...split('lungs', ['lungs'], ['lungs'], 0.14, ['lung_r_upper', 'lung_r_middle', 'lung_r_lower', 'lung_l_upper', 'lung_l_lower', 'airways']),
  ...split('liver', ['liver'], ['digestive'], 0.14, ['liver_right', 'liver_left', 'liver_caudate', 'liver_surface']),
  ...split('liver', ['liver'], ['digestive'], 0, ['liver_ligaments']),
  { id: 'liver_vessels', label: 'Liver vessels', files: ['liver_vessels'], sections: ['digestive'], base: 0 },
  { id: 'gallbladder', label: 'Gallbladder', files: ['gallbladder'], sections: ['digestive'], base: 0.2 },
  { id: 'biliary', label: 'Bile ducts', files: ['biliary'], sections: ['digestive'], base: 0 },
  ...split('pancreas', ['pancreas'], ['digestive'], 0.22, ['pancreas_head', 'pancreas_body', 'pancreas_tail']),
  ...split('intestine_small', ['intestine_small'], ['digestive'], 0.2, ['si_duodenum', 'si_jejunum', 'si_ileum']),
  ...split('intestine_large', ['intestine_large'], ['digestive'], 0.2, ['li_caecum', 'li_ascending', 'li_transverse', 'li_descending', 'li_sigmoid', 'li_rectum']),
  ...split('kidney', ['kidney_l', 'kidney_r'], ['urinary'], 0.2, ['kidney_capsule']),
  ...split('kidney', ['kidney_l', 'kidney_r'], ['urinary'], 0, ['kidney_cortex', 'kidney_medulla', 'kidney_hilum']),
  { id: 'kidney_vessels', label: 'Renal vessels', files: ['kidney_vessels'], sections: ['urinary'], base: 0 },
  { id: 'ureters', label: 'Ureters', files: ['ureter_l', 'ureter_r'], sections: ['urinary'], base: 0.16 },
  { id: 'bladder', label: 'Bladder', files: ['bladder'], sections: ['urinary'], base: 0.2 },
  { id: 'urethra', label: 'Urethra', files: ['urethra'], sections: ['urinary'], base: 0, body: 'male' },
  { id: 'arteries', label: 'Arteries', files: ['vessels'], take: (name) => !VEIN.test(name), sections: ['vessels'], base: 0.1 },
  { id: 'veins', label: 'Veins', files: ['vessels'], take: (name) => VEIN.test(name), sections: ['vessels'], base: 0.1 },
  { id: 'spleen', label: 'Spleen', files: ['spleen'], sections: ['lymph'], base: 0.22 },
  { id: 'thymus', label: 'Thymus', files: ['thymus'], sections: ['lymph'], base: 0.16 },
  { id: 'lymph_node', label: 'Lymph node', files: ['lymph_node'], sections: ['lymph'], base: 0 },
  ...split('prostate', ['prostate'], ['reproductive'], 0, ['pr_peripheral', 'pr_transition', 'pr_central', 'pr_stroma', 'pr_other', 'pr_vesicles', 'pr_vas', 'pr_ducts'], { body: 'male' }),
  ...split('uterus', ['uterus'], ['reproductive'], 0.14, ['uterus_fundus', 'uterus_body', 'uterus_cervix'], { body: 'female' }),
  { id: 'uterus_vessels', label: 'Uterine vessels', files: ['uterus_vessels'], sections: ['reproductive'], base: 0, body: 'female' },
  { id: 'ovaries', label: 'Ovaries', files: ['ovary_l', 'ovary_r'], sections: ['reproductive'], base: 0.2, body: 'female' },
  ...split('fallopian', ['fallopian_l', 'fallopian_r'], ['reproductive'], 0.14, ['tube_infundibulum', 'tube_ampulla', 'tube_isthmus'], { body: 'female' }),
  { id: 'vagina', label: 'Vagina', files: ['vagina'], sections: ['reproductive'], base: 0.12, body: 'female' },
  { id: 'uterus_ligaments', label: 'Ligaments of the uterus', files: ['uterus_ligaments'], sections: ['reproductive'], base: 0, body: 'female' },
  ...split('mammary', ['breast_l', 'breast_r'], ['reproductive'], 0.05, ['breast_fat'], { body: 'female', frame: false }),
  ...split('mammary', ['breast_l', 'breast_r'], ['reproductive'], 0, ['breast_lobes', 'breast_ducts', 'breast_nipple', 'breast_ligaments'], { body: 'female', frame: false }),
  // The library places the placenta beside the body as a reference object, not inside the uterus.
  { id: 'placenta', label: 'Placenta', files: ['placenta'], sections: ['reproductive'], base: 0, body: 'female', frame: false, optIn: true },
];
const REAL_PARTS = ALL_PARTS.filter((p) => !p.body || p.body === BODY);
// Lets content name a whole split organ by its set, for example 'brain' for all twelve brain parts.
export const PART_GROUPS = {};
for (const p of REAL_PARTS) if (p.set) (PART_GROUPS[p.set] = PART_GROUPS[p.set] || []).push(p.id);
const STANDINS = buildStandIns();
export const PARTS = [...REAL_PARTS.map(({ id, label, sections = [], set }) => ({ id, label, sections, set, standin: false })),
  ...STANDINS.map(({ id, label, sections = [] }) => ({ id, label, sections, standin: true }))];

// Preferred viewing angle per section (radians). Azimuth 0 faces the front of the body.
// pad frames the section loosely so it reads in context; focusPad (where set) reframes on a focused part.
const SECTION_VIEW = {
  nervous: { az: -0.6, pol: 0.06, pad: 1.1, focusPad: 1.55 }, heart: { az: 0.3, pol: 0.1, pad: 1.8 }, lungs: { az: -0.3, pol: 0.06, pad: 1.3 },
  digestive: { az: 0.14, pol: 0.06, pad: 1.15 }, urinary: { az: 0.36, pol: 0.1, pad: 1.12 },
  vessels: { az: 0.22, pol: 0.05, pad: 1.08 }, skeleton: { az: 0.4, pol: 0.05, pad: 1.0, focusPad: 1.3 },
  lymph: { az: 0.2, pol: 0.08, pad: 1.4, focusPad: 1.8 },
  reproductive: by({ az: -0.6, pol: 0.14, pad: 3 }, { az: 0.3, pol: 0.12, pad: 1.9, focusPad: 1.5 }),
};
const BODY_FRAME = { c: new THREE.Vector3(0, 0, 0), hx: 0.56, hy: 0.95, r: 0.95 }; // replaced by the skin's own bounds once it loads

// Copy a (quantised, node-transformed) mesh into plain world-space float geometry.
function bake(mesh) {
  const src = mesh.geometry, pos = src.attributes.position, out = new Float32Array(pos.count * 3), v = new THREE.Vector3();
  mesh.updateWorldMatrix(true, false);
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(out, 3));
  if (src.index) g.setIndex(Array.from(src.index.array));
  g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

// One line per unique edge. Half the segments of a GPU wireframe and no doubled-up alpha.
function edgeGeometry(g) {
  const idx = g.index.array, n = g.attributes.position.count, seen = new Set(), out = [];
  for (let i = 0; i < idx.length; i += 3) for (let k = 0; k < 3; k++) {
    let a = idx[i + k], b = idx[i + ((k + 1) % 3)]; if (a > b) [a, b] = [b, a];
    const key = a * n + b; if (!seen.has(key)) { seen.add(key); out.push(a, b); }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', g.attributes.position); lg.setIndex(out); return lg;
}

// Join baked geometries into one, so each part is a single draw call.
function mergeGeoms(list) {
  if (list.length === 1) return list[0];
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), idx = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, vo * 3);
    const src = g.index.array; for (let i = 0; i < src.length; i++) idx[io + i] = src[i] + vo;
    vo += g.attributes.position.count; io += src.length;
  }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setIndex(new THREE.BufferAttribute(idx, 1));
  m.computeVertexNormals(); m.computeBoundingBox(); m.computeBoundingSphere();
  return m;
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'), grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.32)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export async function createScene(canvas, { onProgress = () => {}, onPick = () => {}, onHover = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const coarse = matchMedia('(pointer: coarse)').matches;
  // Pixel ratio is capped, then stepped down at runtime if frames run long.
  let pr = Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
  renderer.setPixelRatio(pr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);
  scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a2a10, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(-0.5, 0.7, 0); key.target.position.set(0, 0, -1); camera.add(key, key.target);
  const root = new THREE.Group(); scene.add(root);

  const theme = { ink: new THREE.Color('#ebf2f0'), accent: new THREE.Color('#f6641b'), accentLine: new THREE.Color('#fd9c5d'), overLine: new THREE.Color('#fd9c5d'), light: false };
  const state = { section: null, focus: null };
  let focusFrame = null, focusBall = null, cutBox = new THREE.Box3(), cutAxis = 'z';
  // One shared clipping plane gives the cutaway. Parked far away when the cut is off.
  renderer.localClippingEnabled = true;
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6), cut = new Spring(0, { response: 0.3 });
  // How strongly the unfocused parts of the selected section are drawn: 1 with no focus, less the deeper the focus.
  const sibling = new Spring(1, { response: 0.4 });
  const entities = [], byId = {}, pickMeshes = [];
  let reduced = false;

  function addEntity(def, geoms, lineGeom) {
    const e = { ...def, group: new THREE.Group(), solids: [], box: new THREE.Box3(), sections: def.sections || [], base: def.base ?? (def.sections ? 0.3 : 0.22),
      sel: new Spring(0, { response: 0.4 }), tint: new Spring(0, { response: 0.35 }), hover: new Spring(0, { response: 0.18 }) };
    e.lineMat = def.standin
      ? new THREE.LineDashedMaterial({ transparent: true, depthWrite: false, dashSize: 0.005, gapSize: 0.0035, clippingPlanes: [cutPlane] })
      : new THREE.LineBasicMaterial({ transparent: true, depthWrite: false, clippingPlanes: [cutPlane] });
    if (e.sections.length && geoms.length) {
      e.solidMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, transparent: true, opacity: 0, side: THREE.DoubleSide,
        depthWrite: !def.standin, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, clippingPlanes: [cutPlane] });
    }
    for (const g of geoms) {
      e.box.union(g.boundingBox);
      if (!def.standin) e.group.add(new THREE.LineSegments(edgeGeometry(g), e.lineMat));
      if (e.solidMat) { const m = new THREE.Mesh(g, e.solidMat); m.visible = false; m.userData.entity = e; e.group.add(m); e.solids.push(m); pickMeshes.push(m); }
    }
    if (lineGeom) {
      const lg = lineGeom.index ? lineGeom.toNonIndexed() : lineGeom; lg.computeBoundingBox(); e.box.union(lg.boundingBox);
      const ls = new THREE.LineSegments(lg, e.lineMat); ls.computeLineDistances(); e.group.add(ls);
    }
    e.center = e.box.getCenter(new THREE.Vector3());
    e.radius = e.box.getSize(new THREE.Vector3()).length() / 2;
    root.add(e.group); entities.push(e); byId[e.id] = e;
    return e;
  }

  // ---- load ---------------------------------------------------------------
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // Each file is fetched once and returns its meshes with their node names.
  const fileCache = new Map();
  const loadFile = (file) => {
    if (!fileCache.has(file)) fileCache.set(file, loader.loadAsync(MODEL_DIR + file + '.glb').then((gltf) => {
      const out = []; gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((o) => { if (o.isMesh) out.push({ name: o.name, geom: bake(o) }); });
      return out;
    }));
    return fileCache.get(file);
  };
  const loadGeoms = async (files, take) => {
    const all = (await Promise.all(files.map(loadFile))).flat().filter((m) => !take || take(m.name));
    return [mergeGeoms(all.map((m) => m.geom))];
  };
  const skinBox = new THREE.Box3();
  let points = null, pointCount = 0, shellMat = null, loaded = 0;
  const total = PARTS.length;
  const tick = (id) => onProgress(++loaded, total, id);


  await Promise.all(REAL_PARTS.map(async (p) => {
    if (p.role === 'points') {
      const [dense, shell] = await Promise.all([loadGeoms(['skin_points']), loadGeoms(['skin_shell'])]);
      // Shuffle so any draw-range prefix is an even sample of the body: that is the point-count LOD.
      const arr = dense[0].attributes.position.array.slice(), n = arr.length / 3;
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); for (let k = 0; k < 3; k++) { const t = arr[i * 3 + k]; arr[i * 3 + k] = arr[j * 3 + k]; arr[j * 3 + k] = t; } }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      pointCount = Math.min(n, coarse ? 12000 : 20000); pg.setDrawRange(0, pointCount);
      skinBox.copy(dense[0].boundingBox);
      points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, transparent: true, depthWrite: false }));
      shellMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
      root.add(points, new THREE.LineSegments(edgeGeometry(shell[0]), shellMat));
    } else {
      addEntity(p, await loadGeoms(p.files, p.take));
    }
    tick(p.id);
  }));

  // Framing volume for each section: the union of its members.
  // Whole-body frame from the skin itself, so it fits whichever body is loaded.
  { const c = skinBox.getCenter(new THREE.Vector3()), sz = skinBox.getSize(new THREE.Vector3()); Object.assign(BODY_FRAME, { c, hx: sz.x / 2 * 1.07, hy: sz.y / 2 * 1.04, r: sz.y / 2 * 1.04 }); }

  // Stand-ins were drawn against the male body. Each one is tied to a landmark (brain, lungs, trunk organs or
  // skin) and stretched to that landmark's bounds in the loaded body, so it stays roughly in place on either.
  {
    const boxOf = (test) => { const b = new THREE.Box3(); entities.filter(test).forEach((e) => b.union(e.box)); return b; };
    const now = { brain: boxOf((e) => e.set === 'brain'), lungs: boxOf((e) => e.set === 'lungs'), trunk: boxOf((e) => e.set === 'lungs' || e.set === 'liver' || e.id === 'spleen'), skin: skinBox };
    const done = new Set();
    for (const s of STANDINS) {
      const from = STANDIN_REF[s.anchor], to = now[s.anchor];
      for (const g of [s.mesh, s.lines]) {
        if (!g) continue; const attr = g.attributes.position;
        if (!done.has(attr) && to && !to.isEmpty()) { done.add(attr); const a = attr.array;
          for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) { const ax = 'xyz'[k]; a[i + k] = to.min[ax] + ((a[i + k] - from.min[k]) / (from.max[k] - from.min[k])) * (to.max[ax] - to.min[ax]); }
          attr.needsUpdate = true; }
        g.computeBoundingBox(); g.computeBoundingSphere(); if (g.index && g === s.mesh) g.computeVertexNormals();
      }
      addEntity(s, s.mesh ? [s.mesh] : [], s.lines);
    }
  }

  for (const s of STANDINS) tick(s.id);
  const frames = { body: BODY_FRAME };
  const ballOf = (list) => {
    const box = new THREE.Box3(); list.forEach((e) => box.union(e.box));
    const size = box.getSize(new THREE.Vector3());
    return { c: box.getCenter(new THREE.Vector3()), r: Math.max(size.y, Math.hypot(size.x, size.z)) / 2, hy: size.y / 2 };
  };
  for (const id of Object.keys(SECTION_VIEW)) {
    const v = SECTION_VIEW[id], b = ballOf(entities.filter((e) => e.sections.includes(id) && e.frame !== false));
    frames[id] = { c: b.c, hx: b.r * v.pad, hy: Math.max(b.hy, b.r * 0.8) * v.pad, r: b.r, ...v };
  }

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0 }));
  glow.renderOrder = -1; scene.add(glow);

  // ---- camera rig: every parameter is a spring, so any move can be retargeted mid-flight ----
  const cam = { response: 0.5, damping: 1 };
  const az = new Spring(0.35, cam), pol = new Spring(0.04, cam), zoom = new Spring(1, { response: 0.35 });
  const tx = new Spring(0, cam), ty = new Spring(0, cam), tz = new Spring(0, cam), fit = new Spring(6, cam);
  const ox = new Spring(0, cam), oy = new Spring(0, cam), dim = new Spring(0, { response: 0.4 });
  const gx = new Spring(0, cam), gy = new Spring(0, cam), gz = new Spring(0, cam), gr = new Spring(0.2, cam), gOn = new Spring(0, { response: 0.45 });
  const rig = [az, pol, zoom, tx, ty, tz, fit, ox, oy, dim, gx, gy, gz, gr, gOn];
  let W = 1, H = 1, rect = { l: 0, t: 0, r: 1, b: 1 }, idle = 0, t = 0;

  const currentFrame = () => focusFrame || frames[state.section || 'body'];
  function refit() {
    const f = currentFrame(), fw = Math.max(80, rect.r - rect.l), fh = Math.max(80, rect.b - rect.t);
    fit.to(Math.max((f.hy * H) / (fh * TAN), (f.hx * H) / (fw * TAN)) * 1.08);
    ox.to((rect.l + rect.r) / 2 - W / 2); oy.to((rect.t + rect.b) / 2 - H / 2);
  }
  function resize() {
    W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false); camera.aspect = W / H; refit();
  }
  const nearestAngle = (target, from) => target + Math.round((from - target) / (Math.PI * 2)) * Math.PI * 2;

  // focusIds: the entity ids to light solid (a part can be several models), or null for the whole section.
  // frameIds: what the camera frames when it reframes (defaults to focusIds). forceFrame reframes even in
  // sections that normally hold the camera still, which is how a part inside a part gets a closer look.
  function select(sectionId, focusIds = null, snap = false, frameIds = null, forceFrame = false) {
    const changed = sectionId !== state.section;
    state.section = sectionId; state.focus = focusIds;
    dim.to(sectionId ? 1 : 0); sibling.to(!focusIds ? 1 : forceFrame ? 0.14 : 0.4);
    for (const e of entities) {
      const member = !!sectionId && e.sections.includes(sectionId) && (!e.optIn || !!(focusIds && focusIds.includes(e.id)));
      e.tint.to(member ? 1 : 0); e.sel.to(member && (!focusIds || focusIds.includes(e.id)) ? 1 : 0);
    }
    const base = frames[sectionId || 'body'];
    focusBall = null; focusFrame = null;
    if (sectionId && focusIds) {
      const list = focusIds.map((id) => byId[id]).filter(Boolean);
      if (list.length) {
        focusBall = ballOf(list); focusBall.r = Math.max(focusBall.r, 0.012);
        const fl = (frameIds || focusIds).map((id) => byId[id]).filter(Boolean), fb = fl.length ? ballOf(fl) : focusBall;
        if (base.focusPad || forceFrame) { const r = Math.max(fb.r, 0.05) * (fb.r > 0.45 ? 1.05 : base.focusPad || 1.5); focusFrame = { c: fb.c, hx: r, hy: r, r: fb.r, az: base.az, pol: base.pol }; }
      }
    }
    const f = currentFrame();
    tx.to(f.c.x); ty.to(f.c.y); tz.to(f.c.z); zoom.to(1);
    if (changed) {
      if (sectionId) { az.to(nearestAngle(f.az, az.x), cam); pol.to(f.pol, cam); } else { az.to(az.x); pol.to(0.04, cam); }
    }
    // The cutaway sweeps through whatever is lit: the focused part, or the whole section.
    cutBox.makeEmpty(); entities.forEach((e) => { if (e.sel.target > 0 && e.frame !== false) cutBox.union(e.box); });
    if (changed) cut.snap(0);
    const g = focusBall || f;
    gx.to(g.c.x); gy.to(g.c.y); gz.to(g.c.z); gr.to(g.r); gOn.to(sectionId ? 1 : 0);
    refit(); idle = 0;
    if (snap || reduced) { sibling.snap(); rig.forEach((s) => s.snap()); entities.forEach((e) => { e.sel.snap(); e.tint.snap(); }); }
  }

  // ---- picking ---------------------------------------------------------------
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(x, y) {
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1); raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickMeshes, false).find((h) => h.object.userData.entity.group.visible);
    return hit ? hit.object.userData.entity : null;
  }
  function pick(x, y) {
    let e = pickAt(x, y);
    // Finger-sized forgiveness: try a small ring around the touch point before giving up.
    if (!e && coarse) for (const [dx, dy] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) { e = pickAt(x + dx, y + dy); if (e) break; }
    return e;
  }
  let hot = null;
  function setHot(e) { if (hot === e) return; if (hot) hot.hover.to(0); hot = e; if (hot) hot.hover.to(1); }

  // ---- pointer: orbit tracks the finger 1:1, flicks carry momentum, limits rubber-band ----
  const pointers = new Map();
  let gesture = null, polRaw = pol.x, zoomRaw = 1, lastHover = 0;
  const local = (ev) => { const b = canvas.getBoundingClientRect(); return { x: ev.clientX - b.left, y: ev.clientY - b.top }; };
  const bandPol = (raw) => Math.abs(raw) <= POL_LIMIT ? raw : Math.sign(raw) * (POL_LIMIT + rubberband(Math.abs(raw) - POL_LIMIT, 0.5));
  const bandZoom = (raw) => raw < ZOOM_MIN ? ZOOM_MIN - rubberband(ZOOM_MIN - raw, 0.4) : raw > ZOOM_MAX ? ZOOM_MAX + rubberband(raw - ZOOM_MAX, 0.8) : raw;
  const spread = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    canvas.setPointerCapture(ev.pointerId);
    const p = local(ev); pointers.set(ev.pointerId, p); idle = 0;
    if (pointers.size === 1) {
      // Grab from the live value: freeze orbit springs where they are on screen.
      az.snap(az.x); pol.snap(pol.x); polRaw = pol.x;
      gesture = { mode: 'pending', id: ev.pointerId, x0: p.x, y0: p.y, az0: az.x, pol0: pol.x, hist: [], slop: ev.pointerType === 'mouse' ? 4 : 10 };
      setHot(pick(p.x, p.y)); // feedback on pointer-down
      canvas.dataset.grab = '1';
    } else if (pointers.size === 2) {
      zoom.snap(zoom.x); zoomRaw = zoom.x; setHot(null);
      gesture = { mode: 'pinch', d0: spread(), zoom0: zoom.x };
    }
  });
  canvas.addEventListener('pointermove', (ev) => {
    const p = local(ev);
    if (!pointers.has(ev.pointerId)) {
      // Hover highlight for precise pointers only.
      if (ev.pointerType === 'mouse' && ev.timeStamp - lastHover > 60) { lastHover = ev.timeStamp; const e = pick(p.x, p.y); setHot(e); onHover(e ? e.id : null); }
      return;
    }
    pointers.set(ev.pointerId, p);
    if (!gesture) return;
    if (gesture.mode === 'pinch' && pointers.size === 2) {
      zoomRaw = gesture.zoom0 * (spread() / gesture.d0); zoom.snap(bandZoom(zoomRaw)); return;
    }
    if (ev.pointerId !== gesture.id) return;
    const dx = p.x - gesture.x0, dy = p.y - gesture.y0;
    if (gesture.mode === 'pending' && Math.hypot(dx, dy) > gesture.slop) { gesture.mode = 'orbit'; gesture.x0 = p.x; gesture.y0 = p.y; setHot(null); return; }
    if (gesture.mode !== 'orbit') return;
    az.snap(gesture.az0 - dx * ORBIT_RAD_PER_PX);
    polRaw = gesture.pol0 + dy * ORBIT_RAD_PER_PX; pol.snap(bandPol(polRaw));
    gesture.hist.push({ t: ev.timeStamp, v: az.x }); if (gesture.hist.length > 12) gesture.hist.shift();
  });
  function release(ev, cancelled) {
    if (!pointers.has(ev.pointerId)) return;
    pointers.delete(ev.pointerId); idle = 0;
    if (!gesture) return;
    if (gesture.mode === 'pinch') {
      zoom.to(clamp(zoom.x, ZOOM_MIN, ZOOM_MAX), { response: 0.35, damping: 1 });
      if (pointers.size === 1) { const [id, p] = [...pointers.entries()][0]; az.snap(az.x); gesture = { mode: 'orbit', id, x0: p.x, y0: p.y, az0: az.x, pol0: pol.x, hist: [] }; polRaw = pol.x; }
      else gesture = null;
      return;
    }
    if (ev.pointerId !== gesture.id) return;
    if (gesture.mode === 'orbit') {
      // Hand the finger's velocity to the spring and aim at where the flick would coast to.
      const v = historyVelocity(gesture.hist, ev.timeStamp), flick = Math.abs(v) > 1.2;
      az.v = v; az.to(az.x + project(v, 0.997), { response: 0.45, damping: flick ? 0.8 : 1 });
      pol.to(clamp(pol.x, -POL_LIMIT, POL_LIMIT), { response: 0.4, damping: 1 });
    } else if (!cancelled) {
      const e = hot || pick(gesture.x0, gesture.y0); onPick(e ? e.id : null);
    }
    if (ev.pointerType !== 'mouse') setHot(null);
    gesture = null; delete canvas.dataset.grab;
  }
  canvas.addEventListener('pointerup', (ev) => release(ev, false));
  canvas.addEventListener('pointercancel', (ev) => release(ev, true));
  canvas.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse' && !pointers.size) { setHot(null); onHover(null); } });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault(); idle = 0;
    zoom.to(clamp(zoom.target * Math.exp(-ev.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX), { response: 0.3, damping: 1 });
  }, { passive: false });

  // ---- theme -----------------------------------------------------------------
  function setTheme({ ink, accent, accentLine, light }) {
    theme.ink.set(ink); theme.accent.set(accent); theme.accentLine.set(accentLine); theme.light = light;
    for (const e of entities) if (e.solidMat) { e.solidMat.color.copy(theme.accent); e.solidMat.emissive.copy(theme.accent); e.solidMat.emissiveIntensity = 0.38; }
    glow.material.color.copy(theme.accent); glow.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (points) points.material.color.copy(theme.ink);
    if (shellMat) shellMat.color.copy(theme.ink);
  }
  setTheme({ ink: '#ebf2f0', accent: '#f6641b', accentLine: '#fd9c5d', light: false });

  // ---- frame -----------------------------------------------------------------
  const pv = new THREE.Vector3();
  function projectPoint(p, radius = 0) {
    pv.copy(p).project(camera);
    const depth = camera.position.distanceTo(p);
    return { x: (pv.x * 0.5 + 0.5) * W, y: (-pv.y * 0.5 + 0.5) * H, r: (radius * H) / (2 * depth * TAN), front: pv.z < 1 };
  }
  const scaleAbout = (e, s, c) => { e.group.scale.setScalar(s); e.group.position.copy(c).multiplyScalar(1 - s); };
  // Parts that beat or breathe together move about one shared centre so they stay joined.
  const pulseParts = { heart: entities.filter((e) => e.set === 'heart'), lungs: entities.filter((e) => e.sections.includes('lungs')) };
  const pulseCentre = { heart: ballOf(pulseParts.heart).c, lungs: ballOf(pulseParts.lungs).c };

  let last = performance.now(), ema = 1 / 60, slowFrames = 0, onFrame = () => {}, running = true;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; idle += dt;

    // Body view only: a slow turntable once the user has let go for a few seconds.
    if (!state.section && !reduced && !gesture && idle > 3) az.target += 0.1 * dt;
    rig.forEach((s) => s.step(dt)); sibling.step(dt);

    const live = reduced ? 0 : 1, d = clamp(dim.x, 0, 1), k = theme.light ? 0.8 : 1;
    const b = breath(t) * live;
    root.scale.set(1 + 0.003 * b * (1 - d), 1, 1 + 0.012 * b * (1 - d)); // breathing drift, body view

    // Lines pile up when the model is small on screen, so unselected wire fades with screen scale.
    const dist = fit.x / Math.max(0.2, zoom.x), dens = clamp(H / (2 * dist * TAN) / 1800, 0.16, 1);
    for (const e of entities) {
      e.sel.step(dt); e.tint.step(dt); e.hover.step(dt);
      const tint = clamp(e.tint.x, 0, 1), sel = clamp(e.sel.x, 0, 1), hov = clamp(e.hover.x, 0, 1);
      e.lineMat.opacity = Math.min(1, lerp(e.base * 1.5 * dens * (1 - 0.72 * d) * k, lerp((e.standin ? 0.95 : 0.42 * Math.max(0.3, dens)) * clamp(sibling.x, 0, 1), e.standin ? 0.95 : 0.42, sel), tint) + hov * 0.3);
      e.lineMat.color.copy(theme.ink).lerp(theme.accentLine, tint);
      if (!e.standin) e.lineMat.color.lerp(theme.overLine, sel);
      e.group.visible = e.lineMat.opacity > 0.012 || sel > 0.01; // hidden parts cost nothing and cannot be picked // lines lying on the lit solid stay light in both themes
      if (e.solidMat) {
        const on = sel > 0.01; for (const m of e.solids) m.visible = on;
        // Stand-ins only ever get a light wash of colour, so they never look like a solid scan.
        const op = e.standin ? sel * 0.26 : sel; e.solidMat.opacity = op; e.solidMat.transparent = e.standin || op < 0.995;
      }
    }
    const beat = 1 - 0.035 * contraction(t) * live * clamp(byId.heart_lv.tint.x, 0, 1), fill = 1 + 0.03 * b * clamp(byId.airways.tint.x, 0, 1);
    for (const e of pulseParts.heart) scaleAbout(e, beat, pulseCentre.heart);
    for (const e of pulseParts.lungs) scaleAbout(e, fill, pulseCentre.lungs);

    // Cutaway plane: hides everything on the near side of a plane that sweeps through the lit parts.
    cut.step(dt);
    if (cut.x > 0.004 && !cutBox.isEmpty()) {
      cutPlane.normal.set(cutAxis === 'x' ? -1 : 0, cutAxis === 'y' ? -1 : 0, cutAxis === 'z' ? -1 : 0);
      cutPlane.constant = lerp(cutBox.max[cutAxis] + 0.002, cutBox.min[cutAxis], clamp(cut.x, 0, 1));
    } else cutPlane.constant = 1e6;
    if (points) points.material.opacity = Math.min(1, lerp(0.36, 0.17, d) * (theme.light ? 1.25 : 1));
    if (shellMat) shellMat.opacity = lerp(0.09, 0.035, d) * k;

    const cp = Math.cos(pol.x), drift = 0.004 * Math.sin(t * 0.6) * live * (1 - d);
    camera.position.set(tx.x + dist * Math.sin(az.x) * cp, ty.x + drift + dist * Math.sin(pol.x), tz.x + dist * Math.cos(az.x) * cp);
    camera.lookAt(tx.x, ty.x + drift, tz.x);
    camera.setViewOffset(W, H, -ox.x, -oy.x, W, H);
    camera.updateMatrixWorld();

    glow.position.set(gx.x, gy.x, gz.x); glow.scale.setScalar(Math.max(0.01, gr.x * 3.2));
    glow.material.opacity = clamp(gOn.x, 0, 1) * (theme.light ? 0.34 : 0.6);

    onFrame(dt, t);
    renderer.render(scene, camera);

    // Adaptive quality: step pixel ratio down, then thin the point cloud.
    ema = ema * 0.95 + dt * 0.05;
    if (++slowFrames > 90) {
      slowFrames = 0;
      if (ema > 1 / 42) {
        if (pr > 1) { pr = Math.max(1, pr - 0.25); renderer.setPixelRatio(pr); renderer.setSize(W, H, false); }
        else if (points && pointCount > 6000) { pointCount = Math.floor(pointCount * 0.65); points.geometry.setDrawRange(0, pointCount); }
      }
    }
  }

  resize(); select(null, null, true);
  requestAnimationFrame((now) => { last = now; frame(now); });

  return {
    select, resize, setTheme, pick,
    setRect(r) { rect = r; refit(); },
    setReduced(v) { reduced = v; },
    // Back to the opening angle and zoom, by the shortest way round.
    resetView() { idle = 0; az.to(nearestAngle(0.35, az.x), cam); pol.to(0.04, cam); zoom.to(1); if (reduced) { az.snap(); pol.snap(); zoom.snap(); } },
    // amount 0..1 (0 = off), axis 'z' front, 'x' side, 'y' top
    setCut(amount, axis) { if (axis) cutAxis = axis; cut.to(clamp(amount, 0, 1)); if (reduced) cut.snap(); },
    set onFrame(fn) { onFrame = fn; },
    nudge(dAz, dPol) { idle = 0; az.to(az.target + dAz, { response: 0.35, damping: 1 }); pol.to(clamp(pol.target + dPol, -POL_LIMIT, POL_LIMIT), { response: 0.35, damping: 1 }); },
    zoomBy(f) { idle = 0; zoom.to(clamp(zoom.target * f, ZOOM_MIN, ZOOM_MAX), { response: 0.3, damping: 1 }); },
    projectFocus() { return focusBall ? projectPoint(focusBall.c, focusBall.r) : null; },
    projectEntity(id) { const e = byId[id]; return e ? projectPoint(e.center, e.radius) : null; },
    projectFrame() { const f = currentFrame(); return projectPoint(f.c, f.r); },
    projectY(y) { pv.set(BODY_FRAME.c.x, y, BODY_FRAME.c.z); return projectPoint(pv.clone()); },
    get bodyExtent() { return { top: skinBox.max.y, bottom: skinBox.min.y }; },
    get azimuth() { return az.x; }, get zoom() { return zoom.x; }, get state() { return state; },
    get settled() { return rig.every((s) => s.settled); },
    get quality() { return { pixelRatio: pr, points: pointCount, frameMs: ema * 1000 }; },
    sectionsOf(id) { return byId[id]?.sections || []; },
    stop() { running = false; },
  };
}
