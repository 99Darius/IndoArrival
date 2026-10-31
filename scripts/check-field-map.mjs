#!/usr/bin/env node
/**
 * Field-map regression canary (design §8).
 *
 * Loads the live All Indonesia foreign-visitor personal-info step and asserts
 * every captured step-1 prefix selector still resolves. If the government form
 * changes its field ids, this fails loudly so the field map can be patched before
 * users hit a silent autofill miss.
 *
 * Usage:  node scripts/check-field-map.mjs
 * Needs:  npx playwright install chromium   (one-time)
 * Exit:   0 = all mapped step-1 selectors present; 1 = drift detected.
 *
 * Note: only step 1 is checked. Steps 2-4 are state-gated behind a server-filtered
 * dropdown that can't be driven headlessly, so their selectors are captured at
 * runtime, not here.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const mapPath = fileURLToPath(new URL("../config/field-maps/allindonesia.v1.json", import.meta.url));
const STEP1_URL = "https://allindonesia.imigrasi.go.id/arrival-card-submission/personal-information";

const map = JSON.parse(await readFile(mapPath, "utf8"));
const step1 = map.steps.find((s) => s.step === 1);
if (!step1) {
  console.error("no step 1 in field map — was it restructured?");
  process.exit(1);
}
const selectors = (step1.fields ?? [])
  .filter((f) => f.captured !== false) // skip best-effort/uncaptured guesses
  .map((f) => ({ key: f.key, selector: f.selector }));

const browser = await chromium.launch();
const page = await browser.newPage();
let failed = [];
try {
  await page.goto(STEP1_URL, { waitUntil: "networkidle", timeout: 30000 });
  for (const { key, selector } of selectors) {
    const count = await page.locator(selector).count();
    const ok = count > 0;
    console.log(`${ok ? "ok  " : "MISS"}  ${key.padEnd(26)} ${selector}`);
    if (!ok) failed.push(key);
  }

  // Captcha canary: if a captcha/bot-wall appears, the whole approach is at risk.
  const html = await page.content();
  if (/recaptcha|hcaptcha|turnstile|datadome/i.test(html)) {
    console.log("WARN  a captcha/bot-wall signature appeared on the form");
    failed.push("__captcha__");
  }
} finally {
  await browser.close();
}

if (failed.length) {
  console.error(`\nDRIFT: ${failed.length} issue(s): ${failed.join(", ")}. Patch the field map.`);
  process.exit(1);
}
console.log(`\nAll ${selectors.length} mapped step-1 selectors present. No drift.`);
