# Decision log

## 2026-10-09

1. **Dark theme is the default**, light is a "paper chart" inversion. The references are dark only; light exists because the brief asks for both.
2. **One accent hue (orange-red), one neutral hue (180).** `signal` teal is the neutral hue with more chroma, limited to leader lines and arcs. No status colours.
3. **HUD furniture shows real state** (orbit angle, loaded parts, height ruler, load status) instead of the references' decorative numbers.
4. **Body copy in sentence case**, caps for labels and titles only. Readability over fidelity to the reference.
5. **Paragraphs use `text-primary`** in dark mode, because `text-secondary` measures Lc 67, under the APCA body level.
6. **Stand-ins render dashed and carry a "STYLISED" tag.** Needed for: stomach, oesophagus, skull, ribs, limb bones, and (found on inspection) ureters and bladder.
7. **Contrast was measured with a local script** (OKLCH to sRGB, WCAG 2 and APCA). Light accent chroma was reduced to bring it inside sRGB.

## 2026-10-09, build

8. **Approved by the user:** Google Fonts at runtime, `npx @gltf-transform/cli`, stand-ins for ureters and bladder, Playwright MCP for testing.
9. **Models:** originals kept; simplified meshopt copies in `assets/models/opt/` (48 MB to 1.3 MB, 2.03M to 253k triangles). Sub-parts were merged per file, so heart chambers and intestine segments are not individually selectable.
10. **Three.js 0.170.0.** Core from cdnjs as asked. GLTFLoader and the meshopt decoder are not hosted on cdnjs, so they load from jsDelivr at the same version through the import map.
11. **Tokens are stored as hex, not `oklch()`**, because the WebGL scene reads them. OKLCH sources are in comments in `css/tokens.css`.
12. **Lines are one segment per unique edge** (built at load) instead of GPU wireframe: half the segments and even alpha.
13. **Unselected wire fades with on-screen scale**, otherwise organs turn into a white blob in body view.
14. **Camera framing is padded per section** (heart 1.8x, brain 1.55x) so the organ reads in context, as in the references.
15. **Digestive focus:** the tapped part goes solid, its siblings stay as orange wire. The camera does not move on sub-part focus.
16. **Spleen is in section 04 as requested but is labelled a lymphatic organ**, not a digestive one.
17. **Small-intestine length and brain mass were left out**: sources disagree.
18. **Physiology list sits in the data column** so the desktop right rail does not scroll. On small screens it therefore appears before About.
19. **Scrims are 92% (sheet) and 88% (desktop rails)** so label text keeps 4.5:1 even with pure white or black behind them (computed, worst case).
20. **Dev server is `node dev-server.mjs`** inside this folder, to keep everything within `anatomy-motion/`.

## Critique pass (critique-screen and audit-ai-design-slop), fixed

- Title echo sat one glyph left of the title and read as "LLUNGS". Echoes moved out to 2.2em and dimmed.
- Body tab was dashed, but dashed means "stylised" everywhere else. Now solid.
- Theme and Credits buttons had a square glyph that read as a checkbox. Now plain bordered buttons.
- Part count was stated twice (status bar and parts grid) and the section name twice (ticker and kicker). Removed from status bar and ticker.
- Disclaimer clipped at 390 px. The wordmark is now hidden on small screens so it always fits.
- Light theme wire was too heavy and tinted siblings formed a dark red mass. Opacities reduced.
- Top instruments were unreadable when the model passed behind them. Added a top scrim.
- Hint said "Tap" on desktop. Now "Select".

## Known limits

- Orbit gauge and compass tape show the same value (azimuth). Kept because the brief asked for both pieces of furniture.
- Concentric rings behind the organ are decorative.
- Verified in desktop Chromium through Playwright only. Not yet run on a real phone, so touch feel, safe areas and frame rate on hardware are unverified.
- Text over the scene: contrast was computed for the worst case, not sampled from pixels.
- No offline support: Three.js and fonts load from CDNs.

## 2026-10-09, expansion to nine sections

