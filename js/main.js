// App glue: state, HUD rendering, bottom sheet, readouts, keyboard.
import { createScene, PARTS, PART_GROUPS } from './scene.js';
import { SECTIONS, SECTION_BY_ID } from './content.js';
import { Spring, project, rubberband, historyVelocity, clamp } from './spring.js';
import { TOURS as ALL_TOURS } from './tours.js';
import { BODY, OTHER_BODY, switchBody } from './body.js';
import { HEART_BPM, TIDAL_ML, FILTER_ML_PER_MIN, heartPhase, ecg, breath, alpha } from './vitals.js';

const $ = (id) => document.getElementById(id);
const app = $('app'), canvas = $('scene'), panel = $('panel'), dock = document.querySelector('.dock');
const mqDesktop = matchMedia('(min-width: 900px)');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const state = { section: null, focus: null, detail: null, openedAt: 0 };
let scene = null, tokens = {};

const pad = (n, w = 2) => String(n).padStart(w, '0');
// Drop parts, pieces and tour steps that the loaded body has no model for (the female set has no urethra).
{
  const known = new Set([...PARTS.map((p) => p.id), ...Object.keys(PART_GROUPS)]), has = (x) => x.parts.some((p) => known.has(p));
  for (const s of SECTIONS) if (s.subs) { s.subs = s.subs.filter(has); for (const x of s.subs) if (x.details) x.details = x.details.filter(has); }
}
const TOURS = ALL_TOURS.map((t) => ({ ...t, steps: t.steps.filter((st) => SECTION_BY_ID[st.section] && (!st.focus || SECTION_BY_ID[st.section].subs?.some((x) => x.id === st.focus))) })).filter((t) => t.steps.length > 1);
const TOTAL = pad(SECTIONS.length);
// The scene entity ids behind a focused part (a part can be several models).
// A name in `parts` is either one model or a whole split organ ('brain' = all twelve brain parts).
const expand = (ids) => (ids ? ids.flatMap((id) => PART_GROUPS[id] || [id]) : null);
const subOf = (sectionId, focus) => SECTION_BY_ID[sectionId]?.subs?.find((x) => x.id === focus) || null;
const detailOf = (sectionId, focus, detail) => subOf(sectionId, focus)?.details?.find((d) => d.id === detail) || null;
const partsOf = (sectionId, focus) => expand(subOf(sectionId, focus)?.parts || null);
// What lights up solid: the part inside the part if one is chosen, otherwise the whole part.
const solidOf = (sectionId, focus, detail) => expand(detailOf(sectionId, focus, detail)?.parts || null) || partsOf(sectionId, focus);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// ---- static HUD pieces ---------------------------------------------------------
const tabsEl = $('tabs');
const tabDefs = [{ id: null, n: '00', tab: 'Body', title: 'Whole body' }, ...SECTIONS];
const tabButtons = tabDefs.map((d) => {
  const b = el('button', d.id ? 'tab' : 'tab tab--body'); b.type = 'button'; b.setAttribute('aria-pressed', String(!d.id));
  b.setAttribute('aria-label', `${d.n} ${d.id ? SECTION_BY_ID[d.id].kicker + ': ' + d.title : 'Whole body view'}`);
  b.append(el('span', 'tab__n', d.n), el('span', 'tab__name', d.tab));
  b.addEventListener('click', () => select(d.id));
  tabsEl.append(b); return b;
});
{ const strip = $('strip'); strip.replaceChildren(...SECTIONS.map(() => el('i'))); }
// Keep the active tab in view when the strip scrolls (small screens). Sets scrollLeft directly.
function revealTab(i) {
  const b = tabButtons[i]; if (!b || tabsEl.scrollWidth <= tabsEl.clientWidth) return;
  const target = b.offsetLeft - (tabsEl.clientWidth - b.offsetWidth) / 2;
  tabsEl.scrollTo({ left: Math.max(0, target), behavior: mqReduce.matches ? 'auto' : 'smooth' });
}
tabsEl.addEventListener('keydown', (ev) => {
  const i = tabButtons.indexOf(document.activeElement); if (i < 0) return;
  const next = ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'Home' ? 0 : ev.key === 'End' ? tabButtons.length - 1 : -1;
  if (next < 0 || next >= tabButtons.length) return;
  ev.preventDefault(); tabButtons[next].focus();
});

// One cell per organ: the sub-parts of a split organ share a cell.
const cellKey = (p) => p.set || p.id;
const portCells = {};
for (const p of PARTS) if (!portCells[cellKey(p)]) { const c = el('i', 'ports__cell' + (p.standin ? ' is-standin' : '')); $('ports').append(c); portCells[cellKey(p)] = c; }
const CELL_TOTAL = Object.keys(portCells).length;
const byPartId = Object.fromEntries(PARTS.map((p) => [p.id, p]));

