/**
 * Autofill engine for the government arrival-card form.
 *
 * Hard invariants (see README):
 *   - NEVER auto-submit. Replay clicks only three kinds of element: a dropdown
 *     trigger located by field selector, an option row inside that dropdown's
 *     popup list, and a readonly choice-option input. As defense-in-depth it
 *     refuses to touch any submit/next-like control. It never advances steps;
 *     the human clicks Next and Submit.
 *   - Match fields by PREFIX selector only — gov form ids carry a regenerated
 *     timestamp suffix (e.g. spi_full_name_1782107186388).
 *   - The form is React-controlled, so setting .value directly is ignored. We use
 *     the native value setter + dispatch input/change events so React's state
 *     updates.
 */
import { emit, REPLAY_END, REPLAY_START } from "./bus";
import { sameChoice } from "../lib/choice";
import { findField, queryField, selectedPicks, tickOn } from "./formFields";
import { parseDate, planForPage } from "./tripDefaults";

/** Step-1 field locations from the field map (used to migrate old profiles). */
export interface FieldSpec {
  key: string;
  selector: string;
  control: string;
}

export interface StepSpec {
  step: number;
  path: string;
  title: string;
  fields?: FieldSpec[];
}

export interface FieldMap {
  neverAutoSubmit: boolean;
  submitButtonText: string[];
  nextButtonText: string[];
  steps: StepSpec[];
}

export interface FillResult {
  filled: string[];
  /** dropdowns that couldn't be matched; the human picks the option. */
  opened: string[];
  missing: string[];
  skipped: string[];
}

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value",
)?.set;

const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype,
  "value",
)?.set;

/** Set a value the way React notices (native setter + input/change events). */
function reactSetValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const setter =
    el instanceof HTMLTextAreaElement ? nativeTextareaValueSetter : nativeInputValueSetter;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function highlight(el: HTMLElement): void {
  el.style.outline = "2px solid #16a34a";
  el.style.outlineOffset = "1px";
  el.style.transition = "outline-color 1.2s ease";
  window.setTimeout(() => {
    el.style.outlineColor = "rgba(22,163,74,0.25)";
  }, 1200);
}

/**
 * Guard: returns true if an element looks like a submit/next control. Checks
 * type=submit, role=button/button tag, and matches label text / aria-label /
 * value against the configured Next/Submit words using WORD-BOUNDARY matching
 * (so a field whose neighbouring text merely contains "next" is not over-skipped,
 * and an icon-only button with an aria-label is still caught).
 */
