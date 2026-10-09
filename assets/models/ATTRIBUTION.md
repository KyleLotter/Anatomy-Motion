# Model attribution

3D organ models in this folder come from the **Human Reference Atlas (HRA) 3D Reference Object Library**
(HuBMAP / CCF), male set, version 1.2.

- Source: https://github.com/hubmapconsortium/ccf-3d-reference-object-library (path `VH_Male/v1.2/`)
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/
- Per the library's own notes the reference organs were built from the Visible Human dataset (US National Library of Medicine).
  Keep that credit alongside the library credit when displaying the models.

## What CC BY 4.0 requires of us

1. Give credit: name the source (HRA 3D Reference Object Library), link the licence, and keep this notice.
2. Indicate changes: if the files are compressed, decimated, re-centred, re-materialed or split, say so
   ("modified from the original").
3. No extra restrictions on top of the licence.

Show a short credit line in the app (for example in an About or Credits panel) and keep this file shipped with the models.

## Files downloaded (unmodified originals)

| File | Source path |
|---|---|
| Allen_M_Brain.glb | VH_Male/v1.2/Allen_M_Brain.glb |
| VH_M_Heart.glb | VH_Male/v1.2/VH_M_Heart.glb |
| VH_M_Lung.glb | VH_Male/v1.2/VH_M_Lung.glb |
| VH_M_Liver.glb | VH_Male/v1.2/VH_M_Liver.glb |
| VH_M_Kidney_L.glb, VH_M_Kidney_R.glb | VH_Male/v1.2/ |
| VH_M_Pancreas.glb | VH_Male/v1.2/VH_M_Pancreas.glb |
| VH_M_Small_Intestine.glb | VH_Male/v1.2/VH_M_Small_Intestine.glb |
| SBU_M_Intestine_Large.glb | VH_Male/v1.2/SBU_M_Intestine_Large.glb |
| VH_M_Spleen.glb | VH_Male/v1.2/VH_M_Spleen.glb |
| VH_M_Skin.glb | VH_Male/v1.2/VH_M_Skin.glb |
| VH_M_Spinal_Cord.glb | VH_Male/v1.2/VH_M_Spinal_Cord.glb |
| VH_M_Pelvis.glb | VH_Male/v1.2/VH_M_Pelvis.glb |
| VH_M_Vertebrae.glb | VH_Male/v1.2/VH_M_Vertebrae.glb |

## Known gaps in this library

No stomach, oesophagus, skull, ribs or limb bones. Anything drawn for those must be a stylised stand-in and be
labelled as such. Do not present a stand-in as anatomically accurate.

## Modified copies (`opt/`)

The files in `opt/` are **modified from the originals** above. The originals in this folder are untouched.

Changes, made with glTF-Transform v4 (`@gltf-transform/cli optimize`):

- meshes and nodes merged per file (named sub-parts such as heart chambers are no longer separate)
- welded and simplified with meshoptimizer to roughly 12% of the original triangles (2,031,719 to about 253,000)
- positions quantised and compressed with `EXT_meshopt_compression`
- `VH_M_Skin.glb` exported twice: `skin_points.glb` (about 41k triangles, drawn as points) and `skin_shell.glb` (about 8k, drawn as lines)

At runtime the app also drops the supplied normals and materials and draws the meshes as points, lines and a flat orange fill.

| Original | Modified copy |
|---|---|
| Allen_M_Brain.glb | opt/brain.glb |
| VH_M_Heart.glb | opt/heart.glb |
| VH_M_Lung.glb | opt/lungs.glb |
| VH_M_Liver.glb | opt/liver.glb |
| VH_M_Kidney_L.glb, VH_M_Kidney_R.glb | opt/kidney_l.glb, opt/kidney_r.glb |
| VH_M_Pancreas.glb | opt/pancreas.glb |
| VH_M_Small_Intestine.glb | opt/intestine_small.glb |
| SBU_M_Intestine_Large.glb | opt/intestine_large.glb |
| VH_M_Spleen.glb | opt/spleen.glb |
| VH_M_Skin.glb | opt/skin_points.glb, opt/skin_shell.glb |
| VH_M_Spinal_Cord.glb | opt/spinal_cord.glb |
| VH_M_Pelvis.glb | opt/pelvis.glb |
| VH_M_Vertebrae.glb | opt/vertebrae.glb |

## Not from this library

Stomach, oesophagus, bladder, ureters, skull, rib cage and limb bones are hand-built stand-ins generated in
`js/standins.js`. They are not CC BY material and are not anatomically accurate; the app labels them "stylised".

## Second batch (same source, same licence, downloaded 2026-10-09)

25 more unmodified originals from `VH_Male/v1.2/`, with their modified copies in `opt/`:

