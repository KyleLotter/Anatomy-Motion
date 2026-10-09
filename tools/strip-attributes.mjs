// Build helper: copy a GLB keeping only POSITION on every primitive, so vertices that differ only in
// normals, colours or UVs can be welded and the mesh simplified.  node tools/strip-attributes.mjs in.glb out.glb
import fs from 'node:fs';
const [, , input, output] = process.argv;
const b = fs.readFileSync(input), jsonLen = b.readUInt32LE(12);
const json = JSON.parse(b.subarray(20, 20 + jsonLen)), rest = b.subarray(20 + jsonLen);
for (const m of json.meshes) for (const p of m.primitives) p.attributes = { POSITION: p.attributes.POSITION };
let text = Buffer.from(JSON.stringify(json)); while (text.length % 4) text = Buffer.concat([text, Buffer.from(' ')]);
const head = Buffer.alloc(20); b.copy(head, 0, 0, 12); head.writeUInt32LE(20 + text.length + rest.length, 8); head.writeUInt32LE(text.length, 12); head.writeUInt32LE(0x4e4f534a, 16);
fs.writeFileSync(output, Buffer.concat([head, text, rest]));