21. **Approved by the user:** download 25 more HRA models; skeleton stand-ins "should fit with what we already have"; nerves "go crazy".
22. **Sections are now 01 Nervous, 02 Heart, 03 Lungs, 04 Digestive, 05 Kidneys, 06 Vessels, 07 Skeleton, 08 Lymphatic, 09 Prostate.** Brain is a part inside Nervous; selecting it reframes the camera on the brain.
23. **Real models replaced three stand-ins:** ureters, bladder and leg bones (the "knee" files hold whole leg bones). Urethra, gallbladder, bile ducts, thymus, prostate, eyes, optic nerves, a lymph node, the aorta and coronary vessels are new.
24. **Arteries and veins come from one file**, split at load by mesh name (`vein|vena|sinus` is a vein, everything else an artery). They share the accent colour; the brief allows one accent only, so they are told apart by selecting one.
25. **Peripheral nerves are a hand-drawn schematic** (spinal roots, intercostals, vagus, arm nerves, femoral, sciatic, tibial, fibular). Paths run between estimated landmarks and are labelled stylised in the chip, the tag, the note and Credits.
26. **Spleen moved from Digestive to Lymphatic**, where it belongs. This reverses the original brief, which listed it under Digestive.
27. **A part can be several models and a model can be in several sections.** Parts hidden by default (base 0) are not drawn and cannot be picked until their section is open.
28. **Tabs scroll horizontally on small screens** with an edge fade; ten no longer fit. Number keys 0-9 select sections.
29. **Sections without a readout** (Prostate) hide the data column instead of inventing a vital sign.

## Known limits, added

- Triangle count rose from about 253k to about 454k. Hidden parts are skipped, but frame rate on a real phone is still unverified.
- Vessels cover head and trunk only; no arm or leg vessels, no lymph vessels, no muscles, no hand or foot bones, no female anatomy.
- Heart beat scales the heart but not the attached aorta, so they separate very slightly on each beat.

## 2026-10-09, drill-down and cutaway

30. **Heart and lungs keep their named sub-meshes.** Heart: four chambers, septum, valves (with papillary muscles), aorta and vessels. Lungs: five lobes plus the airway tree. Lobe membership comes from the original file's hierarchy, not from guessing by name.
31. **Cutaway is one shared clipping plane** that sweeps through whatever is lit (the focused part, or the whole section), from the front, side or top. It also cuts the surrounding wire, which is what lets you see past the ribs. Skin points are not cut.
32. **The cutaway control is a native range input**: it tracks the finger exactly, works with arrow keys, and needs no custom gesture code. The plane position is spring-smoothed and snaps under reduced motion.
33. **No cap on the cut surface.** Models are surface shells, so a cut organ looks hollow. The heart "chambers" are the chamber volumes, not the muscle wall.
34. **Beating and breathing scale all heart parts, and all lung parts, about one shared centre** so they stay joined.

## Known limits, added

- On a phone the cutaway slider is inside the sheet. It is reachable at the half position; at full height the sheet covers the model.
- Other organs (kidney, brain regions, colon segments, vertebrae) still load as single merged meshes.

## 2026-10-09, guided tours

35. **Four tours, data-driven in `js/tours.js`:** blood through the heart (10 steps), the path of food (6), how urine is made (4), one breath of air (4). A step is just a section, an optional part and an optional cutaway setting, so the camera makes one continuous move between steps.
36. **User-paced, no autoplay.** Next and Back only. Autoplay would move the scene while someone is still reading.
37. **The tour panel sits under the section title**, so on a phone it is visible at the sheet's resting height, and the resting height grows to fit it.
38. **Taking the controls ends the tour.** Tapping an organ, a tab or a part chip, or pressing Escape, leaves the tour where it is rather than fighting the user.
39. **Each step is announced** through the live region as "Step n of N" plus the caption.

## Known limits, added

- Tours have no deep link and do not resume after a reload.
- The blood tour shows the lungs as a whole for gas exchange; pulmonary arteries and veins are not separate models.

## 2026-10-09, remaining drill-downs

