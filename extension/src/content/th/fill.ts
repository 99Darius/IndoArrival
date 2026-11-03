/**
 * Fill engine for the TDAC form.
 *
 * Hard invariants:
 *   - NEVER submits. It clicks only three kinds of element, all located inside a
 *     known field's wrapper or that field's popup: a mat-select trigger, a
 *     mat-option row, and a radio or checkbox input. It never touches a button,
 *     so it can't press Continue, Add, Preview or Submit.
 *   - Fills only the step on screen, and never runs off the new-card form.
 *   - Agreeing stays human: ticking the agreement only opens the site's window, whose
 *     Agree button is a button like any other, so it's reported as left to the traveller.
 *   - Never touches the Cloudflare check on the site's home page.
 *   - Angular reads typed values from DOM input events, so values are set with
 *     the native setter and then announced with input/change/blur.
 */
import { emit, REPLAY_END, REPLAY_START } from "../bus";
import { applyDateRules, parseDate, typedDate } from "./dates";
import { boxesIn, CHECKED, chipsIn, clean, currentStep, inputIn, isFormPage, kindOf, radioLabel, radiosIn, splitList, wrapper, type Answer } from "./fields";

export interface FillResult {
  filled: string[];
  /** Couldn't be matched: the human picks the option. */
  opened: string[];
  missing: string[];
}

const sleep = (ms: number) => new Promise(r => window.setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, ms: number): Promise<T | null> {
  for (let t = 0; t <= ms; t += 100) {
    const v = fn();
    if (v) return v;
    await sleep(100);
  }
  return null;
}

const setters = new Map<object, ((v: string) => void) | undefined>([
  [HTMLInputElement, Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set],
  [HTMLTextAreaElement, Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set],
]);

function typeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const setter = setters.get(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement);
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function commit(el: HTMLElement): void {
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new FocusEvent("blur"));
  el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

function highlight(el: Element | null): void {
  if (!(el instanceof HTMLElement)) return;
  el.style.outline = "2px solid #16a34a";
  el.style.outlineOffset = "1px";
  window.setTimeout(() => { el.style.outline = ""; el.style.outlineOffset = ""; }, 1500);
}

const options = () => [...document.querySelectorAll<HTMLElement>(".cdk-overlay-container mat-option")];
const norm = (s: string) => clean(s).toLowerCase();
const findOption = (value: string) => options().find(o => norm(o.textContent ?? "") === norm(value));

async function fillSelect(wrap: HTMLElement, value: string): Promise<boolean> {
  const select = wrap.querySelector<HTMLElement>("mat-select")!;
  if (norm(wrap.querySelector(".mat-mdc-select-value-text")?.textContent ?? "") === norm(value)) return true;
  // A dependent list (transport type) may still be loading: its select stays disabled until then.
  const ready = await waitFor(() => select.getAttribute("aria-disabled") !== "true", 2000);
  if (!ready) return false;
  wrap.querySelector<HTMLElement>(".mat-mdc-select-trigger")?.click();
  const row = await waitFor(() => findOption(value), 2000);
  if (row) { row.click(); await sleep(150); return true; }
  // Close the list again and leave this one for the human.
  select.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true }));
  return false;
}

/** Autocomplete rows come from the server (500 ms debounce, 3 characters minimum). */
async function fillAuto(wrap: HTMLElement, value: string, freeText: boolean): Promise<boolean> {
  const input = await waitFor(() => { const i = inputIn(wrap); return i && !i.disabled && i; }, 2000);
  if (!input) return false;
  if (norm(input.value) === norm(value)) return true;
  input.focus();
  // Birth-date boxes pick by themselves once one row matches, and clear on blur if none did.
  if (wrap.querySelector("sit-bd-autocomplete")) {
    typeValue(input, value);
    await sleep(250);
    commit(input);
    await sleep(100);
    return norm(input.value) === norm(value);
  }
  const part = value.split(":").pop()!.trim();
  for (const query of new Set([value, part, part.split(/\s+/)[0]])) {
    if (query.length < 1) continue;
    typeValue(input, query);
    const row = await waitFor(() => findOption(value), freeText ? 1500 : 4000);
    if (row) { row.click(); await sleep(150); return true; }
  }
  if (freeText) { typeValue(input, value); commit(input); return true; }
  // Leaving a value that was never picked makes the site clear it; do that now.
  typeValue(input, "");
  commit(input);
  return false;
}

