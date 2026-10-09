// Build step: decide which selectable group every named mesh belongs to, and write js/model-groups.js.
// Run from the project root:  node tools/build-groups.mjs
// Rules are matched against "parent>parent :: mesh_name" from the ORIGINAL files, so membership follows the
// library's own hierarchy and names. The first matching rule wins; the last rule of each set is the default.
import fs from 'node:fs';

const DIR = 'assets/models/';
// Two bodies from the same library. Female originals live in assets/models/female/ and use F in their names.
const BODIES = { male: { dir: '', tag: 'M' }, female: { dir: 'female/', tag: 'F' } };
let bodyDir = '';
const read = (f) => { const b = fs.readFileSync(DIR + bodyDir + f + '.glb'); return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12))); };
function meshes(file) {
  const j = read(file), parent = {};
  j.nodes.forEach((n, i) => (n.children || []).forEach((c) => { parent[c] = i; }));
  return j.nodes.map((n, i) => {
    if (n.mesh == null) return null;
    const path = []; let k = parent[i]; while (k != null) { path.unshift(j.nodes[k].name); k = parent[k]; }
    return { name: n.name, path: path.join('>') + ' :: ' + n.name };
  }).filter(Boolean);
}

const SETS = {
  heart: { files: ['VH_M_Heart'], rules: [
    [/left_ventricle/, 'heart_lv'], [/right_ventricle/, 'heart_rv'], [/left_cardiac_atrium/, 'heart_la'], [/right_cardiac_atrium/, 'heart_ra'],
    [/septum/, 'heart_septum'], [/mitral/, 'valve_mitral'], [/tricuspid/, 'valve_tricuspid'], [/aortic_valve/, 'valve_aortic'],
    [/pulmonary_valve/, 'valve_pulmonary'], [/papillary/, 'heart_papillary'] ] },
  lungs: { files: ['VH_M_Lung'], rules: [
    [/lungs_R_upper_lobe|R_lung_upper_lobe/, 'lung_r_upper'], [/lungs_R_middle_lobe|R_lung_middle_lobe/, 'lung_r_middle'], [/lungs_R_lower_lobe|R_lung_lower_lobe/, 'lung_r_lower'],
    [/lungs_L_upper_lobe|L_lung_upper_lobe/, 'lung_l_upper'], [/lungs_L_lower_lobe|L_lung_lower_lobe/, 'lung_l_lower'], [/./, 'airways'] ] },
  // Brain: 283 Allen atlas regions gathered into the lobes and structures of standard gross anatomy.
  brain: { files: ['Allen_M_Brain'], strip: /^.* :: Allen_/, rules: [
    [/ventricle|aqueduct|central_canal/, 'brain_ventricles'],
    [/cerebell/, 'brain_cerebellum'],
    [/pons|pontine|medulla|inferior_olive|collicul|pretectal|red_nucleus|substantia_nigra|midbrain|cerebral_peduncle/, 'brain_stem'],
    [/white_matter|commissure|corpus_callosum|fornix|mammillothalamic|optic_tract|optic_radiation|optic_chiasm/, 'brain_white'],
    [/olfactory|piriform|basal_forebrain|septal|stria_terminalis/, 'brain_olfactory'],
    [/insula/, 'brain_insula'],
    [/cingul|^ingulo|subcallosal|parahippocampal|ambiens|hippocamp|amygdal|^central_nuclear_group|^lateral_nucleus|^basolateral|^basomedial|cortical_nucleus|^medial_nucleus|perirhinal/, 'brain_limbic'],
    [/thalam|geniculate|habenular|pineal|zona_incerta|HTH|caudate|putamen|accumbens|pallidus|claustrum|^ventral_posterior|midline_nuclear/, 'brain_deep'],
    [/precentral|frontal|rectus|orbital_gyrus|paracentral_lobule_rostral|^rostral_gyrus|frontomarginal/, 'brain_frontal'],
    [/postcentral|parietal|supramarginal|angular|precuneus|paracentral_lobule_caudal/, 'brain_parietal'],
    [/occipital_part|occipital_pole|cuneus|^lingual|occipital_gyrus/, 'brain_occipital'],
    [/temporal|planum/, 'brain_temporal'] ] },
  intestine_large: { files: ['SBU_M_Intestine_Large'], rules: [
    [/caecum|ileocecal|appendix/, 'li_caecum'], [/ascending|hepatic_flexure/, 'li_ascending'], [/transverse|splenic_flexure/, 'li_transverse'],
    [/descending/, 'li_descending'], [/sigmoid/, 'li_sigmoid'], [/rectum/, 'li_rectum'] ] },
  intestine_small: { files: ['VH_M_Small_Intestine'], rules: [[/jej[ue]num/, 'si_jejunum'], [/ileum/, 'si_ileum'], [/./, 'si_duodenum']] },
  pancreas: { files: ['VH_M_Pancreas'], rules: [[/body/, 'pancreas_body'], [/tail/, 'pancreas_tail'], [/./, 'pancreas_head']] },
  kidney: { files: ['VH_M_Kidney_L', 'VH_M_Kidney_R'], rules: [
    [/capsule/, 'kidney_capsule'], [/pyramid|papilla/, 'kidney_medulla'], [/column|cortex/, 'kidney_cortex'], [/hilum/, 'kidney_hilum'] ] },
  liver: { files: ['VH_M_Liver'], rules: [
    [/caudate/, 'liver_caudate'], [/right_lobe_of_liver/, 'liver_right'], [/left_lobe_of_liver/, 'liver_left'], [/ligament/, 'liver_ligaments'], [/./, 'liver_surface'] ] },
  eye: { files: ['VH_M_Eye_L', 'VH_M_Eye_R'], rules: [
    [/lens/, 'eye_lens'], [/:: VH_[MF]_corne/, 'eye_cornea'], [/iris|pupil/, 'eye_iris'], [/retina|fovea|macula|optic_disc/, 'eye_retina'],
    [/sclera|choroid|conjunctiva/, 'eye_coats'], [/./, 'eye_inner'] ] },
  prostate: { only: 'male', files: ['VH_M_Prostate'], rules: [
    [/vas_deferens/, 'pr_vas'], [/seminal_vesicle/, 'pr_vesicles'], [/ejaculatory/, 'pr_ducts'], [/peripheral_zone/, 'pr_peripheral'],
    [/transition_zone/, 'pr_transition'], [/central_zone/, 'pr_central'], [/fibromuscular/, 'pr_stroma'], [/./, 'pr_other'] ] },
  pelvis: { files: ['VH_M_Pelvis'], rules: [[/sacrum|coccyx/, 'pelvis_sacrum'], [/ilium/, 'pelvis_ilium'], [/ischium/, 'pelvis_ischium'], [/pubis/, 'pelvis_pubis']] },
  leg: { files: ['VH_M_Knee_L', 'VH_M_Knee_R'], rules: [
    [/:: VH_[MF]_tibia/, 'leg_tibia'], [/:: VH_[MF]_fibula/, 'leg_fibula'], [/:: VH_[MF]_patella_[LR]$/, 'leg_patella'], [/:: VH_[MF]_(meniscus|articular_cartilage)/, 'leg_cartilage'], [/./, 'leg_femur'] ] },
  vertebrae: { files: ['VH_M_Vertebrae'], rules: [[/cervical/, 'spine_cervical'], [/thoracic/, 'spine_thoracic'], [/lumbar/, 'spine_lumbar']] },
  spinal_cord: { files: ['VH_M_Spinal_Cord'], rules: [[/cervical/, 'cord_cervical'], [/thoracic/, 'cord_thoracic'], [/lumbar/, 'cord_lumbar'], [/sacral/, 'cord_sacral']] },
  uterus: { only: 'female', files: ['VH_F_Uterus'], rules: [[/fundus|cornua/, 'uterus_fundus'], [/cerv/, 'uterus_cervix'], [/./, 'uterus_body']] },
  fallopian: { only: 'female', files: ['VH_F_Fallopian_Tube_L', 'VH_F_Fallopian_Tube_R'], rules: [[/infundibulum|fibria/, 'tube_infundibulum'], [/ampulla/, 'tube_ampulla'], [/isthmus/, 'tube_isthmus']] },
  mammary: { only: 'female', files: ['VH_F_mammary_gland_L', 'VH_F_mammary_gland_R'], rules: [
    [/fat/, 'breast_fat'], [/lobes/, 'breast_lobes'], [/duct|sinus/, 'breast_ducts'], [/nipple|areol/, 'breast_nipple'], [/suspensory/, 'breast_ligaments'] ] },
};
// Female file names differ from the male ones in a few places.
const FEMALE_FILE = { VH_M_Nerves_Eye_L: 'VH_F_Nerves_of_Eye_L', VH_M_Nerves_Eye_R: 'VH_F_Nerves_of_Eye_R' };
const fileFor = (f, body) => (body === 'male' ? f : FEMALE_FILE[f] || f.replace(/^(VH|Allen|SBU|NIH)_M_/, '$1_F_'));