export function isSubmitControl(el: Element, map: FieldMap): boolean {
  if (el instanceof HTMLInputElement && el.type === "submit") return true;
  if (el instanceof HTMLButtonElement && el.type === "submit") return true;

  const isButtonish =
    el.tagName === "BUTTON" ||
    el.getAttribute("role") === "button" ||
    (el instanceof HTMLInputElement && (el.type === "button" || el.type === "submit"));
  if (!isButtonish) return false;

  const haystacks = [
    el.textContent ?? "",
    el.getAttribute("aria-label") ?? "",
    el instanceof HTMLInputElement ? el.value : "",
  ]
    .join(" ")
    .toLowerCase();

  const labels = [...map.submitButtonText, ...map.nextButtonText]
    .map((s) => s.toLowerCase())
    .filter(Boolean);
  return labels.some((l) => new RegExp(`\\b${l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystacks));
}

/** A field the user taught us by demonstration (recorded), with its prior value. */
export interface LearnedField {
  selector: string | null;
  control: string; // text | textarea | dropdown | choice | radio | checkbox | select
  value: string;
  step: string; // location.pathname it was recorded on
  label?: string;
  placeholder?: string;
  /** For a choice group: which option (0-based) — survives the site switching language. */
  index?: number;
  /** Trip dates are saved as rules: arrival = fill date + offset days, departure = arrival + offset days. */
  offset?: number;
  /** Transient, choice corrections only: every option text in the group. Not stored. */
  options?: string[];
}

/** A dropdown trigger still showing its prompt ("Select …" / "Pilih …"), i.e. nothing chosen. */
export function isPromptValue(v: string | undefined): boolean {
  return !v || /^(select|pilih)\b/i.test(v.trim());
}

const SEARCH_PLACEHOLDER = /^(search|cari)$/i;

/**
 * Recordings can contain things that aren't answers: the dropdown popup's own
 * search box, the captcha, and dropdowns captured before a choice was made.
 */
export function isReplayable(f: LearnedField): boolean {
  const hay = `${f.selector ?? ""} ${f.placeholder ?? ""} ${f.label ?? ""}`;
  if (SEARCH_PLACEHOLDER.test((f.placeholder ?? f.label ?? "").trim())) return false;
  if (/placeholder="(search|cari)"/i.test(f.selector ?? "")) return false;
  if (/captcha/i.test(hay)) return false;
  if ((f.control === "dropdown" || f.control === "select") && isPromptValue(f.value)) return false;
  return !!f.value;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined, ms: number): Promise<T | null> {
  for (let t = 0; t <= ms; t += 100) {
    const v = fn();
    if (v) return v;
    await sleep(100);
  }
  return null;
}

/** The custom "radio": a group of readonly inputs whose value is the option text. */
function findChoice(f: LearnedField): HTMLInputElement | null {
  if (f.selector) {
    const group = queryField(f.selector);
    const opts = group ? [...group.querySelectorAll<HTMLInputElement>("input[readonly]")] : [];
    return opts.find((o) => sameChoice(o.value, f.value)) ?? (f.index != null ? opts[f.index] : undefined) ?? null;
  }
  // Older recordings kept only the option text.
  const all = [...document.querySelectorAll<HTMLInputElement>("input[readonly]:not([id])")];
  const hits = all.filter((o) => sameChoice(o.value, f.value));
  if (hits.length === 1) return hits[0];
  if (f.label) return hits.find((o) => o.closest("[id]")?.parentElement?.textContent?.includes(f.label!)) ?? null;
  return null;
}

const optionRows = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(
  '[data-testid="virtuoso-item-list"] > div, [role="listbox"] [role="option"]',
)];

function popupFor(trigger: HTMLElement): Element | null {
  for (let a = trigger.parentElement, i = 0; a && a !== document.body && i < 6; a = a.parentElement, i++) {
    if (a.querySelector('[data-testid="virtuoso-item-list"], [role="listbox"]')) return a;
  }
  // Mobile dropdowns are portalled to the document body.
  return optionRows(document).length ? document.body : null;
}

function sameOption(a: string, b: string): boolean {
  const clean = (v: string) => norm(v).replace(/[.,()–—-]/g, " ").replace(/\s+/g, " ").trim();
  const x = clean(a), y = clean(b);
  if (x === y || sameChoice(x, y)) return true;
  if (/^\+\d+$/.test(b.trim()) && norm(a).startsWith(`${norm(b)} - `)) return true;
  const date = (v: string) => parseDate(v.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/)?.[0] ?? v);
  const da = date(a), db = date(b);
  if (da && db) return da.toDateString() === db.toDateString();
  if (db && ["en-GB", "id-ID", "zh-CN", "ja-JP", "ko-KR", "ru-RU", "ar-SA"].some(locale =>
    clean(new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(db)) === x)) return true;
  return false;
}

/** A multi-pick dropdown (countries visited) lists its picks as chips, not in the box. */
const picked = (trigger: HTMLInputElement, value: string, multi: boolean) =>
  multi ? (selectedPicks(trigger) ?? []).some(v => sameOption(v, value)) : sameOption(trigger.value, value);

/** Searchable and non-searchable dropdowns share the same virtualised list. */
async function pickDropdown(trigger: HTMLInputElement, value: string, multi = false): Promise<boolean> {
  if (picked(trigger, value, multi)) return true;
  await waitFor(() => optionRows(document).length === 0, 700);
  let popup: Element | null = null;
  // A previous selection can still be loading this dependent dropdown. Its
  // trigger ignores clicks while loading, so retry once it can actually open.
  for (let attempt = 0; attempt < 4 && !popup; attempt++) {
    trigger.click();
    popup = await waitFor(() => popupFor(trigger), 700);
  }
  if (!popup) return false;
  const search = [...popup.querySelectorAll<HTMLInputElement>("input")].find(i => SEARCH_PLACEHOLDER.test(i.placeholder));
  const queries = search ? [...new Set([value, value.split(/[\s(,]/)[0], value.slice(0, 5)])] : [value];
  for (const query of queries) {
    if (search) { search.focus(); reactSetValue(search, query); await sleep(150); }
    const row = await waitFor(() => optionRows(popup!).find(r => sameOption(r.textContent ?? "", value)), search ? 2500 : 800);
    if (row) {
      ((row.firstElementChild as HTMLElement | null) ?? row).click();
      if (await waitFor(() => picked(trigger, value, multi), 1200)) {
        if (multi && optionRows(popup).length) trigger.click(); // multi-pick lists stay open
        return true;
      }
    }
  }
  // Do not treat an unrelated single search result as the saved port/flight.
  if (optionRows(popup).length) trigger.click();
  return false;
}

/**
 * Replay learned fields for the CURRENT page: fill back the answers the user
 * gave when they taught the form — text, dropdown options and choices. Runs
 * sequentially because each dropdown opens a popup. Never advances or submits.
 */
let running: Promise<FillResult> | null = null;

/** One fill at a time per tab: a second press (popup + panel, double-click) waits for the first. */
export function replayLearned(fields: LearnedField[], map: FieldMap): Promise<FillResult> {
  if (map.neverAutoSubmit !== true) return Promise.reject(new Error("refusing to run: field map does not assert neverAutoSubmit"));
  running ??= replay(fields, map).finally(() => { running = null; });
  return running;
}

async function replay(fields: LearnedField[], map: FieldMap): Promise<FillResult> {
  const result: FillResult = { filled: [], opened: [], missing: [], skipped: [] };
  emit(REPLAY_START);
  try {
    for (const f of planForPage(fields).filter(isReplayable)) {
      const label = f.label || f.selector || "Field";
      const isChoice = f.control === "choice" || ((f.control === "dropdown" || f.control === "radio") && !f.selector);
      if (isChoice) {
        const opt = await waitFor(() => findChoice(f), 1200);
        if (!opt) { result.missing.push(label); continue; }
        if (isSubmitControl(opt, map)) { result.skipped.push(label); continue; }
        opt.click();
        highlight(opt.parentElement ?? opt);
        await sleep(100); // conditional KITAS/KITAP number field mounts after Yes
        result.filled.push(label);
        continue;
      }
      const el = await waitFor(() => findField(f), 1200);
      if (!el) { result.missing.push(label); continue; }
      if (isSubmitControl(el, map) || (el as HTMLInputElement).disabled) { result.skipped.push(label); continue; }
      if ((f.control === "text" || f.control === "textarea") && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
        let value = f.value;
        if (el instanceof HTMLInputElement && el.type === "date") {
          const date = parseDate(value);
          if (date) value = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
        }
        reactSetValue(el, value);
        el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        highlight(el);
        result.filled.push(label);
      } else if (el instanceof HTMLSelectElement) {
        const option = [...el.options].find(o => sameOption(o.text, f.value) || o.value === f.value);
        if (!option) { result.opened.push(label); continue; }
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(el, option.value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        highlight(el);
        result.filled.push(label);
      } else if ((f.control === "dropdown" || f.control === "select") && el instanceof HTMLInputElement) {
        highlight(el);
        const parts = f.value.split(/,\s*/);
        const multi = parts.length > 1 && (/more than one|lebih dari satu/i.test(f.label ?? "") || !!selectedPicks(el));
        let ok = true;
        for (const part of multi ? parts : [f.value]) ok = (await pickDropdown(el, part, multi)) && ok;
        if (ok) result.filled.push(label);
        else result.opened.push(label);
      } else if (f.control === "tick") {
        if (f.value && !tickOn(el)) el.firstElementChild instanceof HTMLElement && el.firstElementChild.click();
        highlight(el);
        result.filled.push(label);
      } else if (f.control === "radio" && el instanceof HTMLInputElement && el.type === "radio") {
        if (!el.checked) el.click();
        result.filled.push(label);
      } else {
        result.skipped.push(label);
      }
      await sleep(50); // allow dependent dropdowns to mount and begin loading
    }
    return result;
  } finally {
    emit(REPLAY_END);
  }
}
