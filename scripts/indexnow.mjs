#!/usr/bin/env node
// Tells Bing (and the other IndexNow engines) which pages changed, using the
// site's live sitemap as the only source of truth. No dependencies; Node 18+.
//
//   node scripts/indexnow.mjs --host example.com --key <key>
//   node scripts/indexnow.mjs --host example.com --dry-run     (sends nothing, key optional)
//
// It announces changes only. It never backfills the whole site, because a page
// flood can cost visibility (one site lost Google traffic after ~5,600 pages in five days).
//
// Guards, each of which sends nothing rather than guessing:
// - first run looks back 26 hours only; later runs look back to the last success, at most 7 days
// - over --ceiling pages in a run, or over --weekly-ceiling in 7 days: refuse
// - nearly every page "changed": refuse, the sitemap's lastmod is probably the build time
// - the live key file doesn't match: refuse, the engines would reject it anyway
// - a page that isn't a plain 200, renders noindex or canonicalises elsewhere is left out
// - a page that times out or answers 429/5xx is held and retried on later runs, for up to 7 days
//
// Prints one JSON line. Exit 0 = ok, nothing to do, or dry run. Exit 1 = refused or failed.

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"]
const UA = "indexnow-check/1.0"
const HOUR = 3600 * 1000
const DAY = 24 * HOUR
const FIRST_RUN_MS = 26 * HOUR
const MAX_LOOKBACK_MS = 7 * DAY
const MAX_SITEMAPS = 50
const MIN_PAGES_FOR_BUILD_TIME_CHECK = 20

const decode = (s) =>
  s
    .replace(/^\s*<!\[CDATA\[/, "")
    .replace(/\]\]>\s*$/, "")
    .trim()
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")

const tag = (block, name) => {
  const m = block.match(new RegExp(`<(?:[a-z]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[a-z]+:)?${name}>`, "i"))
  return m ? decode(m[1]) : null
}

const blocks = (xml, name) => [...xml.matchAll(new RegExp(`<${name}[\\s>][\\s\\S]*?</${name}>`, "gi"))].map((m) => m[0])

/** One sitemap body: `urls` of a urlset, or `children` of a sitemap index. at is epoch ms, 0 if absent or invalid. */
export function parseSitemap(xml) {
  const children = blocks(xml, "sitemap").map((b) => tag(b, "loc")).filter(Boolean)
  const urls = blocks(xml, "url").flatMap((b) => {
    const url = tag(b, "loc")
    if (!url) return []
    const lastmod = tag(b, "lastmod") ?? ""
    const at = Date.parse(lastmod)
    if (Number.isNaN(at)) return [{ url, at: 0 }]
    // A bare date can mean any time that day, so count it as the end of the day.
    // Otherwise a page published after the morning run looks older than that run and is never sent.
    return [{ url, at: /^\d{4}-\d{2}-\d{2}$/.test(lastmod) ? at + DAY - 1 : at }]
  })
  return { urls, children }
}

/** Decides what to announce. Pure, so the guards can be tested without a network. */
export function selectChanged(pages, { host, since, now, ceiling, weeklyCeiling, sentThisWeek }) {
  const seen = new Set()
  const unique = pages.filter((p) => !seen.has(p.url) && seen.add(p.url))
  const own = unique.filter((p) => {
    try {
      return new URL(p.url).host === host
    } catch {
      return false
    }
  })
  const stats = { pages: own.length, off_host: unique.length - own.length, no_lastmod: own.filter((p) => !p.at).length }
  if (!unique.length) return { ...stats, urls: [], refuse: "the sitemap lists no URLs" }
  if (!own.length) return { ...stats, urls: [], refuse: `no sitemap URL is on ${host}; check www vs apex` }

  // A lastmod over a day ahead is a bug in the sitemap, not a change.
  const changed = own.filter((p) => p.at > since && p.at <= now + DAY).map((p) => p.url)
  stats.changed = changed.length
  if (changed.length > ceiling) return { ...stats, urls: [], refuse: `${changed.length} changed pages is over the ${ceiling} ceiling` }
  if (own.length >= MIN_PAGES_FOR_BUILD_TIME_CHECK && changed.length >= own.length * 0.9) {
    return { ...stats, urls: [], refuse: `${changed.length} of ${own.length} pages changed; lastmod looks like the build time` }
  }
  if (sentThisWeek + changed.length > weeklyCeiling) {
    return { ...stats, urls: [], refuse: `${sentThisWeek} sent this week plus ${changed.length} is over the ${weeklyCeiling} weekly ceiling` }
  }
  return { ...stats, urls: changed }
}

