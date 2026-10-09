// Stylised stand-ins for anatomy the HRA library does not include.
// None of this is scan-derived. Shapes and positions are approximate and are drawn as dashed
// contour rings so they never read as real models. Coordinates: metres, +x = patient's left, +z = anterior.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Build a closed-in-v parametric surface: a triangle mesh (for fill and picking) plus contour lines.
function surface(fn, nu, nv, ringEvery = 2, spineEvery = 0) {
  const pos = [];
  for (let u = 0; u <= nu; u++) for (let v = 0; v < nv; v++) { const p = fn(u, v); pos.push(p.x, p.y, p.z); }
  const at = (u, v) => u * nv + (v % nv);
  const tri = [], line = [];
  for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++) tri.push(at(u, v), at(u + 1, v), at(u, v + 1), at(u, v + 1), at(u + 1, v), at(u + 1, v + 1));
  for (let u = 0; u <= nu; u++) if (u % ringEvery === 0) for (let v = 0; v < nv; v++) line.push(at(u, v), at(u, v + 1));
  if (spineEvery) for (let v = 0; v < nv; v += spineEvery) for (let u = 0; u < nu; u++) line.push(at(u, v), at(u + 1, v));
  const attr = new THREE.Float32BufferAttribute(pos, 3);
  const mesh = new THREE.BufferGeometry(); mesh.setAttribute('position', attr); mesh.setIndex(tri); mesh.computeVertexNormals(); mesh.computeBoundingBox();
  const lines = new THREE.BufferGeometry(); lines.setAttribute('position', attr); lines.setIndex(line);
  return { mesh, lines };
}

function tube(points, radius, nu = 36, nv = 12, ringEvery = 2) {
  const curve = new THREE.CatmullRomCurve3(points);
  const pts = curve.getSpacedPoints(nu), fr = curve.computeFrenetFrames(nu, false);
  return surface((u, v) => {
    const r = radius(u / nu), a = (v / nv) * Math.PI * 2;
    return pts[u].clone().addScaledVector(fr.normals[u], Math.cos(a) * r).addScaledVector(fr.binormals[u], Math.sin(a) * r);
  }, nu, nv, ringEvery, nv / 4);
}

function ellipsoid(c, rx, ry, rz, nu = 12, nv = 20) {
  return surface((u, v) => {
    const phi = THREE.MathUtils.lerp(0.06, Math.PI - 0.06, u / nu), th = (v / nv) * Math.PI * 2;
    return V(c.x + rx * Math.sin(phi) * Math.cos(th), c.y + ry * Math.cos(phi), c.z + rz * Math.sin(phi) * Math.sin(th));
  }, nu, nv, 1, nv / 4);
}

function polyline(out, pts, closed = false) {
  for (let i = 0; i < pts.length - 1; i++) out.push(pts[i], pts[i + 1]);
  if (closed) out.push(pts[pts.length - 1], pts[0]);
}
function linesGeometry(segs) {
  const g = new THREE.BufferGeometry().setFromPoints(segs); g.computeBoundingBox(); return g;
}
function mergeLines(a, b) {
  const pa = a.index ? a.toNonIndexed() : a, pb = b.index ? b.toNonIndexed() : b;
  const arr = new Float32Array(pa.attributes.position.count * 3 + pb.attributes.position.count * 3);
  arr.set(pa.attributes.position.array, 0); arr.set(pb.attributes.position.array, pa.attributes.position.count * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3)); g.computeBoundingBox(); return g;
}
const bell = (t, lo, hi, power = 1) => lo + (hi - lo) * Math.pow(Math.sin(Math.PI * t), power);

// Bounds of the male landmarks the stand-ins were drawn against (from the original male files).
// scene.js stretches each stand-in from these to the same landmark in whichever body is loaded.
export const STANDIN_REF = {
  brain: { min: [-0.068, 0.757, -0.085], max: [0.068, 0.903, 0.082] },
  lungs: { min: [-0.125, 0.386, -0.092], max: [0.134, 0.7, 0.097] },
  trunk: { min: [-0.133, 0.28, -0.092], max: [0.136, 0.7, 0.112] },   // lungs, liver and spleen together
  skin: { min: [-0.524, -0.915, -0.161], max: [0.523, 0.915, 0.156] },
};

