// 壓縮 cover 素材：縮至顯示尺寸的 2x 並轉 WebP（原始 png 保留不動）
// 用法：node scripts/optimize-cover.mjs（素材更新後重跑一次即可）
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const sharp = require('../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js')

const DIR = 'public/images/cover'

// [檔名, 目標寬 px]（顯示寬度 ≈ stage(最大~590px) × 佔比 × 2 倍螢幕密度）
const TARGETS = [
  ['bg.png', 1080],
  ['title.png', 920],
  ['btn.png', 520],
  ['deco-brain.png', 410],
  ['deco-tower.png', 500],
  ['deco-personna.png', 740],
  ['deco-personna-tiny.png', 340],
  ['deco-chain.png', 540],
  ['deco-chip.png', 430],
]

for (const [file, width] of TARGETS) {
  const out = `${DIR}/${file.replace(/\.png$/, '.webp')}`
  const meta = await sharp(`${DIR}/${file}`).metadata()
  await sharp(`${DIR}/${file}`)
    .resize({ width: Math.min(width, meta.width) })
    .webp({ quality: 82 })
    .toFile(out)
  const { size } = await import('fs').then(fs => fs.promises.stat(out))
  console.log(`${out}  ${(size / 1024).toFixed(0)}KB`)
}