const attrs = (t) => Object.fromEntries([...t.matchAll(/([a-z-]+)\s*=\s*["']([^"']*)["']/gi)].map((m) => [m[1].toLowerCase(), m[2]]))
const noSlash = (u) => u.replace(/\/+$/, "")
// "none" only as a whole directive: max-image-preview:none is not a noindex.
const isNoindex = (v) => /(^|[\s,])(noindex|none)\s*(,|$)/i.test(v ?? "")

/** Why a fetched page must not be announced, or null if it's fine. */
export function pageProblem({ url, status, xRobots, html }) {
  if (status !== 200) return `status-${status}`
  if (isNoindex(xRobots)) return "noindex"
  const head = html.split(/<\/head>/i)[0]
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0])
    if (/^(robots|bingbot)$/i.test(a.name ?? "") && isNoindex(a.content)) return "noindex"
  }
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(m[0])
    if (/^canonical$/i.test(a.rel ?? "") && a.href && noSlash(new URL(a.href, url).href) !== noSlash(url)) return "canonical-elsewhere"
  }
  return null
}

const get = (url, redirect = "follow") =>
  fetch(url, { headers: { "user-agent": UA }, redirect, signal: AbortSignal.timeout(30_000) })

async function sitemapUrls(host, explicit) {
  const queue = [`https://${host}/sitemap.xml`]
  if (explicit) queue[0] = explicit
  else {
    const robots = await get(`https://${host}/robots.txt`).catch(() => null)
    if (robots?.ok) {
      for (const m of (await robots.text()).matchAll(/^\s*sitemap:\s*(\S+)/gim)) queue.push(m[1])
    }
  }
  const done = new Set()
  const pages = []
  let found = false
  while (queue.length) {
    const url = queue.shift()
    if (done.has(url)) continue
    if (done.size >= MAX_SITEMAPS) throw new Error(`over ${MAX_SITEMAPS} sitemap files`)
    done.add(url)
    const res = await get(url)
    // /sitemap.xml is only a guess when robots.txt names others, so its 404 isn't an error.
    if (res.status === 404 && url.endsWith("/sitemap.xml") && !explicit) continue
    if (!res.ok) throw new Error(`${url} answered ${res.status}`)
    if (url.endsWith(".gz")) throw new Error(`${url} is gzipped; not supported`)
    const parsed = parseSitemap(await res.text())
    found = true
    pages.push(...parsed.urls)
    queue.push(...parsed.children)
  }
  if (!found) throw new Error(`no sitemap found on ${host}`)
  return pages
}

async function keepIndexable(urls) {
  const kept = []
  const skipped = {}
  const held = []
  for (const url of urls) {
    let problem
    try {
      const res = await get(url, "manual")
      const html = res.status === 200 ? await res.text() : ""
      problem = pageProblem({ url, status: res.status, xRobots: res.headers.get("x-robots-tag"), html })
    } catch {
      problem = "unreachable"
    }
    if (problem === "unreachable" || /^status-(429|5\d\d)$/.test(problem ?? "")) held.push(url)
    else if (problem) skipped[problem] = (skipped[problem] ?? 0) + 1
    else kept.push(url)
  }
  return { kept, skipped, held }
}

async function submit(host, key, urls) {
  const body = JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls })
  return Promise.all(
    ENDPOINTS.map(async (endpoint) => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8", "user-agent": UA },
          body,
          signal: AbortSignal.timeout(60_000),
        })
        // 200 = accepted, 202 = accepted while the key is being checked.
        return { endpoint, status: res.status, ok: res.status === 200 || res.status === 202 }
      } catch (e) {
        return { endpoint, status: 0, ok: false, detail: e.name }
      }
    }),
  )
}