export function buildStandIns() {
  const out = [];

  // Stomach: a J-shaped sac in the upper left abdomen, between the liver and the spleen.
  const stomach = tube(
    [V(0.045, 0.468, 0.018), V(0.066, 0.452, 0.026), V(0.074, 0.42, 0.032), V(0.071, 0.385, 0.038), V(0.058, 0.352, 0.04), V(0.042, 0.336, 0.038)],
    (t) => bell(t, 0.007, 0.019, 0.8), 30, 14);
  out.push({ id: 'stomach', label: 'Stomach', sections: ['digestive'], standin: true, anchor: 'trunk', mesh: stomach.mesh, lines: stomach.lines });

  // Oesophagus: a narrow tube from the neck to the stomach, behind the trachea and in front of the spine.
  const gullet = tube([V(0.002, 0.70, -0.022), V(0.004, 0.62, -0.03), V(0.01, 0.54, -0.022), V(0.028, 0.49, 0.0), V(0.045, 0.468, 0.018)], () => 0.006, 30, 8, 3);
  out.push({ id: 'oesophagus', label: 'Oesophagus', sections: ['digestive'], standin: true, anchor: 'trunk', mesh: gullet.mesh, lines: gullet.lines });

  // Skull: cranium outline around the brain, eye sockets and a jaw arc.
  const cranium = ellipsoid(V(0, 0.832, -0.002), 0.075, 0.08, 0.091, 10, 24);
  const face = [];
  for (const sx of [-1, 1]) {
    const ring = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ring.push(V(sx * 0.031 + Math.cos(a) * 0.015, 0.8 + Math.sin(a) * 0.014, 0.083)); }
    polyline(face, ring, true);
    polyline(face, [V(sx * 0.066, 0.775, -0.005), V(sx * 0.058, 0.725, 0.012)]);
  }
  const jaw = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI; jaw.push(V(Math.cos(a) * 0.058, 0.718 - Math.sin(a) * 0.012, 0.012 + Math.sin(a) * 0.078)); }
  polyline(face, jaw);
  out.push({ id: 'skull', label: 'Skull', sections: ['skeleton'], standin: true, anchor: 'brain', lines: mergeLines(cranium.lines, linesGeometry(face)) });

  // Rib cage: twelve pairs of arcs from the spine round to the front, plus a breastbone outline.
  const ribs = [];
  for (let i = 0; i < 12; i++) {
    const yb = 0.69 - i * 0.0235, a = 0.07 + 0.075 * Math.sin(Math.min(1, (i + 1) / 8) * Math.PI / 2) - Math.max(0, i - 9) * 0.006;
    const reach = i >= 10 ? 0.55 : i >= 7 ? 0.82 : 1, drop = 0.03 + i * 0.004, front = 0.072 + Math.min(i, 6) * 0.004;
    for (const sx of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 18; k++) {
        const th = (k / 18) * Math.PI * reach;
        pts.push(V(sx * (0.018 + a * Math.pow(Math.sin(th), 0.85)), yb - drop * (1 - Math.cos(th)) / 2, th < Math.PI / 2 ? -0.092 * Math.cos(th) - 0.008 : -front * Math.cos(th) - 0.008));
      }
      polyline(ribs, pts);
    }
  }
  polyline(ribs, [V(-0.018, 0.665, 0.068), V(0.018, 0.665, 0.068), V(0.014, 0.52, 0.09), V(0, 0.495, 0.092), V(-0.014, 0.52, 0.09)], true);
  out.push({ id: 'ribs', label: 'Rib cage', sections: ['skeleton'], standin: true, anchor: 'lungs', lines: linesGeometry(ribs) });

  // Arm bones: straight outlines between joint positions estimated from the skin surface.
  // (Leg bones are real models, so only the arms need a stand-in.)
  const arms = [];
  const bone = (a, b, w) => {
    const d = b.clone().sub(a), n = V(-d.y, d.x, 0).normalize().multiplyScalar(w);
    const p1 = a.clone().addScaledVector(d, 0.1), p2 = a.clone().addScaledVector(d, 0.9);
    polyline(arms, [a, p1.clone().add(n), p2.clone().add(n), b, p2.clone().sub(n), p1.clone().sub(n)], true);
  };
  const joint = (c, r) => { const ring = []; for (let i = 0; i < 10; i++) { const t = (i / 10) * Math.PI * 2; ring.push(V(c.x + Math.cos(t) * r, c.y + Math.sin(t) * r, c.z)); } polyline(arms, ring, true); };
  for (const sx of [-1, 1]) {
    const sh = V(sx * 0.19, 0.6, -0.035), el = V(sx * 0.3, 0.29, -0.02), wr = V(sx * 0.42, 0.056, 0.006), hand = V(sx * 0.49, 0.03, 0.024);
    bone(sh, el, 0.012); bone(el, wr, 0.011); bone(wr, hand, 0.014);
    [[sh, 0.016], [el, 0.013], [wr, 0.01]].forEach(([c, r]) => joint(c, r));
    polyline(arms, [V(sx * 0.02, 0.655, 0.05), sh]); // collarbone
  }
  out.push({ id: 'arms', label: 'Arm bones', sections: ['skeleton'], standin: true, anchor: 'skin', lines: linesGeometry(arms) });

  // Peripheral nerves: a schematic of the main trunks. The library has no peripheral nerves, so every
  // path here is a rough sketch between landmarks, not a traced course. Drawn as lines only.
  const nerves = [];
  const path = (pts, n = 24) => polyline(nerves, new THREE.CatmullRomCurve3(pts).getPoints(n));
  for (const sx of [-1, 1]) {
    // spinal nerve roots: 31 pairs leave the cord (8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 1 coccygeal)
    for (let i = 0; i < 31; i++) { const y = 0.745 - i * 0.0185, z = -0.05 - 0.03 * Math.sin((i / 30) * Math.PI); polyline(nerves, [V(sx * 0.006, y, z), V(sx * 0.032, y - 0.008, z + 0.006)]); }
    // intercostal nerves follow the ribs
    for (let i = 0; i < 11; i++) { const y = 0.675 - i * 0.0235, a = 0.07 + 0.07 * Math.sin(Math.min(1, (i + 1) / 8) * Math.PI / 2); const p = []; for (let k = 0; k <= 12; k++) { const th = (k / 12) * Math.PI * 0.7; p.push(V(sx * (0.03 + a * Math.pow(Math.sin(th), 0.85)), y - 0.012 - (0.03 + i * 0.004) * (1 - Math.cos(th)) / 2, -0.088 * Math.cos(th) - 0.008)); } polyline(nerves, p); }
    // vagus nerve: brainstem, down the neck and chest to the abdomen
    path([V(sx * 0.012, 0.765, -0.02), V(sx * 0.028, 0.7, 0.0), V(sx * 0.03, 0.62, -0.005), V(sx * 0.022, 0.52, -0.02), V(sx * 0.012, 0.44, -0.005), V(sx * 0.02, 0.37, 0.01)]);
    // brachial plexus, then median, ulnar and radial nerves down the arm
    const sh = V(sx * 0.185, 0.585, -0.035), el = V(sx * 0.3, 0.29, -0.02), wr = V(sx * 0.42, 0.056, 0.006);
    for (const y of [0.68, 0.66, 0.64, 0.62]) path([V(sx * 0.03, y, -0.05), V(sx * 0.1, 0.625, -0.04), sh], 10);
    path([sh, V(sx * 0.25, 0.44, -0.012), V(sx * 0.305, 0.29, -0.008), V(sx * 0.365, 0.17, 0.004), V(sx * 0.425, 0.056, 0.014), V(sx * 0.475, 0.025, 0.03)]);            // median
    path([sh, V(sx * 0.24, 0.44, -0.035), V(sx * 0.288, 0.285, -0.036), V(sx * 0.352, 0.16, -0.012), V(sx * 0.41, 0.045, 0.0), V(sx * 0.455, -0.005, 0.02)]);          // ulnar
    path([sh, V(sx * 0.262, 0.45, -0.04), V(sx * 0.318, 0.3, -0.016), V(sx * 0.378, 0.18, 0.012), V(sx * 0.432, 0.075, 0.02), V(sx * 0.482, 0.06, 0.03)]);            // radial
    // lumbar and sacral plexus, femoral nerve down the front of the thigh, sciatic down the back
    for (const y of [0.26, 0.23, 0.2, 0.17]) path([V(sx * 0.03, y, -0.06), V(sx * 0.05, 0.12, -0.05), V(sx * 0.06, 0.06, -0.06)], 8);
    path([V(sx * 0.04, 0.2, -0.045), V(sx * 0.075, 0.08, 0.0), V(sx * 0.1, -0.02, 0.04), V(sx * 0.125, -0.25, 0.035), V(sx * 0.13, -0.42, 0.02), V(sx * 0.165, -0.62, -0.03), V(sx * 0.185, -0.82, -0.06)]); // femoral, saphenous
    const pop = V(sx * 0.15, -0.42, -0.07);
    path([V(sx * 0.035, 0.09, -0.085), V(sx * 0.1, 0.0, -0.09), V(sx * 0.125, -0.2, -0.07), pop]);                                                                  // sciatic
    path([pop, V(sx * 0.17, -0.6, -0.105), V(sx * 0.195, -0.8, -0.115), V(sx * 0.205, -0.89, -0.04)]);                                                           // tibial
    path([pop, V(sx * 0.2, -0.47, -0.06), V(sx * 0.215, -0.62, -0.05), V(sx * 0.225, -0.82, -0.06), V(sx * 0.225, -0.89, 0.0)]);                                 // common fibular
  }
  out.push({ id: 'nerves', label: 'Peripheral nerves', sections: ['nervous'], standin: true, anchor: 'skin', frame: false, base: 0.07, lines: linesGeometry(nerves) });

  return out;
}
