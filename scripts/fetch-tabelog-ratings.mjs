#!/usr/bin/env node
/**
 * restaurants.json の rating を食べログの点数で更新する。
 *
 *   npm run ratings            書き換える
 *   npm run ratings -- --check 差分があるかだけ見る（書かない）
 *
 * 点数は時間とともに動くので、気が向いたときに再実行する前提のツール。
 * 取得に失敗した店は「既存の値を残す」。ページの構造が変わったり弾かれたりしたときに、
 * 正しかった点数を空にしてしまうのが一番まずいため。
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { extractScore, formatRestaurantsJson, withRating } from './lib/tabelog.mjs'

const DATA = fileURLToPath(new URL('../src/data/restaurants.json', import.meta.url))
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
/** 連続アクセスの間隔（ms）。49件を1分ちょっとかけて回る。並列で叩かない。 */
const INTERVAL = 1200

const checkOnly = process.argv.includes('--check')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchScore(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'ja' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const score = extractScore(await res.text())
  if (score === null) throw new Error('点数が見つかりません')
  return score
}

const raw = await readFile(DATA, 'utf8')
const list = JSON.parse(raw)

const updated = []
const failed = []
const noUrl = []
let unchanged = 0
let first = true

const out = []
for (const r of list) {
  if (typeof r.url !== 'string' || !r.url.startsWith('https://tabelog.com/')) {
    noUrl.push(r.id)
    out.push(r)
    continue
  }

  if (!first) await sleep(INTERVAL)
  first = false

  try {
    const score = await fetchScore(r.url)
    if (r.rating === score) unchanged += 1
    else updated.push(`  ${r.name}: ${r.rating ?? '—'} → ${score}`)
    out.push(withRating(r, score))
  } catch (e) {
    // 既存の rating はそのまま残す
    failed.push(`  ${r.id}: ${e.message}`)
    out.push(r)
  }
}

const next = formatRestaurantsJson(out)
const changed = next !== raw

if (updated.length > 0) console.log(updated.join('\n'))
if (failed.length > 0) console.log(`失敗:\n${failed.join('\n')}`)
if (noUrl.length > 0) console.log(`スキップ（食べログURLなし）: ${noUrl.join(', ')}`)
console.log(
  `更新 ${updated.length}件 / 変化なし ${unchanged}件 / 失敗 ${failed.length}件 / URLなし ${noUrl.length}件`,
)

if (checkOnly) {
  console.log(changed ? '--check: 差分あり' : '--check: 差分なし')
  process.exit(changed || failed.length > 0 ? 1 : 0)
}

if (changed) {
  await writeFile(DATA, next)
  console.log(`書き込みました: ${DATA}`)
}
process.exit(failed.length > 0 ? 1 : 0)