export async function run({ host, key, dryRun, sitemap, ceiling, weeklyCeiling, statePath, now = Date.now() }) {
  const out = { host, status: "ok", sent: 0 }
  const finish = (status, extra) => ({ ...out, ...extra, status })
  if (!host) return finish("failed", { reason: "--host is required" })
  if (key && !/^[a-zA-Z0-9-]{8,128}$/.test(key)) return finish("failed", { reason: "key must be 8-128 letters, digits or dashes" })
  if (!key && !dryRun) return finish("failed", { reason: "--key is required unless --dry-run" })

  // Unreadable state fails the run: a wrong "since" could resend or skip pages.
  let state = {}
  try {
    if (existsSync(statePath) && !dryRun) state = JSON.parse(readFileSync(statePath, "utf8"))
  } catch {
    return finish("failed", { reason: `state file ${statePath} is unreadable` })
  }
  const mine = state[host] ?? { last: 0, sends: [] }
  const retry = (mine.retry ?? []).filter((r) => r.first > now - MAX_LOOKBACK_MS)
  const sends = mine.sends.filter((s) => s.at > now - 7 * DAY)
  const sentThisWeek = sends.reduce((n, s) => n + s.n, 0)
  const since = mine.last ? Math.max(mine.last, now - MAX_LOOKBACK_MS) : now - FIRST_RUN_MS
  const save = (sent, held) => {
    if (dryRun) return
    const firstHeld = (url) => retry.find((r) => r.url === url)?.first ?? now
    state[host] = {
      last: now,
      sends: sent ? [...sends, { at: now, n: sent }] : sends,
      retry: held.map((url) => ({ url, first: firstHeld(url) })),
    }
    writeFileSync(statePath, JSON.stringify(state))
  }

  try {
    if (key) {
      const res = await get(`https://${host}/${key}.txt`)
      const live = res.ok ? (await res.text()).trim() : null
      if (live !== key) return finish("refused", { reason: `key file answered ${res.status} and does not match` })
    }
    const chosen = selectChanged(await sitemapUrls(host, sitemap), {
      host,
      since,
      now,
      ceiling,
      weeklyCeiling,
      sentThisWeek: sentThisWeek + retry.length,
    })
    const { urls, refuse, ...stats } = chosen
    Object.assign(out, stats)
    if (refuse) return finish("refused", { reason: refuse })

    const { kept, skipped, held } = await keepIndexable([...new Set([...urls, ...retry.map((r) => r.url)])])
    if (Object.keys(skipped).length) out.skipped = skipped
    if (held.length) out.held = held.length
    if (dryRun) return finish("dry-run", { would_send: kept.length, sample: kept.slice(0, 5) })
    if (!kept.length) {
      save(0, held)
      return finish(held.length ? "failed" : "nothing", held.length ? { reason: "every changed page was unreachable; will retry" } : {})
    }
    const results = await submit(host, key, kept)
    // One acceptance is delivery: api.indexnow.org shares with the other engines, including Bing.
    // Retrying a batch one endpoint took would resend it without counting it against the ceilings.
    if (!results.some((r) => r.ok)) {
      return finish("failed", { results })
    }
    save(kept.length, held)
    return finish("ok", { sent: kept.length, results })
  } catch (e) {
    return finish("failed", { reason: String(e.message ?? e).slice(0, 200) })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const opt = (name, dflt) => {
    const i = args.indexOf(`--${name}`)
    return i === -1 ? dflt : args[i + 1]
  }
  const result = await run({
    host: opt("host"),
    key: opt("key"),
    dryRun: args.includes("--dry-run"),
    sitemap: opt("sitemap"),
    ceiling: Number(opt("ceiling", 500)),
    weeklyCeiling: Number(opt("weekly-ceiling", 1000)),
    statePath: opt("state", join(homedir(), ".indexnow-state.json")),
  })
  console.log(JSON.stringify(result))
  process.exit(["ok", "nothing", "dry-run"].includes(result.status) ? 0 : 1)
}
