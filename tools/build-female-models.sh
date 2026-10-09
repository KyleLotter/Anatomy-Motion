#!/usr/bin/env bash
# Build step: simplify and meshopt-compress the female originals into assets/models/opt/female/.
# Output names match the male copies so the app can switch body by switching folder.
# Run from the project root:  bash tools/build-female-models.sh
# Columns: source file | output name | target triangles | simplify error | join meshes (false keeps named sub-parts)
set -u
SRC=assets/models/female
OUT=assets/models/opt/female
mkdir -p "$OUT"
build() {
  local ratio
  ratio=$(node -e "const b=require('fs').readFileSync('$SRC/$1.glb');const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));let t=0;for(const m of j.meshes)for(const p of m.primitives)t+=j.accessors[p.indices].count/3;console.log(Math.min(1,$3/t).toFixed(4))")
  npx -y @gltf-transform/cli@4 optimize "$SRC/$1.glb" "$OUT/$2.glb" --compress meshopt --simplify true --simplify-ratio "$ratio" --simplify-error "$4" \
    --texture-compress false --palette false --instance false --join "$5" --join-named "$5" 2>&1 | grep -iE "error|warn"
  echo "done $2 (ratio $ratio)"
}
build Allen_F_Brain brain 45000 0.02 false
build VH_F_Heart heart 26000 0.01 false
build VH_F_Lung lungs 37000 0.01 false
build VH_F_Vertebrae vertebrae 27000 0.01 false
build VH_F_Pelvis pelvis 12000 0.01 false
build VH_F_Kidney_L kidney_l 9000 0.01 false
build VH_F_Kidney_R kidney_r 9000 0.01 false
build VH_F_Liver liver 10000 0.01 false
build SBU_F_Intestine_Large intestine_large 9700 0.01 false
build VH_F_Small_Intestine intestine_small 9500 0.01 false
build VH_F_Spleen spleen 3400 0.01 true
build VH_F_Pancreas pancreas 3500 0.01 false
build VH_F_Spinal_Cord spinal_cord 3000 0.01 false
build VH_F_Blood_Vasculature vessels 51000 0.01 false
build VH_F_Blood_Vasculature_Heart heart_vessels 30000 0.01 true
build VH_F_Blood_Vasculature_Kidney kidney_vessels 3500 0.01 true
build VH_F_Blood_Vasculature_Liver liver_vessels 8000 0.01 true
build VH_F_Blood_Vasculature_Uterus uterus_vessels 4000 0.01 true
build VH_F_Biliary_Tree biliary 9000 0.01 true
build VH_F_Gallbladder gallbladder 99999 0.001 true
build VH_F_Thymus thymus 99999 0.001 true
build VH_F_Ureter_L ureter_l 7500 0.01 true
build VH_F_Ureter_R ureter_r 7500 0.01 true
build VH_F_Urinary_Bladder bladder 5000 0.01 true
build VH_F_Eye_L eye_l 13700 0.03 false
build VH_F_Eye_R eye_r 13700 0.03 false
build VH_F_Muscles_Eye_L eye_muscles_l 4600 0.01 true
build VH_F_Muscles_Eye_R eye_muscles_r 4600 0.01 true
build VH_F_Nerves_of_Eye_L optic_nerve_l 4200 0.01 true
build VH_F_Nerves_of_Eye_R optic_nerve_r 4200 0.01 true
build VH_F_Knee_L leg_l 10400 0.01 false
build VH_F_Knee_R leg_r 10400 0.01 false
build NIH_F_Lymph_Node lymph_node 6000 0.03 true
build VH_F_Uterus uterus 8000 0.01 false
build VH_F_Fallopian_Tube_L fallopian_l 4000 0.01 false
build VH_F_Fallopian_Tube_R fallopian_r 4000 0.01 false
build VH_F_Ovary_L ovary_l 99999 0.001 true
build VH_F_Ovary_R ovary_r 99999 0.001 true
build VH_F_Vagina vagina 3000 0.01 true
build VH_F_Ligaments_Uterus_Ovaries uterus_ligaments 8000 0.01 true
build VH_F_Placenta placenta 9000 0.02 true

# The skin and mammary glands store a separate vertex for every triangle corner, so they cannot be welded or
# simplified as they are. Copy them with positions only first, then build from the copies.
TMP=$(mktemp -d)
for f in VH_F_Skin VH_F_mammary_gland_L VH_F_mammary_gland_R; do node tools/strip-attributes.mjs "$SRC/$f.glb" "$TMP/$f.glb"; done
SRC=$TMP
build VH_F_Skin skin_points 80000 0.01 true
build VH_F_Skin skin_shell 16800 0.02 true
build VH_F_mammary_gland_L breast_l 24000 0.02 false
build VH_F_mammary_gland_R breast_r 26000 0.02 false
