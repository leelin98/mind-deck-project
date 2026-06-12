// 驗證工具（一次性）：把素材以指定位置/寬度（整張 png、% of 1080×1920）
// 疊到 bg.png 上輸出 /tmp/cover-composed.png，與 cover.png 並排比對
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const sharp = require('../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js')

const DIR = 'public/images/cover'
const W = 1080
const H = 1920

// ── 位置表（之後直接轉成 CSS %）─────────────────────────────
export const LAYOUT = [
  // [file, leftPct, topPct, widthPct]
  ['deco-brain.png', -4.0, -1.0, 34.0],
  ['deco-tower.png', 58.0, 2.5, 42.0],
  ['deco-personna-tiny.png', -2.1, 28.4, 28.5],
  ['title.png', 11.5, 18.8, 77.0],
  ['deco-chain.png', -17.0, 53.5, 45.0],
  ['deco-personna.png', 59.5, 49.5, 67.0],
  ['deco-chip.png', 1.0, 75.5, 36.0],
  ['btn.png', 29.3, 63.8, 43.4],
]

const composites = []
for (const [file, leftPct, topPct, widthPct] of LAYOUT) {
  const targetW = Math.round((widthPct / 100) * W)
  const buf = await sharp(`${DIR}/${file}`).resize({ width: targetW }).png().toBuffer()
  const meta = await sharp(buf).metadata()
  let left = Math.round((leftPct / 100) * W)
  let top = Math.round((topPct / 100) * H)
  // sharp composite 不支援負座標 → 先裁切超出部分
  let cropL = 0, cropT = 0
  if (left < 0) { cropL = -left; left = 0 }
  if (top < 0) { cropT = -top; top = 0 }
  const cw = Math.min(meta.width - cropL, W - left)
  const ch = Math.min(meta.height - cropT, H - top)
  if (cw <= 0 || ch <= 0) continue
  const clipped = await sharp(buf)
    .extract({ left: cropL, top: cropT, width: cw, height: ch })
    .png()
    .toBuffer()
  composites.push({ input: clipped, left, top })
}

await sharp(`${DIR}/bg.png`).composite(composites).png().toFile('/tmp/cover-composed.png')

// 並排輸出（左：合成、右：目標 cover.png），各縮到 540 寬方便比對
const a = await sharp('/tmp/cover-composed.png').resize({ width: 540 }).png().toBuffer()
const b = await sharp(`${DIR}/cover.png`).resize({ width: 540 }).png().toBuffer()
await sharp({ create: { width: 1090, height: 960, channels: 3, background: '#222' } })
  .composite([
    { input: a, left: 0, top: 0 },
    { input: b, left: 550, top: 0 },
  ])
  .png()
  .toFile('/tmp/cover-side-by-side.png')

console.log('done: /tmp/cover-side-by-side.png')