/** Adds what's missing and removes nothing: choices already on the form stay for the traveller to judge. */
async function fillChips(wrap: HTMLElement, value: string): Promise<boolean> {
  const input = await waitFor(() => { const i = inputIn(wrap); return i && !i.disabled && i; }, 2000);
  if (!input) return false;
  let ok = true;
  for (const choice of splitList(value)) {
    if (chipsIn(wrap).some(c => norm(c) === norm(choice))) continue;
    input.focus();
    let row: HTMLElement | null = null;
    for (const query of new Set([choice, choice.split(/\s+/)[0]])) {
      typeValue(input, query);
      row = await waitFor(() => findOption(choice), 4000);
      if (row) break;
    }
    if (row) { row.click(); await sleep(250); }
    else { typeValue(input, ""); ok = false; }
  }
  commit(input);
  return ok;
}

/** Unticks first: ticking "no symptoms" locks the others, and the site unticks them itself. */
async function fillChecks(wrap: HTMLElement, value: string): Promise<boolean> {
  const wanted = new Set(splitList(value).map(norm));
  const known = boxesIn(wrap);
  for (const on of [false, true]) {
    for (const box of known) {
      if (wanted.has(norm(box.label)) !== on || box.input.checked === on || box.input.disabled) continue;
      box.input.click();
      await sleep(100);
    }
  }
  const allThere = [...wanted].every(w => known.some(box => norm(box.label) === w));
  return allThere && known.every(box => wanted.has(norm(box.label)) === box.input.checked);
}

async function fillOne(a: Answer, result: FillResult): Promise<void> {
  const label = a.label || a.key;
  // Conditional fields (Other..., district after province) appear after an earlier answer.
  const wrap = await waitFor(() => wrapper(a.key), 1200);
  const kind = wrap && kindOf(wrap, a.key);
  if (!wrap || !kind) { result.missing.push(label); return; }
  let ok = true;
  if (kind === "select") ok = await fillSelect(wrap, a.value);
  else if (kind === "auto" || kind === "suggest") ok = await fillAuto(wrap, a.value, kind === "suggest");
  else if (kind === "chips") ok = await fillChips(wrap, a.value);
  else if (kind === "checks") ok = await fillChecks(wrap, a.value);
  else if (kind === "radio") {
    const radios = radiosIn(wrap);
    const radio = radios.find(r => norm(radioLabel(r)) === norm(a.value)) ?? (a.index != null ? radios[a.index] : undefined);
    // The health step's radios are switched on once the site has checked the countries.
    if (radio) await waitFor(() => !radio.disabled, 1500);
    if (!radio || radio.disabled) ok = false;
    else if (!radio.checked) { radio.click(); await sleep(100); }
  } else if (kind === "check") {
    const box = wrap.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!box || box.disabled) ok = false;
    else {
      // A second press of Fill mustn't stack another agreement window on the first.
      const windowOpen = a.key === "agreedTerms" && !!document.querySelector("mat-dialog-container");
      if ((a.value === CHECKED) !== box.checked && !windowOpen) box.click();
      if (a.key === "agreedTerms" && a.value === CHECKED && !box.checked) { result.opened.push(label); return; }
    }
  } else {
    const input = await waitFor(() => { const i = inputIn(wrap); return i && !i.disabled && i; }, 1500);
    if (!input) ok = false;
    else {
      const date = kind === "date" ? parseDate(a.value) : null;
      typeValue(input, date ? typedDate(date) : a.value);
      commit(input);
    }
  }
  if (ok) { highlight(wrap); result.filled.push(label); }
  else result.opened.push(label);
  await sleep(50); // allow dependent fields to mount and begin loading
}

/** The answers Fill would use on the step on screen, in form order. */
export function planForStep(answers: Answer[], now = new Date()): Answer[] {
  const step = currentStep();
  const wanted = answers.filter(a => step.includes(a.key) && a.value);
  return applyDateRules(wanted, now).sort((a, b) => step.indexOf(a.key) - step.indexOf(b.key));
}

let running: { what: string; done: Promise<FillResult> } | null = null;

/**
 * One fill at a time per tab. A second press for the same answers (popup + panel,
 * double-click) waits for the first. Different answers (another traveller) are
 * refused: reporting the first fill as theirs would misfile later corrections.
 */
export function fillStep(answers: Answer[]): Promise<FillResult> {
  if (!isFormPage()) return Promise.reject(new Error("not on the arrival card form"));
  const what = JSON.stringify(answers);
  if (running && running.what !== what) return Promise.reject(new Error("Still filling. Wait for it to finish, then press Fill again."));
  running ??= { what, done: replay(answers).finally(() => { running = null; }) };
  return running.done;
}

async function replay(answers: Answer[]): Promise<FillResult> {
  const result: FillResult = { filled: [], opened: [], missing: [] };
  emit(REPLAY_START);
  try {
    for (const a of planForStep(answers)) await fillOne(a, result);
    return result;
  } finally {
    emit(REPLAY_END);
  }
}

