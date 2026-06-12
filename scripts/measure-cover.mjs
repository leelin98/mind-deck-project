// 量測工具（一次性）：用模板比對找出各 cover 素材在 cover.png 中的位置與縮放
// 用法：node scripts/measure-cover.mjs
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const sharp = require('../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js')

const DIR = 'public/images/cover'
const COVER_W = 1080
const COVER_H = 1920

// 先把 cover 縮小加速比對（1/4 → 270×480）
const SCALE = 4
const CW = COVER_W / SCALE
const CH = COVER_H / SCALE

async function loadRaw(path, w, h) {
  const { data, info } = await sharp(path)
    .resize(w, h, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

// 取 alpha 內容的 bounding box（原始解析度）
async function alphaBBox(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3]
      if (a > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1, fullW: info.width, fullH: info.height }
}

// 在 cover 上用 SSD 找 deco 最佳位置與縮放（cover/deco 都已縮小）
async function matchOne(name, widthCandidates) {
  const cover = await loadRaw(`${DIR}/cover.png`, CW, CH)
  const bbox = await alphaBBox(`${DIR}/${name}`)

  let best = null
  for (const wPct of widthCandidates) {
    // wPct = deco「內容寬」佔 cover 寬的比例
    const tw = Math.round((wPct / 100) * CW)
    const th = Math.round(tw * (bbox.h / bbox.w))
    if (tw < 4 || th < 4 || tw > CW || th > CH) continue

    // 將 deco 內容區縮到 tw×th
    const { data: tpl } = await sharp(`${DIR}/${name}`)
      .extract({ left: bbox.minX, top: bbox.minY, width: bbox.w, height: bbox.h })
      .resize(tw, th, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // 粗掃（步距 2px）
    for (let oy = -Math.round(th * 0.4); oy <= CH - Math.round(th * 0.6); oy += 2) {
      for (let ox = -Math.round(tw * 0.4); ox <= CW - Math.round(tw * 0.6); ox += 2) {
        let ssd = 0
        let count = 0
        for (let y = 0; y < th; y += 3) {
          const cy = oy + y
          if (cy < 0 || cy >= CH) continue
          for (let x = 0; x < tw; x += 3) {
            const cx = ox + x
            if (cx < 0 || cx >= CW) continue
            const ti = (y * tw + x) * 4
            if (tpl[ti + 3] < 200) continue // 只比對不透明像素
            const ci = (cy * CW + cx) * 4
            const dr = tpl[ti] - cover.data[ci]
            const dg = tpl[ti + 1] - cover.data[ci + 1]
            const db = tpl[ti + 2] - cover.data[ci + 2]
            ssd += dr * dr + dg * dg + db * db
            count++
          }
        }
        if (count < 30) continue
        const score = ssd / count
        if (!best || score < best.score) {
          best = { score, ox, oy, tw, th, wPct }
        }
      }
    }
  }

  if (!best) { console.log(`${name}: no match`); return }
  // 換算為 cover 百分比（內容區）
  const leftPct = ((best.ox / CW) * 100).toFixed(1)
  const topPct = ((best.oy / CH) * 100).toFixed(1)
  const wPct = ((best.tw / CW) * 100).toFixed(1)
  const hPct = ((best.th / CH) * 100).toFixed(1)
  const rightPct = (100 - parseFloat(leftPct) - parseFloat(wPct)).toFixed(1)
  console.log(
    `${name}: left ${leftPct}% top ${topPct}% width ${wPct}% (height ${hPct}%, right ${rightPct}%, score ${Math.round(best.score)})` +
    ` | content-bbox in png: ${JSON.stringify(bbox)}`
  )
}

const jobs = [
  ['title.png', [70, 74, 78, 82, 86, 90]],
  ['btn.png', [42, 46, 50, 54, 58]],
  ['deco-brain.png', [18, 21, 24, 27, 30]],
  ['deco-tower.png', [22, 25, 28, 31, 34]],
  ['deco-personna-tiny.png', [8, 10, 12, 14, 16]],
  ['deco-personna.png', [26, 30, 34, 38, 42]],
  ['deco-chain.png', [12, 15, 18, 21, 24]],
  ['deco-chip.png', [22, 26, 30, 34]],
]

for (const [name, widths] of jobs) {
  await matchOne(name, widths)
}
