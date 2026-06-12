// 壓縮卡片圖：縮至顯示尺寸的 2x（最大顯示 ~380px 寬）並轉 WebP（原 jpg 保留）
// 用法：node scripts/optimize-cards.mjs（卡圖更新後重跑一次即可）
import { createRequire } from 'module'
import { readdirSync, statSync } from 'fs'
const require = createRequire(import.meta.url)
const sharp = require('../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js')

const DIR = 'public/images/cards'

for (const file of readdirSync(DIR)) {
  if (!file.endsWith('.jpg')) continue
  const out = `${DIR}/${file.replace(/\.jpg$/, '.webp')}`
  await sharp(`${DIR}/${file}`).resize({ width: 760 }).webp({ quality: 80 }).toFile(out)
  console.log(`${out}  ${(statSync(out).size / 1024).toFixed(0)}KB`)
}
