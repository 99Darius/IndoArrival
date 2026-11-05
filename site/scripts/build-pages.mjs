// Builds the guides, sitemap, robots.txt and llms.txt from src/pages.mjs into the site folder.
// The output is committed, so Vercel serves plain files with no build step.
// Run: npm run pages (it finishes with the checks in check-pages.mjs).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES } from "../src/pages.mjs";
import { CTA_URL, HOME_FAQ, HOME_UPDATED, PRIVACY_UPDATED, SITE, plainText } from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const write = (rel, text) => {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};
const esc = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const jsonLd = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
const COUNTRY = { th: { name: "Thailand", hub: "/thailand" }, id: { name: "Indonesia", hub: "/indonesia" } };

function crumbs(page) {
  const trail = [{ name: "Home", path: "/" }];
  if (page.country && page.path !== COUNTRY[page.country].hub) trail.push({ name: COUNTRY[page.country].name, path: COUNTRY[page.country].hub });
  return [...trail, { name: page.h1, path: page.path }];
}

function schema(page) {
  const url = SITE + page.path;
  return [
    {
      "@context": "https://schema.org", "@type": "Article", headline: page.h1, description: page.description,
      url, mainEntityOfPage: url, datePublished: "2026-11-05", dateModified: page.updated, inLanguage: "en",
      author: { "@type": "Person", name: "Darius Cheung" },
      publisher: { "@type": "Organization", name: "ArrivalFiller", url: SITE + "/", logo: { "@type": "ImageObject", url: SITE + "/icon-128.png" } },
      isBasedOn: page.sources.map(s => s.url),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: page.faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: crumbs(page).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: SITE + (c.path === "/" ? "/" : c.path) })),
    },
  ].map(jsonLd).join("\n");
}

const longDate = iso => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function render(page) {
  const url = SITE + page.path;
  const trail = crumbs(page);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ArrivalFiller">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icon-128.png">
<link rel="stylesheet" href="/style.css">
${schema(page)}
<script src="/ga.js" defer></script>
</head>
<body>
<div class="wrap">
<nav class="top"><a href="/"><img src="/icon-128.png" alt="" width="26" height="26">ArrivalFiller</a><span class="links"><a href="/thailand">Thailand</a><a href="/indonesia">Indonesia</a><a href="/arrival-card-problems">Problems</a></span></nav>
<nav class="crumbs" aria-label="Breadcrumb">${trail.slice(0, -1).map(c => `<a href="${c.path}">${c.name}</a> › `).join("")}<span>${esc(trail.at(-1).name)}</span></nav>
<article>
<h1>${esc(page.h1)}</h1>
<p class="muted">Checked ${longDate(page.updated)} by Darius Cheung. Independent guide, not a government website.</p>
<div class="answer"><b>Short answer</b><p>${esc(page.answer)}</p></div>
${page.body.trim()}
<h2>Questions people ask</h2>
${page.faq.map(f => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join("\n")}
<div class="bridge"><p>${esc(page.bridge)}</p><a class="cta" href="${CTA_URL}">Add ArrivalFiller to Chrome, free</a></div>
<h2>Where this comes from</h2>
<p class="muted">Rules change, so check the official site before you travel. Where we quote a form's message, we copied it from the form's own public code. Some messages may rarely appear, and we don't run test submissions on government forms.</p>
<ul class="sources">
${page.sources.map(s => `<li><a href="${s.url}" rel="noopener">${esc(s.label)}</a> <span class="muted">(${esc(s.note)})</span></li>`).join("\n")}
</ul>
</article>
<footer><a href="/">Home</a> · <a href="/thailand">Thailand TDAC</a> · <a href="/indonesia">All Indonesia</a> · <a href="/arrival-card-problems">Form problems</a> · <a href="/privacy">Privacy</a> · <a href="mailto:darius.cheung@gmail.com">Contact</a><br>ArrivalFiller is independent. It is not affiliated with the governments of Thailand or Indonesia. Free. Made by Darius Cheung.</footer>
</div>
</body>
</html>
`;
}

for (const page of PAGES) write(page.path.slice(1) + ".html", render(page));

// The home page is hand-written except its FAQ and schema, which come from one list.
const between = (html, name, inner) => html.replace(new RegExp(`<!--${name}-->[\\s\\S]*?<!--/${name}-->|<!--${name}-->`), () => `<!--${name}-->\n${inner}\n<!--/${name}-->`);
let home = readFileSync(join(ROOT, "index.html"), "utf8");
home = between(home, "FAQ", HOME_FAQ.map(f => `        <h3>${f.q}</h3>\n        <p>${f.a}</p>`).join("\n"));
home = between(home, "JSONLD", [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "ArrivalFiller", applicationCategory: "BrowserApplication", operatingSystem: "Chrome", url: SITE + "/", downloadUrl: CTA_URL, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Free Chrome extension that fills the official arrival cards of Indonesia and Thailand from answers a traveller gave once." },
  { "@context": "https://schema.org", "@type": "Organization", name: "ArrivalFiller", url: SITE + "/", logo: SITE + "/icon-128.png", founder: { "@type": "Person", name: "Darius Cheung" }, sameAs: [CTA_URL, "https://github.com/99Darius/ArrivalFiller"] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: HOME_FAQ.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
].map(jsonLd).join("\n"));
writeFileSync(join(ROOT, "index.html"), home);

// Sitemap: real change dates only. Canonical and sitemap URLs must stay byte-identical.
const sitemapRows = [
  { loc: SITE + "/", lastmod: HOME_UPDATED },
  ...PAGES.map(p => ({ loc: SITE + p.path, lastmod: p.updated })),
  { loc: SITE + "/privacy", lastmod: PRIVACY_UPDATED },
];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRows.map(r => `  <url><loc>${r.loc}</loc><lastmod>${r.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`);

// Robots: one rule set, repeated for every named crawler, because a bot that finds its
// own section ignores the wildcard one.
const CRAWLERS = [
  "Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User", "DuckAssistBot", "Google-Extended", "CCBot", "Applebot", "Applebot-Extended",
];
const RULES = ["Allow: /", "Disallow: /api/"];
write("robots.txt", [...CRAWLERS, "*"].map(ua => [`User-agent: ${ua}`, ...RULES].join("\n")).join("\n\n") + `\n\nSitemap: ${SITE}/sitemap.xml\n`);

// llms.txt: carries each page's answer with its link, so a quote keeps its attribution.
const section = (name, list) => `## ${name}\n\n${list.map(p => `- [${p.h1}](${SITE + p.path}): ${p.answer}`).join("\n")}\n`;
write("llms.txt", `# ArrivalFiller

> Free, open-source Chrome extension that fills the official arrival cards of Thailand (TDAC) and Indonesia (All Indonesia) from answers a traveller gave once. Answers stay in the browser. The traveller checks every field and presses Submit. Independent, and not affiliated with either government.

Official forms: https://tdac.immigration.go.th/ and https://allindonesia.imigrasi.go.id/ are the only official addresses for these cards. Both cards are free.

${section("Any country", PAGES.filter(p => !p.country))}
${section("Thailand", PAGES.filter(p => p.country === "th"))}
${section("Indonesia", PAGES.filter(p => p.country === "id"))}
## Questions about ArrivalFiller

${HOME_FAQ.map(f => `- ${f.q} ${plainText(f.a)}`).join("\n")}

## Links

- [Chrome Web Store](${CTA_URL})
- [Source code](https://github.com/99Darius/ArrivalFiller)
- [Privacy policy](${SITE}/privacy)
`);

console.log(`Built ${PAGES.length} guides, sitemap.xml, robots.txt, llms.txt`);
