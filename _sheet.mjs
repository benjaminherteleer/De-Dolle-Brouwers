import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const [dir, out, start, count] = process.argv.slice(2);
let files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f)).map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t).map(x => x.f);
files = files.slice(+start, +start + +count);
const T = +(process.env.T||160), cols = +(process.env.C||8);
const tiles = [];
for (const [i, f] of files.entries()) {
  try {
    const buf = await sharp(path.join(dir, f)).rotate().resize(T, T, { fit: 'cover' }).jpeg().toBuffer();
    tiles.push({ input: buf, left: (i % cols) * T, top: Math.floor(i / cols) * (T + 0) });
  } catch {}
}
const rows = Math.ceil(files.length / cols);
await sharp({ create: { width: cols * T, height: rows * T, channels: 3, background: '#fff' } }).composite(tiles).jpeg({ quality: 70 }).toFile(out);
fs.writeFileSync(out + '.txt', files.map((f, i) => i + ' ' + f).join('\n'));
