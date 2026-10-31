/**
 * Learns answers on the arrival-card form. Two modes:
 *
 *  - Recording ("Learn X's answers"): every field the user touches is captured
 *    into the draft in storage, so it survives page loads between steps. Values
 *    already on the page that the user doesn't touch are NOT captured, so adding
 *    a second traveller on a filled page doesn't copy the first one's answers.
 *  - Corrections: after Fill has run on a page, fields the user then changes or
 *    picks by hand on that page update the traveller that was filled — and only
 *    that traveller. Filling the form by hand without pressing Fill teaches
 *    nothing.
 *
 * The content script never writes saved answers itself: it sends them to the
 * background, which files them under the traveller id they belong to. Only real
 * user events count (`isTrusted`), so the page's own scripts can't teach it.
 */
import { DRAFT_KEY, type RecordingDraft } from "../lib/keys";
import { bus, emit, REPLAY_END, REPLAY_START, REPLAYED, SAVE_RECORDING, SAVED } from "./bus";
import { isPromptValue, isReplayable, type LearnedField } from "./formFill";
import { describeField, describeTick, fieldKey, findField, queryField, tickFrom, tickOn, type FormControl } from "./formFields";
import { isFormPage, rememberable, withDateRules } from "./tripDefaults";

let recording = false;
let replayDepth = 0;
/** Traveller filled on this page by the last Fill, if any: corrections go to them. */
let filledFor: { path: string; travellerId: string } | null = null;

const captured = new Map<string, LearnedField>();
const corrections = new Map<string, LearnedField>();
/** Fields the user touched on this page, and their live elements. */
const elements = new Map<string, FormControl>();
const hasStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;
const keep = (f: LearnedField) => rememberable(f) && isReplayable(f) && !!f.selector;
const answers = () => withDateRules([...captured.values()].filter(keep));
let flushTimer: number | undefined;
let correctionTimer: number | undefined;

/**
 * Re-read touched fields. A dropdown trigger is clicked before its option is
 * picked, and React may replace the element, so read the live control again.
 */
function refresh(fields: Map<string, LearnedField>) {
  for (const [key, f] of fields) {
    if (f.step !== location.pathname || f.control === "choice") continue;
    if (f.control === "tick") {
      const box = f.selector ? queryField(f.selector) : null;
      if (box) f.value = tickOn(box) ? "checked" : "";
      continue;
    }
    let el: Element | null | undefined = elements.get(key);
    if (!el?.isConnected) el = findField(f);
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
    f.value = f.control === "dropdown" && isPromptValue(el.value) ? "" : describeField(el).value;
  }
}

function flush() {
  window.clearTimeout(flushTimer);
  flushTimer = undefined;
  if (!hasStorage || !recording) return;
  refresh(captured);
  void chrome.storage.local.get(DRAFT_KEY).then((res) => {
    const draft = res[DRAFT_KEY] as RecordingDraft<LearnedField> | undefined;
    if (!draft?.active || !recording) return;
    return chrome.storage.local.set({ [DRAFT_KEY]: { ...draft, fields: answers() } });
  }).catch(() => undefined);
}

function scheduleFlush() {
  if (flushTimer === undefined) flushTimer = window.setTimeout(flush, 250);
}

function applyDraft(draft?: RecordingDraft<LearnedField>) {
  if (!draft?.active) {
    recording = false;
    captured.clear();
    return;
  }
  if (!recording) corrections.clear();
  recording = true;
  for (const f of draft.fields ?? []) if (keep(f) && !captured.has(fieldKey(f))) captured.set(fieldKey(f), f);
}

async function sendCorrections() {
  correctionTimer = undefined;
  if (recording || replayDepth || !filledFor || filledFor.path !== location.pathname) return corrections.clear();
  refresh(corrections);
  const fields = withDateRules([...corrections.values()].filter(keep));
  corrections.clear();
  if (!fields.length) return;
  try {
    await chrome.runtime.sendMessage({ type: "LEARN_UPDATE", travellerId: filledFor.travellerId, fields });
  } catch { /* extension reloaded under this page */ }
}

function inputFor(target: Element): Element {
  if (target.matches("input,textarea,select")) return target;
  for (let a: Element | null = target, i = 0; a && i < 4; a = a.parentElement, i++) {
    const inputs = a.querySelectorAll("input[readonly]");
    if (inputs.length === 1) return inputs[0];
    if (inputs.length > 1) break;
  }
  return target;
}

// Unit tests can only dispatch synthetic events; production builds drop this.
const trusted = (e: Event) => e.isTrusted || import.meta.env.MODE === "test";

function onEvent(e: Event) {
  if (!trusted(e) || replayDepth || !isFormPage() || !(e.target instanceof Element)) return;
  if (e.target.closest("#indoarrival-panel")) return;
  const learning = recording || filledFor?.path === location.pathname;
  if (!learning) return;
  const tick = e.type === "click" ? tickFrom(e.target) : null;
  if (tick) {
    const f = describeTick(tick); // its value is read again once the click has toggled it
    if (f.selector) (recording ? captured : corrections).set(fieldKey(f), f);
  }
  const el = e.type === "click" ? inputFor(e.target) : e.target;
  if (!tick && el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    if (el instanceof HTMLInputElement && (el.type === "password" || /^(search|cari)$/i.test(el.placeholder) || /captcha/i.test(el.placeholder))) return;
    if (/one-time-code/i.test(el.autocomplete)) return;
    const f = describeField(el);
    if (!rememberable(f) || !f.selector) return;
    // Lets the background retire older selector-less copies of this choice.
    if (f.control === "choice") f.options = [...(queryField(f.selector)?.querySelectorAll<HTMLInputElement>("input[readonly]") ?? [])].map((o) => o.value);
    elements.set(fieldKey(f), el);
    (recording ? captured : corrections).set(fieldKey(f), f);
  }
  // A click on a dropdown option changes its trigger's value without input
  // events on the trigger: re-read touched fields shortly after any event.
  if (recording) scheduleFlush();
  else {
    window.clearTimeout(correctionTimer);
    correctionTimer = window.setTimeout(sendCorrections, 600);
  }
}

for (const type of ["input", "change", "click", "focusout"]) document.addEventListener(type, onEvent, true);
window.addEventListener("pagehide", flush);

bus.addEventListener(REPLAY_START, () => {
  replayDepth++;
  window.clearTimeout(correctionTimer);
  corrections.clear();
});
bus.addEventListener(REPLAY_END, () => { replayDepth = Math.max(0, replayDepth - 1); });
bus.addEventListener(REPLAYED, (e) => {
  const travellerId = (e as CustomEvent<string | undefined>).detail;
  filledFor = travellerId ? { path: location.pathname, travellerId } : null;
});
bus.addEventListener(SAVE_RECORDING, async () => {
  window.clearTimeout(flushTimer);
  refresh(captured);
  try {
    const res = await chrome.runtime.sendMessage({ type: "SAVE_LEARNED", fields: answers() });
    if (res?.ok) recording = false;
    emit(SAVED, res);
  } catch {
    emit(SAVED, null);
  }
});

if (hasStorage) {
  void chrome.storage.local.get(DRAFT_KEY).then((res) => applyDraft(res[DRAFT_KEY]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && DRAFT_KEY in changes) applyDraft(changes[DRAFT_KEY].newValue);
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // The popup's Done: hand over everything captured on this page, including
    // keystrokes from the last 250 ms that haven't reached the draft yet.
    if (msg?.type === "FLUSH_RECORDING") {
      window.clearTimeout(flushTimer);
      refresh(captured);
      sendResponse({ ok: true, fields: answers() });
    }
    return false;
  });
}
