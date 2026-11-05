// Guards for the public site. Exits non-zero on any failure. Run by `npm run pages`.
// Thin or duplicate pages, a sitemap that disagrees with the pages, and robots.txt blocking
// what llms.txt advertises are the failures that cost sites their search traffic.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES } from "../src/pages.mjs";
import { HOME_FAQ, SITE, plainText } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const problems = [];
const fail = (where, what) => problems.push(`${where}: ${what}`);
const words = text => text.trim().split(/\s+/).filter(Boolean).length;
const norm = s => s.replace(/\s+/g, " ").trim();
const pathToFile = p => (p === "/" ? "index.html" : p.slice(1) + ".html");

const MIN_OWN_WORDS = 450, MIN_OWN_SECTIONS = 2, MIN_FAQ = 3, MAX_TITLE = 62, MAX_DESC = 165;

const seen = { title: new Map(), description: new Map(), h1: new Map() };
const blocks = new Map();
const routes = new Set(["/", "/privacy", ...PAGES.map(p => p.path)]);

for (const page of PAGES) {
  const at = page.path;
  const own = [page.answer, page.body, page.bridge, ...page.faq.flatMap(f => [f.q, f.a])].map(plainText).join(" ");
  if (words(own) < MIN_OWN_WORDS) fail(at, `only ${words(own)} own words, need ${MIN_OWN_WORDS}`);
  const sections = (page.body.match(/<h2>/g) ?? []).length;
  if (sections < MIN_OWN_SECTIONS) fail(at, `only ${sections} sections of its own`);
  if (page.faq.length < MIN_FAQ) fail(at, `only ${page.faq.length} FAQs`);
  if (page.title.length > MAX_TITLE) fail(at, `title is ${page.title.length} chars`);
  if (page.description.length > MAX_DESC) fail(at, `description is ${page.description.length} chars`);
  if (words(page.answer) > 90) fail(at, `short answer is ${words(page.answer)} words`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(page.updated)) fail(at, "bad updated date");
  if (!page.sources.length) fail(at, "no sources");
  for (const s of page.sources) if (!s?.url?.startsWith("https://")) fail(at, "source without a https url");
  for (const key of ["title", "description", "h1"]) {
    if (seen[key].has(page[key])) fail(at, `same ${key} as ${seen[key].get(page[key])}`);
    seen[key].set(page[key], at);
  }
  // A block of text on two pages is a template, whatever it says.
  for (const m of [page.answer, page.bridge, ...page.body.matchAll(/<(p|li|td)>([\s\S]*?)<\/\1>/g)].map(x => (typeof x === "string" ? x : x[2]))) {
    const text = norm(plainText(m));
    if (words(text) < 8) continue;
    if (blocks.has(text) && blocks.get(text) !== at) fail(at, `shares a block with ${blocks.get(text)}: "${text.slice(0, 60)}"`);
    blocks.set(text, at);
  }

  const file = pathToFile(page.path);
  if (!existsSync(join(ROOT, file))) { fail(at, `${file} not built`); continue; }
  const html = read(file);
  if (!html.includes(`<link rel="canonical" href="${SITE}${page.path}">`)) fail(at, "canonical is wrong");
  if ((html.match(/<h1>/g) ?? []).length !== 1) fail(at, "needs exactly one h1");
  if (/noindex/i.test(html)) fail(at, "noindex on a listed page");
  if (!html.includes('src="/ga.js"')) fail(at, "analytics script missing");
  if (!html.includes("not a government website")) fail(at, "independence line missing");
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { fail(at, "JSON-LD does not parse"); }
  }
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const target = m[1];
    if (/\.(css|png)$/.test(target)) continue;
    if (!routes.has(target)) fail(at, `link to unknown page ${target}`);
  }
}

// Hand-written pages.
const home = read("index.html"), privacy = read("privacy.html");
if (!home.includes(`<link rel="canonical" href="${SITE}/">`)) fail("/", "canonical is wrong");
if (!privacy.includes(`<link rel="canonical" href="${SITE}/privacy">`)) fail("/privacy", "canonical is wrong");
for (const [at, html] of [["/", home], ["/privacy", privacy]]) if (!html.includes('src="/ga.js"')) fail(at, "analytics script missing");
for (const f of HOME_FAQ) {
  if (!home.includes(f.q)) fail("/", `FAQ missing from page: ${f.q}`);
  if (!norm(home).includes(norm(plainText(f.a)))) fail("/", `FAQ answer differs from the list: ${f.q}`);
}
for (const p of PAGES) if (!home.includes(`href="${p.path}"`)) fail("/", `does not link to ${p.path}, so it would be an orphan`);

// Sitemap, robots, llms agree with the pages.
const sitemap = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const expected = [`${SITE}/`, ...PAGES.map(p => SITE + p.path), `${SITE}/privacy`];
if (sitemap.join() !== expected.join()) fail("sitemap.xml", "does not list exactly the pages");
const robots = read("robots.txt");
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail("robots.txt", "no sitemap line");
const disallowed = [...robots.matchAll(/^Disallow: (\S+)/gm)].map(m => m[1]);
const llms = read("llms.txt");
for (const m of llms.matchAll(new RegExp(`${SITE}(/[^)\\s:]*)`, "g"))) {
  if (disallowed.some(d => m[1].startsWith(d))) fail("llms.txt", `lists ${m[1]}, which robots.txt blocks`);
}
for (const p of PAGES) if (!llms.includes(SITE + p.path)) fail("llms.txt", `missing ${p.path}`);

// The extension's privacy promise must not get mixed up with the website's analytics.
if (!/website/i.test(privacy) || !/Google Analytics/.test(privacy)) fail("/privacy", "must disclose the website's Google Analytics");
if (/Your email is the only thing we ever collect/.test(home)) fail("/", "the signup line is no longer true");

if (problems.length) {
  console.error(`${problems.length} problem(s):\n` + problems.map(p => "  " + p).join("\n"));
  process.exit(1);
}
const counts = PAGES.map(p => words([p.answer, p.body, p.bridge, ...p.faq.flatMap(f => [f.q, f.a])].map(plainText).join(" ")));
console.log(`OK: ${PAGES.length} guides, ${Math.min(...counts)} to ${Math.max(...counts)} own words each, ${counts.reduce((a, b) => a + b, 0)} in all`);