// Compass tape: ticks every 10 degrees, labels every 30. It slides 1:1 with the orbit.
const TAPE_PX_PER_DEG = 2.4;
{
  const track = $('tape');
  for (let d = -720; d <= 720; d += 10) {
    if (d % 30 === 0) { const s = el('span', '', pad(((d % 360) + 360) % 360, 3)); s.style.left = `${d * TAPE_PX_PER_DEG}px`; track.append(s); }
    else { const i = el('i'); i.style.left = `${d * TAPE_PX_PER_DEG}px`; track.append(i); }
  }
}
const rulerTicks = Array.from({ length: 19 }, () => { const i = el('i'); $('ruler').append(i); return i; });
const rulerTop = document.querySelector('.ruler__label--top'), rulerBottom = document.querySelector('.ruler__label--bottom');

// ---- bottom sheet (small screens): 1:1 drag, momentum projection, rubber-band ends ----
const sheet = (() => {
  const y = new Spring(2000, { response: 0.35, damping: 1 });
  let full = 0, det = { hidden: 2000, peek: 0, half: 0, full: 0 }, name = 'hidden', drag = null, applied = null, swallowClick = false;
  const grab = $('grab'), scroller = $('panel-scroll');
  function measure() {
    full = panel.offsetHeight;
    const head = $('panel-head').offsetHeight;
    det = { hidden: full + 24, peek: full - Math.min(full, 44 + head + (tour.active ? 14 : 88)), half: full - Math.min(full, Math.round(innerHeight * 0.46)), full: 0 };
  }
  function go(n, v = 0, flick = false) {
    name = n; y.v = v; y.to(det[n], { response: 0.35, damping: flick ? 0.8 : 1 });
    if (mqReduce.matches) y.snap();
    grab.setAttribute('aria-expanded', String(n === 'half' || n === 'full'));
    $('grab-text').textContent = n === 'full' ? 'Collapse' : 'Details';
    // Keep the end of the content reachable at the half detent.
    scroller.style.paddingBottom = `${32 + (n === 'half' ? det.half : 0)}px`;
    updateRect();
  }
  function down(ev) {
    if (mqDesktop.matches || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    if (ev.target.closest('.tour')) return; // tour buttons live in the header; let them take their own taps
    ev.currentTarget.setPointerCapture(ev.pointerId);
    y.snap(y.x); // grab from the live position, even mid-animation
    drag = { id: ev.pointerId, y0: ev.clientY, start: y.x, moved: false, hist: [] };
  }
  function move(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    let dy = ev.clientY - drag.y0;
    if (!drag.moved) { if (Math.abs(dy) < 6) return; drag.moved = true; drag.y0 = ev.clientY; dy = 0; }
    const raw = drag.start + dy;
    const v = raw < 0 ? -rubberband(-raw, 220) : raw > det.peek ? det.peek + rubberband(raw - det.peek, 220) : raw;
    y.snap(v); drag.hist.push({ t: ev.timeStamp, v }); if (drag.hist.length > 12) drag.hist.shift();
  }
  function up(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
    const v = historyVelocity(d.hist, ev.timeStamp), landing = y.x + project(v);
    const n = ['peek', 'half', 'full'].reduce((a, b) => (Math.abs(det[b] - landing) < Math.abs(det[a] - landing) ? b : a));
    go(n, v, Math.abs(v) > 500);
  }
  for (const h of [grab, $('panel-head')]) {
    h.addEventListener('pointerdown', down); h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  }
  grab.addEventListener('click', () => { if (swallowClick) return; go(name === 'peek' ? 'half' : name === 'half' ? 'full' : 'peek'); });
  return {
    measure, go,
    step(dt) {
      if (mqDesktop.matches) { if (applied !== null) { panel.style.transform = ''; applied = null; } return; }
      y.step(dt);
      const v = Math.round(y.x * 2) / 2;
      if (v !== applied) { applied = v; panel.style.transform = `translate3d(0, ${v}px, 0)`; }
    },
    resync() { measure(); y.snap(det[name]); },
    get name() { return name; },
    get visible() { return Math.max(0, full - det[name]); },
    get liveVisible() { return Math.max(0, full - y.x); },
  };
})();

// ---- layout: the free rectangle the camera should frame the subject in ----------
function updateRect() {
  if (!scene) return;
  const W = innerWidth, H = innerHeight, dockH = dock.offsetHeight;
  let rect;
  if (mqDesktop.matches) {
    rect = state.section ? { l: 32 + 300 + 56, r: W - 32 - 360 - 56, t: 130, b: H - dockH - 44 } : { l: 220, r: W - 220, t: 124, b: H - dockH - 60 };
  } else {
    const top = document.querySelector('.gauge').getBoundingClientRect().bottom + 14;
    const covered = state.section ? Math.min(sheet.visible, Math.round(H * 0.46)) : 40;
    rect = { l: 14, r: W - 14, t: top, b: H - dockH - covered - 14 };
  }
  scene.setRect(rect);
}

// ---- section rendering ------------------------------------------------------------
let counterRun = 0;
function countUp(node, to, fmt, run) {
  if (mqReduce.matches) { node.textContent = fmt(to); return; }
  const start = performance.now(), dur = 900;
  const tick = (now) => {
    if (run !== counterRun) return;
    const p = clamp((now - start) / dur, 0, 1), eased = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(Math.round(to * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  node.textContent = fmt(0); requestAnimationFrame(tick);
}

function renderSection() {
  const s = SECTION_BY_ID[state.section]; if (!s) return;
  const run = ++counterRun;
  $('kicker').textContent = `${s.n} / ${TOTAL}`; $('kicker-2').textContent = `${s.n} / ${TOTAL} · ${s.kicker}`;
  $('title-text').textContent = s.title;
  document.querySelectorAll('.title__echo').forEach((n) => { n.textContent = s.title; });
  $('about').textContent = s.about;

  const stats = $('stats'); stats.replaceChildren(); $('stats-block').hidden = !s.stats;
  for (const st of s.stats || []) {
    const row = el('div'), dd = el('dd');
    row.append(el('dt', '', st.label), dd); stats.append(row);
    if (st.text) dd.textContent = st.text; else countUp(dd, st.value, (v) => `${st.prefix || ''}${v}${st.suffix || ''}`, run);
  }
  const phys = $('phys'); phys.replaceChildren(); $('phys-block').hidden = !s.physiology;
  for (const p of s.physiology || []) phys.append(el('li', '', p));

  const subs = $('subs'); subs.replaceChildren(); $('parts-block').hidden = !s.subs;
  for (const sub of s.subs || []) {
    const b = el('button', 'chip', sub.label); b.type = 'button'; b.dataset.id = sub.id; b.setAttribute('aria-pressed', 'false');
    if (sub.standin) { b.dataset.standin = ''; b.setAttribute('aria-label', `${sub.label}, stylised stand-in`); }
    b.addEventListener('click', () => select(state.section, { focus: state.focus === sub.id ? null : sub.id }));
    subs.append(b);
  }
  $('standin-note').textContent = s.note || '';

  document.querySelector('.panel__col--data').hidden = false;
  resetCut();
  const r = s.readout; document.querySelector('.readout').hidden = !r;
  if (!r) { readout.kind = null; return; }
  $('readout-label').textContent = r.label; $('readout-unit').textContent = r.unit || ''; $('readout-note').textContent = r.note;
  readout.kind = r.kind; readout.text = null;
  if (r.kind === 'pulse') { readout.hold = true; countUp($('readout-value'), HEART_BPM, String, run); setTimeout(() => { if (run === counterRun) readout.hold = false; }, 950); }
  else { readout.hold = false; if (r.value) $('readout-value').textContent = r.value; }
}

function renderFocus() {
  const s = SECTION_BY_ID[state.section];
  document.querySelectorAll('#subs .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.focus)));
  const tag = $('tag');
  if (!s || !s.subs) { tag.classList.remove('is-on'); renderDetails(null); return; }
  const i = s.subs.findIndex((x) => x.id === state.focus), sub = s.subs[i];
  $('sub-note').textContent = sub ? sub.note : s.subsNote || '';
  renderDetails(sub);
  if (!sub) { tag.classList.remove('is-on'); tagBox = null; return; }
  const di = sub.details ? sub.details.findIndex((d) => d.id === state.detail) : -1, det = di >= 0 ? sub.details[di] : null;
  $('tag-n').textContent = pad((det ? di : i) + 1); $('tag-name').textContent = det ? det.label : sub.label; $('tag-flag').hidden = !sub.standin;
  const box = $('tag-box'); tagBox = { w: box.offsetWidth, h: box.offsetHeight };
  requestAnimationFrame(() => { if (tagBox) tagBox = { w: box.offsetWidth, h: box.offsetHeight }; }); // again once the new label has laid out
  tagP.snap(0).to(1); if (mqReduce.matches) tagP.snap(1);
  tag.classList.add('is-on');
}

// Second level: the parts inside the focused part (lobes of the brain, layers of the kidney and so on).
let detailsFor = null;
function renderDetails(sub) {
  const block = $('detail-block'), has = !!(sub && sub.details);
  block.hidden = !has;
  if (!has) { detailsFor = null; return; }
  if (detailsFor !== sub) {
    detailsFor = sub; $('detail-title').textContent = `Inside the ${sub.inside || sub.label.toLowerCase()}`;
    $('details').replaceChildren(...sub.details.map((d) => {
      const b = el('button', 'chip', d.label); b.type = 'button'; b.dataset.id = d.id;
      b.addEventListener('click', () => select(state.section, { focus: sub.id, detail: state.detail === d.id ? null : d.id }));
      return b;
    }));
  }
  document.querySelectorAll('#details .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.detail)));
  $('detail-note').textContent = sub.details.find((d) => d.id === state.detail)?.note || '';
}

// ---- selection ------------------------------------------------------------------------
const leaderP = new Spring(0, { response: 0.45, damping: 1 }), tagP = new Spring(0, { response: 0.35, damping: 1 });
const ringO = new Spring(0, { response: 0.5, damping: 1 });
let tagBox = null, headAnchor = null;

function select(id, { focus = null, detail = null, snap = false, fromTour = false } = {}) {
  if (tour.active && !fromTour) endTour(); // the user took the controls
  if (!detailOf(id, focus, detail)) detail = null;
  if (id === state.section && focus === state.focus && detail === state.detail) return;
  const sectionChanged = id !== state.section;
  state.section = id; state.focus = focus; state.detail = detail;
  const frameParts = partsOf(id, focus), focusParts = solidOf(id, focus, detail);

  if (mqReduce.matches && sectionChanged && !snap) {
    // Reduced motion: no camera travel. Cross-fade the canvas around an instant reframe.
    app.dataset.swap = ''; setTimeout(() => { scene.select(state.section, solidOf(state.section, state.focus, state.detail), true, partsOf(state.section, state.focus), !!state.detail); delete app.dataset.swap; }, 150);
  } else scene.select(id, focusParts, snap, frameParts, !!detail);

  app.dataset.view = id || 'body';
  tabButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(tabDefs[i].id === id)));
  if (sectionChanged) revealTab(tabDefs.findIndex((d) => d.id === id));
  document.querySelectorAll('#strip i').forEach((n, i) => n.classList.toggle('is-on', SECTIONS[i].id === id));
  const lit = new Set(PARTS.filter((p) => !!id && p.sections.includes(id) && (!focusParts || focusParts.includes(p.id))).map(cellKey));
  for (const [k, c] of Object.entries(portCells)) c.classList.toggle('is-active', lit.has(k));
  $('about-block').hidden = !!focus; // a focused part brings its own note; fold the section text away
  const s = SECTION_BY_ID[id];

  if (sectionChanged) {
    if (s) {
      app.dataset.hud = 'out'; renderSection(); void panel.offsetWidth; app.dataset.hud = 'in';
      state.openedAt = performance.now(); panel.inert = false;
      leaderP.snap(0).to(1); ringO.to(1); if (mqReduce.matches) { leaderP.snap(1); ringO.snap(1); }
      if (!mqDesktop.matches) sheet.go(sheet.name === 'hidden' ? 'peek' : sheet.name);
      headAnchor = null;
    } else {
      app.dataset.hud = 'out'; panel.inert = true; sheet.go('hidden'); leaderP.to(0); ringO.to(0);
    }
  }
  renderFocus(); updateRect();

  const sub = s?.subs?.find((x) => x.id === focus), det = detailOf(id, focus, detail);
  $('live').textContent = det ? `${det.label}. ${det.note}` : sub ? `${sub.label}${sub.standin ? ', stylised stand-in' : ''}. ${sub.note}` : s ? `${s.title} selected. ${s.about.split('. ')[0]}.` : 'Whole body view.';
  history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
}

// ---- reset ---------------------------------------------------------------------------
// One press from anywhere: whole body, opening angle and zoom, no cutaway, no tour.
function resetAll() {
  if (!scene) return;
  if (tour.active) endTour();
  select(null); resetCut(); scene.resetView();
  $('live').textContent = 'View reset. Whole body view.';
}
$('reset-btn').addEventListener('click', resetAll);

// ---- search and index ----------------------------------------------------------------
// Every section, part and piece, in reading order. Extra words are everyday names people might type.
const ALSO = { 'Trachea and bronchi': 'windpipe airway', Patella: 'kneecap', Tibia: 'shin bone', Femur: 'thigh bone', 'Sacrum and coccyx': 'tailbone', 'Large intestine': 'colon bowel', 'Small intestine': 'bowel gut',
  Stomach: 'oesophagus esophagus gullet', 'Caecum and appendix': 'cecum', Spine: 'backbone vertebrae vertebra', 'Rib cage': 'ribs sternum breastbone', Skull: 'cranium head', 'Leg bones': 'knee', 'Arm bones': 'humerus radius ulna',
  Bladder: 'urinary bladder', Vessels: 'blood circulation', Brainstem: 'midbrain pons medulla', 'Deep nuclei': 'thalamus hypothalamus basal ganglia', 'Limbic structures': 'hippocampus amygdala cingulate',
  'Peripheral nerves': 'sciatic vagus femoral median ulnar radial', 'Aorta and vessels': 'vena cava coronary', 'Pyramids': 'medulla', 'White matter': 'corpus callosum', Thymus: 'immune', 'Fluid chambers and ciliary body': 'vitreous aqueous' };
const INDEX = [];
for (const s of SECTIONS) {
  INDEX.push({ label: s.kicker, path: `Section ${s.n}`, level: 0, section: s.id, group: s.kicker, also: s.title });
  for (const sub of s.subs || []) {
    INDEX.push({ label: sub.label, path: s.kicker, level: 1, section: s.id, focus: sub.id, standin: !!sub.standin, group: s.kicker });
    for (const d of sub.details || []) INDEX.push({ label: d.label, path: `${s.kicker} › ${sub.label}`, level: 2, section: s.id, focus: sub.id, detail: d.id, group: s.kicker });
  }
}
for (const e of INDEX) e.hay = `${e.label} ${ALSO[e.label] || ''} ${e.also || ''}`.toLowerCase();
const finder = $('finder'), finderInput = $('finder-input'), finderList = $('finder-list');
function finderItem(e, first) {
  const b = el('button', 'finder__item' + (first ? ' is-first' : '')); b.type = 'button'; b.dataset.level = String(e.flat ? 0 : e.level);
  b.append(el('strong', '', e.label), el('small', '', e.path)); if (e.standin) b.append(el('em', '', 'Stylised'));
  b.addEventListener('click', () => { finder.close(); select(e.section, { focus: e.focus || null, detail: e.detail || null }); if (!mqDesktop.matches) sheet.go('peek'); });
  return b;
}
function renderFinder() {
  const q = finderInput.value.trim().toLowerCase(), nodes = [];
  if (!q) {
    // No query: the full index, grouped by section.
    let group = null;
    for (const e of INDEX) { if (e.level === 0) { group = e.group; nodes.push(el('p', 'label finder__group', `${SECTION_BY_ID[e.section].n} ${e.group}`)); } nodes.push(finderItem(e, false)); }
    $('finder-count').textContent = `${INDEX.length} entries`;
  } else {
    const words = q.split(/\s+/), hits = INDEX.filter((e) => words.every((w) => e.hay.includes(w)));
    // Names that start with the query come first, then shallower entries.
    hits.sort((a, b) => (b.label.toLowerCase().startsWith(q) - a.label.toLowerCase().startsWith(q)) || a.level - b.level);
    hits.forEach((e, i) => nodes.push(finderItem({ ...e, flat: true }, i === 0)));
    if (!hits.length) nodes.push(el('p', 'finder__empty', `Nothing here is called “${finderInput.value.trim()}”. The model has no muscles, hand or foot bones, limb vessels or female anatomy. Clear the box to browse everything.`));
    $('finder-count').textContent = hits.length === 1 ? '1 match' : `${hits.length} matches`;
  }
  finderList.replaceChildren(...nodes); finderList.scrollTop = 0;
}
function openFinder() { if (finder.open) return; finderInput.value = ''; renderFinder(); finder.showModal(); finderInput.focus(); }
finderInput.addEventListener('input', renderFinder);
finderInput.addEventListener('keydown', (ev) => {
  const items = finderList.querySelectorAll('.finder__item');
  if (ev.key === 'Enter' && finderInput.value.trim() && items[0]) { ev.preventDefault(); items[0].click(); }
  else if (ev.key === 'ArrowDown' && items[0]) { ev.preventDefault(); items[0].focus(); }
  // A search box swallows the first Escape to clear itself; close the dialog in one press instead.
  else if (ev.key === 'Escape') { ev.preventDefault(); finder.close(); }
});
finderList.addEventListener('keydown', (ev) => {
  const items = [...finderList.querySelectorAll('.finder__item')], i = items.indexOf(document.activeElement); if (i < 0) return;
  if (ev.key === 'ArrowDown' && items[i + 1]) { ev.preventDefault(); items[i + 1].focus(); }
  else if (ev.key === 'ArrowUp') { ev.preventDefault(); (items[i - 1] || finderInput).focus(); }
});
$('search-btn').addEventListener('click', openFinder);
$('menu-btn').addEventListener('click', () => $('menu').showModal());
$('menu-theme').addEventListener('click', () => { $('theme-btn').click(); });
const bodyLabel = OTHER_BODY === 'female' ? 'Female' : 'Male';
$('body-btn').textContent = bodyLabel; $('body-btn').setAttribute('aria-label', `Switch to the ${OTHER_BODY} body. Reloads the model.`);
$('menu-body').firstChild.textContent = `${bodyLabel} body`;
$('body-btn').addEventListener('click', switchBody); $('menu-body').addEventListener('click', switchBody);
$('wordmark').textContent = `Anatomy Motion · ${BODY} model`;
$('menu-credits').addEventListener('click', () => { $('menu').close(); $('credits').showModal(); });

// ---- guided tours ---------------------------------------------------------------------
const tour = { active: null, i: 0 };
function showStep() {
  const t = tour.active, step = t.steps[tour.i], n = t.steps.length;
  select(step.section, { focus: step.focus || null, fromTour: true });
  if (step.axis) { cutAxis = step.axis; cutAxes.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.axis === cutAxis))); }
  cutInput.value = String(step.cut || 0); applyCut();
  $('tour-name').textContent = t.title; $('tour-step').textContent = `${pad(tour.i + 1)} / ${pad(n)}`;
  $('tour-text').textContent = step.text;
  [...$('tour-bar').children].forEach((d, k) => { d.classList.toggle('is-done', k < tour.i); d.classList.toggle('is-now', k === tour.i); });
  $('tour-prev').disabled = tour.i === 0;
  $('tour-next').textContent = tour.i === n - 1 ? 'Finish' : 'Next';
  $('live').textContent = `Step ${tour.i + 1} of ${n}. ${step.text}`;
}
function startTour(id) {
  const t = TOURS.find((x) => x.id === id); if (!t) return;
  tour.active = t; tour.i = 0; app.dataset.tour = '';
  $('tour-bar').replaceChildren(...t.steps.map(() => el('i'))); $('tour').hidden = false;
  showStep(); sheet.resync(); sheet.go('peek'); headAnchor = null;
}
function endTour() {
  if (!tour.active) return;
  tour.active = null; delete app.dataset.tour; $('tour').hidden = true;
  sheet.resync(); headAnchor = null; updateRect();
}
$('tour-next').addEventListener('click', () => { if (!tour.active) return; if (tour.i >= tour.active.steps.length - 1) endTour(); else { tour.i++; showStep(); } });
$('tour-prev').addEventListener('click', () => { if (tour.active && tour.i > 0) { tour.i--; showStep(); } });
$('tour-end').addEventListener('click', endTour);
for (const t of TOURS) {
  const b = el('button'); b.type = 'button';
  b.append(el('strong', '', t.title), el('span', 'label', `${t.steps.length} steps`), el('small', '', t.blurb));
  b.addEventListener('click', () => { $('tours').close(); startTour(t.id); });
  $('tour-list').append(b);
}
$('tours-btn').addEventListener('click', () => $('tours').showModal());

// ---- cutaway ---------------------------------------------------------------------------
const cutInput = $('cut'), cutAxes = [...document.querySelectorAll('#cut-axes button')];
let cutAxis = 'z';
function applyCut() {
  const v = Number(cutInput.value);
  cutInput.style.setProperty('--fill', `${(v / 90) * 100}%`);
  $('cut-out').textContent = v ? `${Math.round((v / 90) * 100)}%` : 'Off';
  if (scene) scene.setCut(v / 100, cutAxis);
}
function resetCut() { cutInput.value = '0'; applyCut(); }
cutInput.addEventListener('input', applyCut);
cutAxes.forEach((b) => b.addEventListener('click', () => {
  cutAxis = b.dataset.axis; cutAxes.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  applyCut();
}));

function onPick(entityId) {
  const secs = entityId ? scene.sectionsOf(entityId) : [];
  if (!secs.length) { if (state.focus) select(state.section); return; }
  if (!secs.includes(state.section)) { select(secs[0]); return; }
  // Already in this part's section: focus the part it belongs to (tap again to clear).
  const sub = SECTION_BY_ID[state.section].subs?.find((x) => expand(x.parts).includes(entityId));
  if (!sub) return;
  // Inside an already focused part, a tap picks the piece under the finger (tap it again to step back out).
  const piece = state.focus === sub.id ? sub.details?.find((d) => expand(d.parts).includes(entityId)) : null;
  if (piece) select(state.section, { focus: sub.id, detail: state.detail === piece.id ? null : piece.id });
  else select(state.section, { focus: state.focus === sub.id ? null : sub.id });
}

// ---- live readout traces ----------------------------------------------------------------
const readout = { kind: null, text: null, hold: false, ctx: $('readout-trace').getContext('2d'), w: 176, h: 56 };
function sizeTrace() {
  const c = $('readout-trace'), dpr = Math.min(2, devicePixelRatio || 1);
  readout.w = c.clientWidth || 176; readout.h = c.clientHeight || 56;
  c.width = Math.round(readout.w * dpr); c.height = Math.round(readout.h * dpr);
  readout.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function setReadout(text) { if (readout.hold || text === readout.text) return; readout.text = text; $('readout-value').textContent = text; }
function drawReadout(t) {
  const { ctx, w, h, kind } = readout; if (!kind) return;
  const live = mqReduce.matches ? 0.4 : t; // reduced motion: one still frame of the trace
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = tokens.line; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(0, h - 0.5); ctx.lineTo(w, h - 0.5); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.strokeStyle = tokens.accentText; ctx.fillStyle = tokens.accentText; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
  const trace = (fn) => { ctx.beginPath(); for (let x = 0; x <= w; x += 1) { const y = fn(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
  if (kind === 'pulse') {
    trace((x) => h * 0.72 - ecg(heartPhase(live - (w - x) / 70)) * h * 0.58);
    setReadout(String(HEART_BPM));
  } else if (kind === 'volume') {
    trace((x) => h - 6 - breath(live - (w - x) / 22) * (h - 14));
    setReadout(mqReduce.matches ? `≈ ${TIDAL_ML}` : pad(Math.round(breath(t) * TIDAL_ML), 3));
  } else if (kind === 'eeg') {
    trace((x) => h * 0.5 - alpha((live * 0.35) - (w - x) / 260) * h * 0.3);
  } else if (kind === 'filter') {
    const secs = (performance.now() - state.openedAt) / 1000, n = 30, on = Math.floor(secs / 2) % (n + 1);
    for (let i = 0; i < n; i++) { ctx.globalAlpha = i < on ? 1 : 0.25; ctx.fillRect(i * (w / n), h - 8 - (i % 5 === 0 ? 18 : 10), Math.max(1.5, w / n - 3), i % 5 === 0 ? 18 : 10); }
    ctx.globalAlpha = 1;
    setReadout(String(Math.floor((secs * FILTER_ML_PER_MIN) / 60)));
  } else if (kind === 'parts') {
    const subs = SECTION_BY_ID[state.section]?.subs || [], n = subs.length, i = subs.findIndex((x) => x.id === state.focus), gap = 4, bw = (w - gap * (n - 1)) / n;
    subs.forEach((sub, k) => {
      const x = k * (bw + gap), y = h - 22;
      ctx.setLineDash(sub.standin ? [3, 3] : []); ctx.strokeStyle = k === i ? tokens.accentText : tokens.line; ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, bw - 1.5, 12);
      if (k === i) ctx.fillRect(x + 3, y + 3, bw - 6, 7.5);
    });
    ctx.setLineDash([]);
    setReadout(i >= 0 ? `${pad(i + 1)}/${pad(n)}` : pad(n));
  }
}

// ---- per-frame HUD sync (transform and opacity only) ----------------------------------------
const needle = $('gauge-needle'), tape = $('tape'), gaugeZoom = $('gauge-zoom'), rings = $('rings');
const leader = $('leader'), leaderLine = $('leader-line'), leaderDot = $('leader-dot'), leaderEnd = $('leader-end');
const tagEl = $('tag'), tagLine = $('tag-line'), tagBoxEl = $('tag-box');
let lastAz = null, lastZoom = null;
const setLine = (node, x1, y1, x2, y2, p) => { node.style.transform = `translate(${x1}px, ${y1}px) rotate(${Math.atan2(y2 - y1, x2 - x1)}rad) scaleX(${Math.max(0.001, Math.hypot(x2 - x1, y2 - y1) * p)})`; };

function onFrame(dt, t) {
  sheet.step(dt); leaderP.step(dt); tagP.step(dt); ringO.step(dt);
  const W = innerWidth, H = innerHeight;

  const deg = (scene.azimuth * 180) / Math.PI, wrapped = ((deg % 360) + 360) % 360;
  needle.style.transform = `rotate(${wrapped}deg)`;
  tape.style.transform = `translate3d(${-(deg % 360) * TAPE_PX_PER_DEG}px, 0, 0)`;
  const azText = pad(Math.round(wrapped) % 360, 3) + '°';
  if (azText !== lastAz) { lastAz = azText; $('gauge-az').textContent = azText; }
  const zText = `Zoom ${scene.zoom.toFixed(1)}×`;
  if (zText !== lastZoom) { lastZoom = zText; $('gauge-zoom-text').textContent = zText; gaugeZoom.style.strokeDasharray = `${clamp((scene.zoom - 0.7) / 1.7, 0, 1) * 100} 100`; }

  if (!state.section) {
    const ext = scene.bodyExtent, top = scene.projectY(ext.top), bottom = scene.projectY(ext.bottom), cm = (ext.top - ext.bottom) * 100, x = Math.min(W - 30, Math.max(top.x, bottom.x) + (bottom.y - top.y) * 0.33);
    rulerTicks.forEach((n, i) => { n.style.transform = `translate(${x}px, ${bottom.y + (top.y - bottom.y) * Math.min(1, (i * 10) / cm)}px)`; });
    rulerTop.style.transform = `translate(${x - 44}px, ${top.y - 20}px)`; rulerBottom.style.transform = `translate(${x - 14}px, ${bottom.y + 6}px)`;
  }

  const f = scene.projectFrame();
  rings.style.opacity = String(clamp(ringO.x, 0, 1) * 0.9);
  rings.style.transform = `translate(${f.x}px, ${f.y}px) scale(${(Math.max(40, f.r) * 1.3 / 150) * (0.92 + 0.08 * clamp(ringO.x, 0, 1))})`;

  const showLeader = !!state.section && (mqDesktop.matches || sheet.name !== 'full');
  leader.classList.toggle('is-on', showLeader);
  if (state.section) {
    let ax, ay;
    if (mqDesktop.matches) {
      if (!headAnchor) { const b = $('panel-head').getBoundingClientRect(); headAnchor = { x: b.left - 20, y: b.top + 66 }; }
      ({ x: ax, y: ay } = headAnchor);
    } else { ax = 30; ay = H - dock.offsetHeight - sheet.liveVisible; }
    const dx = ax - f.x, dy = ay - f.y, len = Math.hypot(dx, dy) || 1, off = Math.min(f.r * 0.55, len * 0.5);
    const sx = f.x + (dx / len) * off, sy = f.y + (dy / len) * off, p = clamp(leaderP.x, 0, 1);
    setLine(leaderLine, sx, sy, ax, ay, p);
    leaderDot.style.transform = `translate(${sx}px, ${sy}px)`;
    leaderEnd.style.transform = `translate(${ax}px, ${ay}px) scale(${p > 0.96 ? 1 : 0})`;
  }

  if (state.focus && tagBox) {
    const e = scene.projectFocus();
    if (e) {
      const bx = clamp(e.x + e.r * 0.5 + 30, 8, W - tagBox.w - 8), by = clamp(e.y - e.r * 0.5 - 30 - tagBox.h, 150, H);
      tagBoxEl.style.transform = `translate(${bx}px, ${by}px)`;
      setLine(tagLine, e.x + e.r * 0.2, e.y - e.r * 0.2, bx, by + tagBox.h, clamp(tagP.x, 0, 1));
    }
  }
  if (state.section) drawReadout(t);
}

// ---- theme ---------------------------------------------------------------------------------
function applyTheme() {
  const cs = getComputedStyle(document.documentElement), get = (n) => cs.getPropertyValue(n).trim();
  const light = document.documentElement.dataset.theme === 'light';
  tokens = { ink: get('--color-text-primary'), accent: get('--color-accent-solid'), accentText: get('--color-accent-text'), line: get('--color-line'), bg: get('--color-bg-page') };
  $('theme-color').content = tokens.bg;
  $('theme-btn').textContent = light ? 'Dark' : 'Light';
  $('theme-btn').setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
  $('menu-theme').firstChild.textContent = light ? 'Dark theme' : 'Light theme';
  if (scene) scene.setTheme({ ink: tokens.ink, accent: tokens.accent, accentLine: tokens.accentText, light });
}
$('theme-btn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next; try { localStorage.setItem('anatomy-theme', next); } catch (e) { /* private mode */ }
  applyTheme();
});
$('credits-btn').addEventListener('click', () => $('credits').showModal());

// ---- keyboard --------------------------------------------------------------------------------
canvas.addEventListener('keydown', (ev) => {
  if (!scene) return;
  const k = ev.key;
  if (k === 'ArrowLeft') scene.nudge(-0.26, 0); else if (k === 'ArrowRight') scene.nudge(0.26, 0);
  else if (k === 'ArrowUp') scene.nudge(0, 0.12); else if (k === 'ArrowDown') scene.nudge(0, -0.12);
  else if (k === '+' || k === '=') scene.zoomBy(1.2); else if (k === '-') scene.zoomBy(1 / 1.2);
  else return;
  ev.preventDefault();
});
document.addEventListener('keydown', (ev) => {
  if (!scene || document.querySelector('dialog[open]') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key === '/' && !/INPUT|TEXTAREA/.test(ev.target.tagName)) { ev.preventDefault(); openFinder(); }
  else if (ev.key === 'Home' && ev.target.type !== 'range') { ev.preventDefault(); resetAll(); }
  else if (ev.key === 'Escape' && tour.active) endTour();
  else if (ev.key === 'Escape' && state.section) { if (state.detail) select(state.section, { focus: state.focus }); else if (state.focus) select(state.section); else select(null); }
  else if (/^[0-9]$/.test(ev.key) && tabDefs[Number(ev.key)] && !/INPUT|TEXTAREA/.test(ev.target.tagName)) select(tabDefs[Number(ev.key)].id);
});

// ---- boot ---------------------------------------------------------------------------------------
function onResize() { if (!scene) return; scene.resize(); sheet.resync(); sizeTrace(); headAnchor = null; updateRect(); }

async function boot() {
  applyTheme();
  try {
    scene = await createScene(canvas, {
      onProgress(done, total, id) {
        const cell = byPartId[id] && portCells[cellKey(byPartId[id])]; if (cell) cell.classList.add('is-loaded');
        const n = document.querySelectorAll('.ports__cell.is-loaded').length - 2; // minus the two key swatches
        $('ports-count').textContent = `${pad(Math.max(0, n))}/${pad(CELL_TOTAL)}`;
        $('status').textContent = done < total ? 'Loading' : 'Online';
      },
      onPick,
      onHover(id) { if (id) canvas.dataset.hot = ''; else delete canvas.dataset.hot; },
    });
  } catch (err) {
    console.error(err);
    $('status').textContent = 'Load failed';
    $('hint').textContent = 'The 3D model could not load. Check your connection and that WebGL is on, then reload.';
    return;
  }
  scene.setReduced(mqReduce.matches);
  mqReduce.addEventListener('change', () => scene.setReduced(mqReduce.matches));
  mqDesktop.addEventListener('change', onResize);
  addEventListener('resize', onResize);
  applyTheme(); sheet.measure(); sizeTrace(); updateRect();
  scene.onFrame = onFrame;
  app.dataset.ready = 'true'; app.dataset.body = BODY;
  $('ruler-top').textContent = `${(scene.bodyExtent.top - scene.bodyExtent.bottom).toFixed(2)} m`;
  const start = location.hash.slice(1);
  if (SECTION_BY_ID[start]) select(start, { snap: true });
  window.__anatomy = { scene, select, state, sheet, startTour, tour, INDEX }; // handle for automated tests
}
boot();