| Original | Modified copy |
|---|---|
| VH_M_Blood_Vasculature.glb | opt/vessels.glb (named meshes kept, so arteries and veins can be told apart) |
| VH_M_Blood_Vasculature_Heart.glb | opt/heart_vessels.glb |
| VH_M_Blood_Vasculature_Kidney.glb | opt/kidney_vessels.glb |
| VH_M_Blood_Vasculature_Liver.glb | opt/liver_vessels.glb |
| VH_M_Biliary_Tree.glb | opt/biliary.glb |
| VH_M_Gallbladder.glb | opt/gallbladder.glb |
| VH_M_Thymus.glb | opt/thymus.glb |
| VH_M_Prostate.glb | opt/prostate.glb |
| VH_M_Ureter_L.glb, VH_M_Ureter_R.glb | opt/ureter_l.glb, opt/ureter_r.glb |
| VH_M_Urethra.glb | opt/urethra.glb |
| VH_M_Urinary_Bladder.glb | opt/bladder.glb |
| VH_M_Eye_L.glb, VH_M_Eye_R.glb | opt/eye_l.glb, opt/eye_r.glb |
| VH_M_Muscles_Eye_L.glb, VH_M_Muscles_Eye_R.glb | opt/eye_muscles_l.glb, opt/eye_muscles_r.glb |
| VH_M_Nerves_Eye_L.glb, VH_M_Nerves_Eye_R.glb | opt/optic_nerve_l.glb, opt/optic_nerve_r.glb |
| VH_M_Knee_L.glb, VH_M_Knee_R.glb | opt/leg_l.glb, opt/leg_r.glb (these files hold the whole femur, tibia, fibula and patella) |
| NIH_M_Lymph_Node.glb | opt/lymph_node.glb |

Same changes as the first batch (merged, simplified, meshopt-compressed). Simplification ranges from none
(gallbladder, thymus) to about 2% of the original triangles (eyes, lymph node). All 39 originals: about 98 MB.
All 36 modified copies: about 2.6 MB and about 454,000 triangles.

Downloaded but not used by the app: `VH_M_Blood_Vasculature_Eye`, `_Gallbladder`, `_Large_Intestine` and `_Spleen`.
Every mesh in them is already inside `VH_M_Blood_Vasculature.glb`.

The stand-in list above is superseded: ureters, bladder and leg bones are now real models. Current stand-ins are
stomach, oesophagus, skull, rib cage, arm bones and peripheral nerves.

## Re-export of heart and lungs (2026-10-09)

`opt/heart.glb` and `opt/lungs.glb` were exported again from the same originals with their named sub-meshes kept
(14 heart parts, 67 lung and airway parts) so chambers, valves and lobes can be selected. Still simplified and
meshopt-compressed. `js/model-groups.js` records which lobe each lung mesh belongs to, read from the node
hierarchy of the original `VH_M_Lung.glb`.

## Re-export with named sub-parts (2026-10-09, second pass)

These modified copies were exported again from the same originals with their named sub-meshes kept, so the
pieces inside each organ can be selected: `brain`, `intestine_large`, `intestine_small`, `pancreas`, `kidney_l`,
`kidney_r`, `liver`, `eye_l`, `eye_r`, `prostate`, `pelvis`, `leg_l`, `leg_r`, `vertebrae`, `spinal_cord`
(and `heart`, `lungs` from the earlier pass). Still simplified and meshopt-compressed.

`tools/build-groups.mjs` reads the originals and writes `js/model-groups.js`, which assigns every named mesh to a
selectable part. The grouping of the 283 Allen brain regions into lobes and structures is ours, made by matching
region names against standard gross anatomy; it is a modification of how the source organises them.

## Female body (downloaded 2026-10-09)

A second body from the same library and under the same licence (CC BY 4.0): the HRA 3D Reference Object Library,
female set, built from the Visible Human Female dataset (US National Library of Medicine).

- Source: https://github.com/hubmapconsortium/ccf-3d-reference-object-library
- 42 unmodified originals from `VH_Female/v1.2/` and the two mammary gland files from `VH_Female/v1.3/`,
  kept in `assets/models/female/` under their original names (about 149 MB).
- Modified copies in `assets/models/opt/female/` (45 files, about 4.1 MB, about 617,000 triangles), named to match
  the male copies so the app can switch body by switching folder.

Changes are the same kind as for the male set: merged or split by named sub-mesh, simplified with meshoptimizer,
quantised and meshopt-compressed (`tools/build-female-models.sh`). In addition, the skin and both mammary gland
files had their normals, colours and texture coordinates removed before simplifying
(`tools/strip-attributes.mjs`), because they store a separate vertex per triangle corner and cannot be welded
otherwise.

Not downloaded from the female set: the eye, gallbladder, large-intestine and spleen vessel subsets, the separate
duct files, the small-intestine measurement file and the knee ligament and muscle files.

The stylised stand-ins (stomach, oesophagus, skull, rib cage, arm bones, peripheral nerves) are the same hand-built
shapes for both bodies. They were drawn against the male body and are stretched to the female body's landmarks.
