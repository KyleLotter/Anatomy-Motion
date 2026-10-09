import { by } from './body.js';
// Section copy. Educational only, not medical advice.
// Every number below has a source; where sources disagreed the number was left out
// (for example small-intestine length, which varies a lot between living and post-mortem measurement).
//
// Sources
// [OS]   OpenStax, Anatomy and Physiology 2e. https://openstax.org/details/books/anatomy-and-physiology-2e
//        6.1 / 7.1 skeletal system (206 bones); 7.3 vertebral column (24 vertebrae plus sacrum and coccyx);
//        7.4 thoracic cage (12 pairs of ribs); 13.2 central nervous system; 13.4 peripheral nervous system
//        (12 pairs of cranial nerves, 31 pairs of spinal nerves); 14.1 vision (six extraocular muscles);
//        18.1 blood (about 5 litres in an adult); 19.1 heart anatomy; 20.1 blood vessels;
//        21.1 lymphatic organs (spleen, thymus, lymph nodes); 22.2 the lungs; 22.3 respiratory volumes;
//        23.2 digestive processes; 23.5 small and large intestines; 23.6 liver, gallbladder, pancreas;
//        25.2 urinary anatomy (cortex, medulla, renal pyramids); 27.1 male reproductive system.
//        13.2-13.3 brain regions and lobes; 14.1 the eye; 23.6 lobes of the liver; 8.3-8.4 pelvis and leg bones.
// [NCI]  National Cancer Institute, Dictionary of Cancer Terms, "prostate" (about the size of a walnut).
// [SP]   StatPearls, "Anatomy, Abdomen and Pelvis, Prostate" (zones of the prostate).
// [AZ]   Azevedo et al. 2009, J Comp Neurol 513(5):532-541. About 86 billion neurons in the adult human brain.
// [AHA]  American Heart Association, "All About Heart Rate". Normal resting rate 60-100 bpm.
// [NIDDK-K] NIDDK, "Your Kidneys & How They Work". ~1 million nephrons per kidney; ~half a cup of blood filtered
//        per minute; 1-2 quarts of urine a day.
// [NIDDK-D] NIDDK, "Your Digestive System & How it Works". Large intestine is about 5 feet (1.5 m) long.
//
// Each sub has `parts`: the scene entity ids it lights up. `standin: true` marks hand-built shapes.

const MALE_REPRODUCTIVE = {
    id: 'reproductive', tab: 'Prostate', title: 'Prostate', kicker: 'Male reproductive system',
    about: 'The prostate sits just below the bladder and surrounds the first part of the urethra. Together with the seminal vesicles behind it, it adds fluid to semen. The vas deferens on each side carries sperm to it.', // [OS 27.1]
    readout: { kind: 'parts', label: 'Parts', note: 'Select a part on the model or in the list' },
    subs: [ // [OS 27.1], zones [SP]
      { id: 'gland', label: 'Prostate gland', parts: ['pr_peripheral', 'pr_transition', 'pr_central', 'pr_stroma', 'pr_other'], note: 'A gland about the size of a walnut that adds fluid to semen. It is described in zones.', inside: 'prostate',
        details: [
          { id: 'peripheral', label: 'Peripheral zone', parts: ['pr_peripheral'], note: 'The largest zone, at the back and sides of the gland.' },
          { id: 'transition', label: 'Transition zone', parts: ['pr_transition'], note: 'Surrounds the urethra as it passes through the gland.' },
          { id: 'central', label: 'Central zone', parts: ['pr_central'], note: 'Surrounds the ejaculatory ducts.' },
          { id: 'stroma', label: 'Front muscle layer', parts: ['pr_stroma'], note: 'A layer of muscle and fibrous tissue at the front of the gland, with no glands in it.' },
        ] },
      { id: 'vesicles', label: 'Seminal vesicles', parts: ['pr_vesicles'], note: 'Glands behind the bladder that make most of the fluid in semen.' },
      { id: 'vas', label: 'Vas deferens', parts: ['pr_vas'], note: 'The tube on each side that carries sperm from the testis.' },
      { id: 'ducts', label: 'Ejaculatory ducts', parts: ['pr_ducts'], note: 'Short ducts through the prostate, formed where each vas deferens meets a seminal vesicle. They open into the urethra.' },
    ],
    subsNote: 'All parts come from scans.',
    note: 'Only the prostate, seminal vesicles, vas deferens and ejaculatory ducts are in the model. The model set is male.',
  };