40. **Parts can now contain parts.** Focusing a part with pieces shows an "Inside the ..." row: 12 brain regions, 4 spinal cord regions, 8 eye parts, 5 valve parts, 5 liver parts, 2 biliary parts, 3 pancreas parts, 3 small-intestine parts, 6 colon segments, 5 kidney parts, 3 spine regions, 4 pelvis bones, 5 leg parts, 4 prostate zones. 69 pieces in all.
41. **One build script owns the grouping** (`tools/build-groups.mjs`). Rules match the original files' hierarchy and mesh names; it reports any mesh that matches nothing. All 14 sets report none.
42. **Brain grouping is by name, into standard lobes and structures.** 283 Allen regions become frontal, parietal, temporal and occipital lobes, insula, limbic structures, deep nuclei, cerebellum, brainstem, ventricles, white matter, and olfactory and basal forebrain. Two judgement calls: the subcallosal gyrus sits with the olfactory group, and the pretectal region sits with the brainstem.
43. **Tapping drills one level at a time:** section, then part, then piece. Escape steps back out the same way.
44. **Selecting a piece reframes the camera on its parent part,** even in sections that otherwise hold the camera still (this relaxes decision 15 for pieces only).
45. **Sibling parts fade as you go deeper** (40% at part level, 14% at piece level). Without this, eleven orange wire lobes hid the one that was selected.
46. **The About text folds away while a part is focused,** so the part's own note and its pieces are not pushed below the fold.
47. **Parts grid shows one cell per organ,** not per piece (36 cells, not 101).
48. **Liver surface features** (capsule, impressions, bare area) load with the liver but have no chip of their own.

## Known limits, added

- Individual vertebrae, individual brain gyri and individual lung segments are in the files but not selectable one by one.
- Triangles are now about 470k and the scene has about 100 separately drawn parts. Frame rate on a real phone is still unverified.
- In body view a first tap on a small or deep organ can miss; the tabs always work.

## 2026-10-09, search, reset and the phone tab bar

49. **Phone tabs are two rows of five, not a scrolling strip.** The user reported the strip would not side-scroll. I could not reproduce that on a touch device from here, so rather than patch the scrolling I removed the need for it: all ten sections are always visible, each 44 px tall. The dock is 48 px taller as a result.
50. **Reset button in the top bar.** One press from anywhere returns to the whole body at the opening angle and zoom, turns the cutaway off and ends any tour. Also on the Home key.
51. **Search and index are one dialog.** Empty, it lists all 120 entries (sections, parts, pieces) grouped by section; typing filters it. Enter takes the first match, arrow keys walk the list, "/" opens it. Picking an entry flies the camera there.
52. **Search knows everyday names** (kneecap, windpipe, shin bone, tailbone and so on) through a small alias table in `js/main.js`.
53. **No match says why:** the message lists what the model does not contain.
54. **Escape closes search in one press.** Browsers clear a search box on the first Escape; that is overridden.
55. **Phone top bar is Search, Tours, Reset, More.** Theme and Credits moved into More to make room, and the "Online" word hides once loaded (the dot stays). Desktop shows everything.

## 2026-10-09, female body

56. **A second body, not extra parts.** The female organs are a scan of a different person and would not fit inside the male skin, so the app loads one body at a time. The switch (top bar on desktop, More on a phone) reloads the page with the other model set and remembers the choice.
57. **Downloaded on the user's go-ahead for "the female anatomy"**, which I had described as the same library's female set under the same licence: 44 files, about 149 MB of originals.
58. **Same nine sections.** Section 09 becomes "Uterus" (female reproductive system): uterus with fundus, body, cervix and uterine vessels; ovaries; fallopian tubes with three regions; vagina; ligaments; mammary glands with five parts; placenta.
59. **Placenta is opt-in.** The library supplies it as a reference object placed in front of the abdomen, not inside the uterus. It appears only when selected, and its note says where it is and why.
60. **Parts a body lacks are removed, not faked.** The female set has no urethra, so that part, its search entry and its tour step are dropped for that body. No stand-in was drawn.
61. **Model quirks are stated, not hidden.** The female model has six lumbar vertebrae and four sacral cord segments; the notes for those pieces say so and give the usual number.
62. **Stand-ins are stretched to fit each body.** Each is tied to a landmark (brain, lungs, trunk organs or skin) and scaled from the male landmark's bounds to the loaded body's. This is a box stretch, not a re-draw.
63. **Whole-body framing and the height ruler come from the skin's own bounds** (1.83 m male, 1.67 m female) instead of constants.
64. **One grouping script for both bodies.** File and mesh names differ between the sets (lung lobe group names, "jejenum", where the caudate lobe and knee cartilage sit in the hierarchy); the rules now match both, and both report no unmatched meshes.

## Known limits, added

- The stomach stand-in sits less convincingly in the female body than in the male one: the box stretch puts it partly over the liver.
- The female scene is heavier (about 617k triangles against about 467k). Frame rate on a real phone is unverified for either body.
- Switching body is a page reload, so it is a cut, not a camera move.
- The male set has no testes; the female set has no urethra.
