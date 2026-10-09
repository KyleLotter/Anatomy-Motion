// Guided tours. Each step selects a section and (optionally) a part, so the camera makes one
// continuous move from step to step. `cut` (0-90) and `axis` set the cutaway for that step.
// Educational only. Sources: OpenStax Anatomy and Physiology 2e
//   [19.1] heart anatomy and the path of blood; [20.1] blood vessels; [22.1, 22.4] airways and gas exchange;
//   [23.3-23.6] digestive organs; [25.2] urinary anatomy. NIDDK "Your Kidneys & How They Work".

export const TOURS = [
  {
    id: 'blood', title: 'Blood through the heart', blurb: 'One full circuit: body, heart, lungs, heart, body.',
    steps: [
      { section: 'heart', focus: 'vessels', text: 'Oxygen-poor blood comes back from the body through two large veins, the venae cavae.' },
      { section: 'heart', focus: 'ra', text: 'It collects in the right atrium.' },
      { section: 'heart', focus: 'valves', cut: 40, axis: 'z', text: 'The tricuspid valve opens and lets it down into the right ventricle. Valves only open one way, so blood cannot flow back.' },
      { section: 'heart', focus: 'rv', text: 'The right ventricle contracts and pushes the blood out through the pulmonary valve, toward the lungs.' },
      { section: 'lungs', focus: null, text: 'In the lungs the blood gives up carbon dioxide and picks up oxygen.' },
      { section: 'heart', focus: 'la', text: 'Now rich in oxygen, it returns through the pulmonary veins to the left atrium.' },
      { section: 'heart', focus: 'lv', text: 'It passes through the mitral valve into the left ventricle, the chamber with the thickest wall.' },
      { section: 'heart', focus: 'vessels', text: 'The left ventricle pumps it through the aortic valve into the aorta, the largest artery.' },
      { section: 'vessels', focus: 'arteries', text: 'Arteries branch from the aorta and carry the blood to every organ.' },
      { section: 'vessels', focus: 'veins', text: 'Veins collect it again and return it to the venae cavae, where the circuit started.' },
    ],
  },
  {
    id: 'food', title: 'The path of food', blurb: 'From swallowing to leaving the body.',
    steps: [
      { section: 'digestive', focus: 'stomach', text: 'Swallowed food travels down the oesophagus to the stomach, which churns it with acid and enzymes into a liquid called chyme. Both are stylised stand-ins in this model.' },
      { section: 'digestive', focus: 'liver', text: 'Meanwhile the liver makes bile, which helps break up fats.' },
      { section: 'digestive', focus: 'gallbladder', text: 'Bile is stored in the gallbladder and released through the bile ducts as chyme arrives in the small intestine.' },
      { section: 'digestive', focus: 'pancreas', text: 'The pancreas adds enzymes, and bicarbonate to neutralise the stomach acid.' },
      { section: 'digestive', focus: 'intestine_small', text: 'In the small intestine most digestion finishes and nutrients pass into the blood.' },
      { section: 'digestive', focus: 'intestine_large', text: 'The large intestine absorbs water and salts. What is left forms stool and leaves the body.' },
    ],
  },
  {
    id: 'urine', title: 'How urine is made', blurb: 'Blood in, urine out.',
    steps: [
      { section: 'urinary', focus: 'kidneys', text: 'Blood reaches each kidney through a renal artery. The kidneys filter out waste and extra water, and the cleaned blood leaves through the renal veins.' },
      { section: 'urinary', focus: 'ureters', text: 'The filtered waste, now urine, drains down the two ureters.' },
      { section: 'urinary', focus: 'bladder', text: 'It collects in the bladder, which stretches as it fills.' },
      { section: 'urinary', focus: 'urethra', text: 'When the bladder empties, urine leaves the body through the urethra.' },
    ],
  },
  {
    id: 'breath', title: 'One breath of air', blurb: 'From the windpipe to the blood.',
    steps: [
      { section: 'lungs', focus: 'airways', text: 'Air travels down the trachea, which splits into a main bronchus for each lung. The bronchi keep branching into smaller and smaller airways.' },
      { section: 'lungs', focus: null, text: 'The airways end in tiny air sacs spread through all five lobes. Oxygen passes from the air sacs into the blood, and carbon dioxide passes out.' },
      { section: 'heart', focus: 'la', text: 'The oxygen-rich blood flows to the left side of the heart, which pumps it to the rest of the body.' },
      { section: 'lungs', focus: null, text: 'Breathing out carries the carbon dioxide back up the same airways.' },
    ],
  },
];