// [OS 27.2] female reproductive system and the breast; [OS 28.2] the placenta.
const FEMALE_REPRODUCTIVE = {
  id: 'reproductive', tab: 'Uterus', title: 'Uterus', kicker: 'Female reproductive system',
  about: 'The ovaries release eggs and make the hormones oestrogen and progesterone. An egg travels along a fallopian tube to the uterus, where a fertilised egg can implant and grow. The cervix at the base of the uterus opens into the vagina.',
  readout: { kind: 'parts', label: 'Parts', note: 'Select a part on the model or in the list' },
  subs: [
    { id: 'uterus', label: 'Uterus', parts: ['uterus', 'uterus_vessels'], note: 'A muscular organ about the shape of an upside-down pear. Its lining thickens each cycle and is shed if no egg implants.',
      details: [
        { id: 'fundus', label: 'Fundus', parts: ['uterus_fundus'], note: 'The rounded top of the uterus, above where the fallopian tubes join.' },
        { id: 'body', label: 'Body', parts: ['uterus_body'], note: 'The main part of the uterus, where a pregnancy develops.' },
        { id: 'cervix', label: 'Cervix', parts: ['uterus_cervix'], note: 'The narrow lower end, opening into the vagina.' },
        { id: 'vessels', label: 'Uterine vessels', parts: ['uterus_vessels'], note: 'A uterine artery and vein on each side supply the uterus.' },
      ] },
    { id: 'ovaries', label: 'Ovaries', parts: ['ovaries'], note: 'Two almond-sized organs that store and release eggs and make oestrogen and progesterone.' },
    { id: 'tubes', label: 'Fallopian tubes', parts: ['fallopian'], note: 'Also called uterine tubes. Each carries an egg from an ovary toward the uterus.', inside: 'fallopian tube',
      details: [
        { id: 'infundibulum', label: 'Infundibulum', parts: ['tube_infundibulum'], note: 'The funnel-shaped end beside the ovary. Its finger-like fimbriae sweep the released egg into the tube.' },
        { id: 'ampulla', label: 'Ampulla', parts: ['tube_ampulla'], note: 'The wide middle section, where fertilisation usually happens.' },
        { id: 'isthmus', label: 'Isthmus', parts: ['tube_isthmus'], note: 'The narrow section that joins the uterus.' },
      ] },
    { id: 'vagina', label: 'Vagina', parts: ['vagina'], note: 'A muscular canal from the cervix to the outside of the body.' },
    { id: 'ligaments', label: 'Ligaments', parts: ['uterus_ligaments'], note: 'The broad, round and uterosacral ligaments hold the uterus in place, and smaller ligaments support the ovaries.' },
    { id: 'breasts', label: 'Mammary glands', parts: ['mammary'], note: 'The breasts contain glands that can make milk, set in fat and connective tissue.', inside: 'breast',
      details: [
        { id: 'lobes', label: 'Lobes', parts: ['breast_lobes'], note: 'Clusters of glands that produce milk.' },
        { id: 'ducts', label: 'Milk ducts', parts: ['breast_ducts'], note: 'Carry milk from the lobes toward the nipple.' },
        { id: 'nipple', label: 'Nipple and areola', parts: ['breast_nipple'], note: 'The ducts open at the nipple. The areola is the darker skin around it.' },
        { id: 'fat', label: 'Fat', parts: ['breast_fat'], note: 'Fatty tissue surrounds the glands and gives the breast most of its size and shape.' },
        { id: 'ligaments', label: 'Suspensory ligaments', parts: ['breast_ligaments'], note: 'Bands of connective tissue that support the breast.' },
      ] },
    { id: 'placenta', label: 'Placenta', parts: ['placenta'], note: 'Forms only during pregnancy. It passes oxygen and nutrients from the mother to the baby through the umbilical cord and carries waste back. The library supplies it as a separate object, so it is shown beside the body, not inside the uterus.' },
  ],
  subsNote: 'All parts come from scans. The placenta is shown only when you select it.',
  note: 'The placenta is a separate reference object placed beside the body. The urethra is not in the female model set.',
};
const REPRODUCTIVE = by(MALE_REPRODUCTIVE, FEMALE_REPRODUCTIVE);