const all = {}, report = [];
for (const [body, cfg] of Object.entries(BODIES)) {
 bodyDir = cfg.dir; const out = all[body] = {}; report.push(`
== ${body}`);
 for (const [key, set] of Object.entries(SETS)) {
  if (set.only && set.only !== body) continue;
  out[key] = {}; const count = {}, missed = [];
  for (const file of set.files.map((f) => fileFor(f, body))) for (const m of meshes(file)) {
    const subject = set.strip ? m.path.replace(set.strip, '') : m.path;
    const rule = set.rules.find(([re]) => re.test(subject));
    if (!rule) { missed.push(m.name); continue; }
    out[key][m.name] = rule[1]; count[rule[1]] = (count[rule[1]] || 0) + 1;
  }
  report.push(`${key}: ${Object.entries(count).map(([g, n]) => `${g} ${n}`).join(', ')}${missed.length ? `  UNMATCHED: ${missed.join(', ')}` : ''}`);
 }
}
fs.writeFileSync('js/model-groups.js',
  '// Generated by tools/build-groups.mjs from the original model files. Do not edit by hand.\n' +
  '// ALL_GROUPS[body][set][meshName] = id of the selectable part that mesh belongs to.\n' +
  `export const ALL_GROUPS = ${JSON.stringify(all)};\n`);
console.log(report.join('\n'));