export const SECTIONS = [
  {
    id: 'nervous', tab: 'Nerves', title: 'Nervous', kicker: 'Nervous system',
    about: 'The brain and spinal cord form the central nervous system. Nerves branching from them carry signals to and from every part of the body: 12 pairs leave the brain and 31 pairs leave the spinal cord.', // [OS 13.2, 13.4]
    stats: [
      { label: 'Neurons in the brain', value: 86, prefix: '≈ ', suffix: ' billion' }, // [AZ]
      { label: 'Cranial nerve pairs', value: 12 },                                      // [OS 13.4]
      { label: 'Spinal nerve pairs', value: 31 },                                       // [OS 13.4]
    ],
    readout: { kind: 'eeg', label: 'Alpha rhythm', value: '8–13', unit: 'Hz', note: 'Illustrative trace, not a recording' },
    subs: [
      { id: 'brain', label: 'Brain', parts: ['brain'], note: 'Receives signals from the senses, coordinates movement, and is where thinking, memory and emotion arise.',
        details: [
          { id: 'frontal', label: 'Frontal lobe', parts: ['brain_frontal'], note: 'Planning, decision-making and voluntary movement. The strip at its back edge sends the commands that move the body.' },
          { id: 'parietal', label: 'Parietal lobe', parts: ['brain_parietal'], note: 'Receives touch, pressure, pain and temperature from the body and helps judge where things are in space.' },
          { id: 'temporal', label: 'Temporal lobe', parts: ['brain_temporal'], note: 'Processes sound and is involved in understanding language and in memory.' },
          { id: 'occipital', label: 'Occipital lobe', parts: ['brain_occipital'], note: 'At the back of the brain. It processes what the eyes see.' },
          { id: 'insula', label: 'Insula', parts: ['brain_insula'], note: 'A fold of cortex hidden beneath the frontal and temporal lobes. It includes the area that processes taste.' },
          { id: 'limbic', label: 'Limbic structures', parts: ['brain_limbic'], note: 'The cingulate gyrus, hippocampus and amygdala, which are involved in emotion and in forming memories.' },
          { id: 'deep', label: 'Deep nuclei', parts: ['brain_deep'], note: 'Clusters of nerve cells deep in the brain: the thalamus relays signals to the cortex, the hypothalamus regulates the body, and the basal nuclei help control movement.' },
          { id: 'cerebellum', label: 'Cerebellum', parts: ['brain_cerebellum'], note: 'Sits under the back of the brain. It fine-tunes movement, balance and coordination.' },
          { id: 'stem', label: 'Brainstem', parts: ['brain_stem'], note: 'The midbrain, pons and medulla connect the brain to the spinal cord and control breathing and heart rate.' },
          { id: 'ventricles', label: 'Ventricles', parts: ['brain_ventricles'], note: 'Four connected chambers inside the brain that make and circulate cerebrospinal fluid.' },
          { id: 'white', label: 'White matter', parts: ['brain_white'], note: 'Bundles of nerve fibres that link brain regions. The corpus callosum joins the two halves of the brain.' },
          { id: 'olfactory', label: 'Olfactory and basal forebrain', parts: ['brain_olfactory'], note: 'The olfactory bulbs and tracts carry the sense of smell. The neighbouring basal forebrain is grouped with them here.' },
        ] }, // [OS 13.2]
      { id: 'cord', label: 'Spinal cord', parts: ['spinal_cord'], note: 'Runs inside the spine. It relays signals between the brain and the body and handles some reflexes on its own.',
        details: [
          { id: 'cervical', label: 'Cervical', parts: ['cord_cervical'], note: 'Eight segments in the neck. Their nerves serve the neck, shoulders, arms and hands, and the diaphragm.' },
          { id: 'thoracic', label: 'Thoracic', parts: ['cord_thoracic'], note: 'Twelve segments. Their nerves serve the chest wall and abdomen.' },
          { id: 'lumbar', label: 'Lumbar', parts: ['cord_lumbar'], note: 'Five segments. Their nerves serve the hips and the front of the legs.' },
          { id: 'sacral', label: 'Sacral', parts: ['cord_sacral'], note: by('Five segments at the lower end of the cord. Their nerves serve the back of the legs, the feet and the pelvic organs.', 'The segments at the lower end of the cord. Their nerves serve the back of the legs, the feet and the pelvic organs. There are normally five; this model includes four.') },
        ] }, // [OS 13.2]
      { id: 'eyes', label: 'Eyes and optic nerves', parts: ['eye', 'eye_muscles', 'optic_nerves'], note: 'Each optic nerve carries visual signals from the eye to the brain. Six muscles around each eye turn it.', inside: 'eye',
        details: [
          { id: 'cornea', label: 'Cornea', parts: ['eye_cornea'], note: 'The clear front window of the eye. It does most of the bending of incoming light.' },
          { id: 'iris', label: 'Iris and pupil', parts: ['eye_iris'], note: 'The coloured iris widens and narrows the pupil to control how much light gets in.' },
          { id: 'lens', label: 'Lens', parts: ['eye_lens'], note: 'Changes shape to fine-tune focus for near and far.' },
          { id: 'retina', label: 'Retina', parts: ['eye_retina'], note: 'The light-sensitive layer at the back of the eye. The fovea at its centre gives the sharpest vision.' },
          { id: 'coats', label: 'Sclera and choroid', parts: ['eye_coats'], note: 'The tough white sclera forms the wall of the eyeball. The choroid beneath it carries blood vessels.' },
          { id: 'inner', label: 'Fluid chambers and ciliary body', parts: ['eye_inner'], note: 'Clear fluid and gel fill the eye and keep its shape. The ciliary body makes the fluid and holds the lens.' },
          { id: 'muscles', label: 'Eye muscles', parts: ['eye_muscles'], note: 'Six muscles around each eye turn it, and a seventh lifts the upper eyelid.' },
          { id: 'nerve', label: 'Optic nerves', parts: ['optic_nerves'], note: 'Each optic nerve carries signals from the retina to the brain.' },
        ] }, // [OS 14.1]
      { id: 'nerves', label: 'Peripheral nerves', parts: ['nerves'], standin: true, note: 'A schematic of the main nerve trunks: spinal roots, vagus, the nerves of the arm, and the femoral and sciatic nerves of the leg. Paths are rough sketches, not traced from scans.' }, // [OS 13.4]
    ],
    subsNote: 'Brain, spinal cord, eyes and optic nerves come from scans. The peripheral nerves are a stylised sketch.',
    note: 'Peripheral nerves and skull outline are stylised stand-ins.',
  },
  {
    id: 'heart', tab: 'Heart', title: 'Heart', kicker: 'Cardiovascular system',
    about: 'The heart is a muscular pump with four chambers. The right side sends blood to the lungs to pick up oxygen; the left side sends that oxygen-rich blood out through the aorta. Coronary arteries on its surface supply the heart muscle itself.', // [OS 19.1]
    stats: [
      { label: 'Chambers', value: 4 },                       // [OS 19.1]
      { label: 'Valves', value: 4 },                         // [OS 19.1]
      { label: 'Normal resting rate', text: '60–100 bpm' },  // [AHA]
    ],
    readout: { kind: 'pulse', label: 'Pulse', unit: 'bpm', note: 'Simulated resting rhythm' },
    subs: [ // [OS 19.1]
      { id: 'ra', label: 'Right atrium', parts: ['heart_ra'], note: 'Receives oxygen-poor blood returning from the body through the two venae cavae.' },
      { id: 'rv', label: 'Right ventricle', parts: ['heart_rv'], note: 'Pumps that blood through the pulmonary valve to the lungs.' },
      { id: 'la', label: 'Left atrium', parts: ['heart_la'], note: 'Receives oxygen-rich blood coming back from the lungs through the pulmonary veins.' },
      { id: 'lv', label: 'Left ventricle', parts: ['heart_lv'], note: 'Has the thickest wall of the four chambers. It pumps blood through the aortic valve into the aorta and on to the whole body.' },
      { id: 'septum', label: 'Septum', parts: ['heart_septum'], note: 'The muscular wall between the two ventricles. It keeps oxygen-rich and oxygen-poor blood apart.' },
      { id: 'valves', label: 'Valves', parts: ['valve_tricuspid', 'valve_pulmonary', 'valve_mitral', 'valve_aortic', 'heart_papillary'], note: 'The tricuspid and mitral valves sit between each atrium and ventricle; the pulmonary and aortic valves guard the exits. Papillary muscles anchor the tricuspid and mitral flaps.', inside: 'valve group',
        details: [
          { id: 'tricuspid', label: 'Tricuspid valve', parts: ['valve_tricuspid'], note: 'Between the right atrium and right ventricle.' },
          { id: 'pulmonary', label: 'Pulmonary valve', parts: ['valve_pulmonary'], note: 'At the exit of the right ventricle, on the way to the lungs.' },
          { id: 'mitral', label: 'Mitral valve', parts: ['valve_mitral'], note: 'Between the left atrium and left ventricle.' },
          { id: 'aortic', label: 'Aortic valve', parts: ['valve_aortic'], note: 'At the exit of the left ventricle, at the start of the aorta.' },
          { id: 'papillary', label: 'Papillary muscles', parts: ['heart_papillary'], note: 'Small muscles inside the ventricles. Cords from them hold the tricuspid and mitral flaps so they cannot flip backwards.' },
        ] },
      { id: 'vessels', label: 'Aorta and vessels', parts: ['heart_vessels'], note: 'The aorta leaves the left ventricle, the venae cavae return blood to the right atrium, and the coronary arteries supply the heart muscle.' },
    ],
    subsNote: 'All parts come from scans. Try the cutaway to look inside.',
  },
  {
    id: 'lungs', tab: 'Lungs', title: 'Lungs', kicker: 'Respiratory system',
    about: 'Air travels down the trachea and through branching bronchi into the lungs, where oxygen passes into the blood and carbon dioxide passes out. The right lung has three lobes and the left has two, leaving room for the heart.', // [OS 22.2]
    stats: [
      { label: 'Lobes, right + left', text: '3 + 2' },                              // [OS 22.2]
      { label: 'Tidal volume at rest', value: 500, prefix: '≈ ', suffix: ' mL' },   // [OS 22.3]
      { label: 'Resting breaths per minute', text: '12–18' },                       // [OS 22.3]
    ],
    readout: { kind: 'volume', label: 'Volume', unit: 'mL', note: 'Simulated quiet breathing' },
    subs: [ // [OS 22.1, 22.2]
      { id: 'ru', label: 'Right upper lobe', parts: ['lung_r_upper'], note: 'The top lobe of the right lung.' },
      { id: 'rm', label: 'Right middle lobe', parts: ['lung_r_middle'], note: 'Only the right lung has a middle lobe.' },
      { id: 'rl', label: 'Right lower lobe', parts: ['lung_r_lower'], note: 'The bottom lobe of the right lung, resting on the diaphragm.' },
      { id: 'lu', label: 'Left upper lobe', parts: ['lung_l_upper'], note: 'The top lobe of the left lung. A notch in its front edge makes room for the heart.' },
      { id: 'll', label: 'Left lower lobe', parts: ['lung_l_lower'], note: 'The bottom lobe of the left lung.' },
      { id: 'airways', label: 'Trachea and bronchi', parts: ['airways'], note: 'The trachea splits into a right and a left main bronchus, which keep branching into smaller airways inside each lobe.' },
    ],
    subsNote: 'All parts come from scans.',
    note: 'Rib cage is a stylised stand-in.',
  },
  {
    id: 'digestive', tab: 'Digest', title: 'Digestive', kicker: 'Digestive system',
    about: 'The digestive system breaks food down into nutrients the body can absorb, then removes what is left. Food moves through one long tube, helped by the liver, gallbladder and pancreas, which add bile and enzymes along the way.', // [OS 23.1]
    physiology: ['Ingestion', 'Propulsion', 'Mechanical digestion', 'Chemical digestion', 'Absorption', 'Defecation'], // [OS 23.2]
    readout: { kind: 'parts', label: 'Parts', note: 'Select a part on the model or in the list' },
    subs: [
      { id: 'liver', label: 'Liver', parts: ['liver', 'liver_vessels'], note: 'The largest internal organ. It makes bile, which helps digest fats, and processes nutrients arriving from the intestine through the portal vein.',
        details: [
          { id: 'right', label: 'Right lobe', parts: ['liver_right'], note: 'The larger of the two main lobes.' },
          { id: 'left', label: 'Left lobe', parts: ['liver_left'], note: 'The smaller main lobe, reaching across toward the stomach. In this model the quadrate lobe is grouped with it.' },
          { id: 'caudate', label: 'Caudate lobe', parts: ['liver_caudate'], note: 'A small lobe on the back of the liver, next to the inferior vena cava.' },
          { id: 'ligaments', label: 'Ligaments', parts: ['liver_ligaments'], note: 'Folds of tissue that hold the liver to the diaphragm and the front wall of the abdomen.' },
          { id: 'vessels', label: 'Liver vessels', parts: ['liver_vessels'], note: 'The hepatic artery brings oxygen-rich blood, the portal vein brings nutrient-rich blood from the gut, and the hepatic veins drain the liver.' },
        ] }, // [OS 23.6]
      { id: 'gallbladder', label: 'Gallbladder and bile ducts', parts: ['gallbladder', 'biliary'], note: 'The gallbladder stores and concentrates bile. Ducts carry bile from the liver and gallbladder to the small intestine.', inside: 'biliary system',
        details: [
          { id: 'gallbladder', label: 'Gallbladder', parts: ['gallbladder'], note: 'A small sac under the liver that stores and concentrates bile between meals.' },
          { id: 'ducts', label: 'Bile ducts', parts: ['biliary'], note: 'Carry bile from the liver and gallbladder to the small intestine. The pancreatic ducts shown with them join near the end.' },
        ] }, // [OS 23.6]
      { id: 'stomach', label: 'Stomach', parts: ['stomach', 'oesophagus'], standin: true, note: 'Stores food and churns it with acid and enzymes into a liquid called chyme. Food reaches it through the oesophagus.' }, // [OS 23.4]
      { id: 'pancreas', label: 'Pancreas', parts: ['pancreas'], note: 'Releases digestive enzymes and bicarbonate into the small intestine, and makes the hormones insulin and glucagon.',
        details: [
          { id: 'head', label: 'Head', parts: ['pancreas_head'], note: 'The widest part, tucked into the curve of the duodenum.' },
          { id: 'body', label: 'Body', parts: ['pancreas_body'], note: 'The middle part, lying behind the stomach.' },
          { id: 'tail', label: 'Tail', parts: ['pancreas_tail'], note: 'The narrow end, reaching toward the spleen.' },
        ] }, // [OS 23.6]
      { id: 'intestine_small', label: 'Small intestine', parts: ['intestine_small'], note: 'Where most digestion and nutrient absorption happens. Its three parts are the duodenum, jejunum and ileum.',
        details: [
          { id: 'duodenum', label: 'Duodenum', parts: ['si_duodenum'], note: 'The short first part. Bile and pancreatic juice enter here.' },
          { id: 'jejunum', label: 'Jejunum', parts: ['si_jejunum'], note: 'The middle part, where most nutrients are absorbed.' },
          { id: 'ileum', label: 'Ileum', parts: ['si_ileum'], note: 'The last and longest part. It joins the large intestine.' },
        ] }, // [OS 23.5]
      { id: 'intestine_large', label: 'Large intestine', parts: ['intestine_large'], note: 'Absorbs water and salts and forms stool. It is about 1.5 m long.',
        details: [
          { id: 'caecum', label: 'Caecum and appendix', parts: ['li_caecum'], note: 'A pouch where the small intestine empties into the large intestine. The appendix hangs from it.' },
          { id: 'ascending', label: 'Ascending colon', parts: ['li_ascending'], note: 'Runs up the right side of the abdomen.' },
          { id: 'transverse', label: 'Transverse colon', parts: ['li_transverse'], note: 'Crosses the abdomen from right to left, below the stomach.' },
          { id: 'descending', label: 'Descending colon', parts: ['li_descending'], note: 'Runs down the left side of the abdomen.' },
          { id: 'sigmoid', label: 'Sigmoid colon', parts: ['li_sigmoid'], note: 'An S-shaped bend that leads into the rectum.' },
          { id: 'rectum', label: 'Rectum', parts: ['li_rectum'], note: 'The final section, where stool is held before it leaves the body.' },
        ] }, // [OS 23.5], [NIDDK-D]
    ],
    subsNote: 'Five parts come from scans. The stomach and oesophagus are stylised stand-ins.',
    note: 'Stomach and oesophagus are stylised stand-ins.',
  },
  {
    id: 'urinary', tab: 'Kidneys', title: 'Kidneys', kicker: 'Urinary system',
    about: 'The two kidneys filter waste and extra water out of the blood to make urine. Urine drains down the ureters to the bladder, where it is stored until it leaves the body through the urethra.', // [NIDDK-K], [OS 25.2]
    stats: [
      { label: 'Nephrons per kidney', value: 1, prefix: '≈ ', suffix: ' million' },    // [NIDDK-K]
      { label: 'Blood filtered per minute', value: 120, prefix: '≈ ', suffix: ' mL' }, // [NIDDK-K], half a cup
      { label: 'Urine per day', text: '≈ 1–2 L' },                                      // [NIDDK-K], 1-2 quarts
    ],
    readout: { kind: 'filter', label: 'Filtered', unit: 'mL', note: 'Since you opened this view, at ≈ 120 mL/min' },
    subs: [
      { id: 'kidneys', label: 'Kidneys', parts: ['kidney', 'kidney_vessels'], note: 'Each kidney receives blood through a renal artery, filters it, and returns it through a renal vein.', inside: 'kidney',
        details: [
          { id: 'capsule', label: 'Capsule', parts: ['kidney_capsule'], note: 'The thin, tough outer covering of each kidney.' },
          { id: 'cortex', label: 'Cortex', parts: ['kidney_cortex'], note: 'The outer layer, where blood is first filtered. Columns of cortex extend inward between the pyramids.' },
          { id: 'medulla', label: 'Pyramids', parts: ['kidney_medulla'], note: 'Cone-shaped masses in the inner layer, the medulla. Urine drains from the tip of each one.' },
          { id: 'hilum', label: 'Hilum', parts: ['kidney_hilum'], note: 'The notch on the inner edge where the artery, vein and ureter connect.' },
          { id: 'vessels', label: 'Renal vessels', parts: ['kidney_vessels'], note: 'A renal artery brings blood to each kidney and a renal vein takes the filtered blood away.' },
        ] }, // [OS 25.2]
      { id: 'ureters', label: 'Ureters', parts: ['ureters'], note: 'Two muscular tubes that carry urine from the collecting space inside each kidney down to the bladder.' }, // [OS 25.2]
      { id: 'bladder', label: 'Bladder', parts: ['bladder'], note: 'A stretchy muscular sac that stores urine.' }, // [OS 25.2]
      { id: 'urethra', label: 'Urethra', parts: ['urethra'], note: 'The tube that carries urine from the bladder out of the body.' }, // [OS 25.2]
    ],
    subsNote: 'All parts in this section come from scans.',
    note: by('', 'The urethra is not in the female model set.'),
  },
  {
    id: 'vessels', tab: 'Vessels', title: 'Vessels', kicker: 'Blood vessels',
    about: 'Arteries carry blood away from the heart and veins carry it back. Between them, tiny capillaries let oxygen and nutrients pass into the tissues. An adult has about five litres of blood.', // [OS 20.1, 18.1]
    stats: [
      { label: 'Blood in an adult', value: 5, prefix: '≈ ', suffix: ' L' }, // [OS 18.1]
      { label: 'Largest artery', text: 'Aorta' },                            // [OS 20.1]
      { label: 'Largest veins', text: 'Venae cavae' },                       // [OS 20.1]
    ],
    readout: { kind: 'parts', label: 'Parts', note: 'Select arteries or veins' },
    subs: [
      { id: 'arteries', label: 'Arteries', parts: ['arteries'], note: 'Thick-walled vessels that carry blood away from the heart under pressure. Shown here: the aorta and its main branches in the head and trunk.' }, // [OS 20.1]
      { id: 'veins', label: 'Veins', parts: ['veins'], note: 'Thinner-walled vessels that return blood to the heart. Shown here: the venae cavae, the portal system and their main branches.' }, // [OS 20.1]
    ],
    subsNote: 'Both come from scans. Arteries and veins share one colour here; select one to tell them apart.',
    note: 'The model covers the head and trunk only. Arm and leg vessels are not included.',
  },
  {
    id: 'skeleton', tab: 'Bones', title: 'Skeleton', kicker: 'Skeletal system',
    about: 'The skeleton supports the body, protects organs such as the brain, heart and lungs, and gives muscles something to pull against. Blood cells are made in the marrow inside many bones.', // [OS 6.1]
    stats: [
      { label: 'Bones in an adult', value: 206 },                       // [OS 7.1]
      { label: 'Vertebrae', text: '24 + sacrum + coccyx' },              // [OS 7.3]
      { label: 'Pairs of ribs', value: 12 },                             // [OS 7.4]
    ],
    readout: { kind: 'parts', label: 'Parts', note: 'Dashed boxes are stylised stand-ins' },
    subs: [
      { id: 'spine', label: 'Spine', parts: ['vertebrae'], note: 'A column of 24 separate vertebrae that carries the head and trunk and surrounds the spinal cord.',
        details: [
          { id: 'cervical', label: 'Cervical', parts: ['spine_cervical'], note: 'Seven vertebrae in the neck.' },
          { id: 'thoracic', label: 'Thoracic', parts: ['spine_thoracic'], note: 'Twelve vertebrae in the upper back. Each carries a pair of ribs.' },
          { id: 'lumbar', label: 'Lumbar', parts: ['spine_lumbar'], note: by('Five large vertebrae in the lower back that carry most of the body weight.', 'Large vertebrae in the lower back that carry most of the body weight. Most people have five; this model, built from one person, shows six.') },
        ] }, // [OS 7.3]
      { id: 'pelvis', label: 'Pelvis', parts: ['pelvis'], note: 'The two hip bones with the sacrum and coccyx. It passes body weight to the legs.',
        details: [
          { id: 'sacrum', label: 'Sacrum and coccyx', parts: ['pelvis_sacrum'], note: 'Fused vertebrae at the base of the spine. The coccyx is the tailbone.' },
          { id: 'ilium', label: 'Ilium', parts: ['pelvis_ilium'], note: 'The broad upper part of each hip bone.' },
          { id: 'ischium', label: 'Ischium', parts: ['pelvis_ischium'], note: 'The lower back part of each hip bone, which takes the weight when sitting.' },
          { id: 'pubis', label: 'Pubis', parts: ['pelvis_pubis'], note: 'The front part of each hip bone. The two sides meet in the midline.' },
        ] }, // [OS 8.3]
      { id: 'legs', label: 'Leg bones', parts: ['leg'], note: 'Femur, patella, tibia and fibula. The femur is the longest bone in the body.', inside: 'leg',
        details: [
          { id: 'femur', label: 'Femur', parts: ['leg_femur'], note: 'The thigh bone, the longest bone in the body.' },
          { id: 'patella', label: 'Patella', parts: ['leg_patella'], note: 'The kneecap, which sits in front of the knee joint.' },
          { id: 'tibia', label: 'Tibia', parts: ['leg_tibia'], note: 'The shin bone, the larger and weight-bearing bone of the lower leg.' },
          { id: 'fibula', label: 'Fibula', parts: ['leg_fibula'], note: 'The slender bone on the outer side of the lower leg.' },
          { id: 'cartilage', label: 'Knee cartilage', parts: ['leg_cartilage'], note: 'Smooth cartilage on the end of the femur, and the menisci that cushion the knee.' },
        ] }, // [OS 8.4]
      { id: 'skull', label: 'Skull', parts: ['skull'], standin: true, note: 'Protects the brain and forms the face. Drawn here as a simple outline.' }, // [OS 7.2]
      { id: 'ribs', label: 'Rib cage', parts: ['ribs'], standin: true, note: 'Twelve pairs of ribs and the breastbone protect the heart and lungs. Drawn here as simple arcs.' }, // [OS 7.4]
      { id: 'arms', label: 'Arm bones', parts: ['arms'], standin: true, note: 'Humerus in the upper arm, radius and ulna in the forearm. Drawn here as straight outlines.' }, // [OS 8.2]
    ],
    subsNote: 'Spine, pelvis and leg bones come from scans. Skull, ribs and arm bones are stylised stand-ins.',
    note: 'Skull, rib cage and arm bones are stylised stand-ins. Hand and foot bones are not shown.',
  },
  {
    id: 'lymph', tab: 'Lymph', title: 'Lymphatic', kicker: 'Lymphatic and immune system',
    about: 'The lymphatic system returns fluid from the tissues to the blood and is home to much of the immune system. Its organs make, train and house the white blood cells that fight infection.', // [OS 21.1]
    readout: { kind: 'parts', label: 'Parts', note: 'Select a part on the model or in the list' },
    subs: [
      { id: 'spleen', label: 'Spleen', parts: ['spleen'], note: 'Filters the blood, removing worn-out red blood cells and responding to infections carried in the bloodstream.' }, // [OS 21.1]
      { id: 'thymus', label: 'Thymus', parts: ['thymus'], note: 'Sits behind the breastbone. It is where T cells, a type of white blood cell, mature. It is most active in childhood.' }, // [OS 21.1]
      { id: 'node', label: 'Lymph node', parts: ['lymph_node'], note: 'A small filter on the lymph vessels where immune cells meet what the lymph carries. The body has many; one sample node is shown.' }, // [OS 21.1]
    ],
    subsNote: 'All three come from scans. Lymph vessels are not included in the model.',
    note: 'One sample lymph node is shown. Lymph vessels and tonsils are not included.',
  },
  REPRODUCTIVE,
].map((s, i) => ({ ...s, n: String(i + 1).padStart(2, '0') }));

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
