/**
 * Learns answers on the TDAC form. Two modes:
 *
 *  - Recording ("Learn X's answers"): every listed field the user changes is
 *    captured into the draft in storage, so it survives page loads. Values already
 *    on the page are NOT captured, even if the user tabs or clicks through them, so
 *    adding a second traveller on a filled form doesn't copy the first one's answers.
 *    If the form moves to someone else mid-recording, learning stops for this person.
 *  - Corrections: after Fill has run, fields the user then changes by hand update
 *    the traveller that was filled, and only that traveller. The site keeps every
 *    traveller of a trip on the same route, so corrections stop as soon as the name
 *    or passport on the form stops being the person who was filled.
 *
 * The content script never writes saved answers itself: it sends them to the
 * background, which files them under the traveller id they belong to. Only real
 * user events count (`isTrusted`), so the page's own scripts can't teach it.
 */
import { DRAFT_KEY, type RecordingDraft } from "../../lib/keysTh";
import { bus, CAPTURE, emit, PERSON_CHANGED, REPLAY_END, REPLAY_START, REPLAYED, SAVE_RECORDING, SAVED } from "../bus";
import { withDateRules } from "./dates";
import { clean, isAllowed, isFormPage, keyOf, readAnswer, type Answer } from "./fields";

let recording = false;
let replayDepth = 0;
/** Traveller filled on this form by the last Fill, if any: corrections go to them. */
let filledFor: string | null = null;
/** Name and passport on the form when Fill ran, kept up to date with the user's own edits. */
let filledIdentity = new Map<string, string>();
/** The field the user last touched. */
let lastKey: string | null = null;
/** Each field touched in this tab, with the value it held when first touched. */
const baselines = new Map<string, string>();
/** Touched fields whose value the user has since changed: only these are answers. */
const changed = new Set<string>();
/** Changed here and not yet written to the draft: only these outrank another tab's answer. */
const pending = new Set<string>();
/** Fields with a chip the user pressed: it goes after the click, so it's noticed at the next re-read. */
const removing = new Set<string>();
/** The traveller the current recording belongs to. */
let recordingFor: string | undefined;
/** The form moved to another person mid-recording: nothing more belongs to this one. */
let frozen = false;

const IDENTITY = ["familyName", "firstName", "passportNo"];
const captured = new Map<string, Answer>();
const corrections = new Map<string, Answer>();
const hasStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;
const worthSaving = (fields: Map<string, Answer>) => withDateRules([...fields.values()].filter(a => a.value || a.cleared));
const answers = () => worthSaving(captured);
let flushTimer: number | undefined;
let correctionTimer: number | undefined;

/**
 * Re-read fields touched in this tab: an option click lands in a popup outside the
 * field, so a change can only be seen afterwards. Never fields it only knows from the
 * draft: another tab's form may show someone else. An empty reading is not a clear:
 * the site blanks the whole form when it moves to another traveller. Clears come
 * from the user's own edit, in onEvent.
 */
function refresh(fields: Map<string, Answer>) {
  for (const [key, baseline] of baselines) {
    const now = readAnswer(key);
    if (!now?.value) {
      // The one exception: the user pressed the last chip's remove button.
      if (now && removing.delete(key) && fields.get(key)?.value) { changed.add(key); pending.add(key); fields.set(key, { ...now, value: "", cleared: true }); }
      continue;
    }
    removing.delete(key);
    if (changed.has(key) || now.value !== baseline) {
      if (fields.get(key)?.value !== now.value) pending.add(key);
      changed.add(key);
      fields.set(key, now);
    }
  }
}

const sameText = (a: string, b: string) => clean(a).toLowerCase() === clean(b).toLowerCase();

/**
 * The name or passport this recording learned is no longer what the form shows. A field
 * that isn't on the page says nothing: the last page has no name or passport boxes.
 */
function formLeftThisPerson(edited?: string | null): boolean {
  return IDENTITY.some(k => {
    if (k === edited || !changed.has(k)) return false;
    const now = readAnswer(k);
    return !!now && !sameText(captured.get(k)?.value ?? "", now.value);
  });
}

function freeze() {
  frozen = true;
  emit(PERSON_CHANGED);
}

/** Bring the captured answers up to date, unless the form has moved to someone else. */
function reread() {
  if (!frozen && formLeftThisPerson()) freeze();
  if (!frozen) refresh(captured);
}

function stopTimer() {
  window.clearTimeout(flushTimer);
  flushTimer = undefined;
}

function forgetTab() {
  baselines.clear();
  changed.clear();
  pending.clear();
  removing.clear();
  frozen = false;
  captured.clear();
}

function flush() {
  stopTimer();
  if (!hasStorage || !recording) return;
  reread();
  pending.clear();
  void chrome.storage.local.get(DRAFT_KEY).then(res => {
    const draft = res[DRAFT_KEY] as RecordingDraft<Answer> | undefined;
    if (!draft?.active || !recording) return;
    return chrome.storage.local.set({ [DRAFT_KEY]: { ...draft, fields: answers() } });
  }).catch(() => undefined);
}

function scheduleFlush() {
  if (flushTimer === undefined) flushTimer = window.setTimeout(flush, 250);
}

function applyDraft(draft?: RecordingDraft<Answer>) {
  if (!draft?.active) {
    recording = false;
    recordingFor = undefined;
    forgetTab();
    return;
  }
  if (!recording) { corrections.clear(); baselines.clear(); changed.clear(); pending.clear(); }
  if (draft.travellerId !== recordingFor) forgetTab();
  recordingFor = draft.travellerId;
  recording = true;
  // Another tab's latest word, except on changes this tab hasn't written yet. Taking
  // it means what this tab's form still shows is no longer an answer to re-read.
  for (const a of draft.fields ?? []) {
    if (!isAllowed(a.key) || pending.has(a.key)) continue;
    if (changed.has(a.key) && captured.get(a.key)?.value !== a.value) {
      changed.delete(a.key);
      baselines.set(a.key, readAnswer(a.key)?.value ?? "");
    }
    captured.set(a.key, a);
  }
}

async function sendCorrections() {
  correctionTimer = undefined;
  if (recording || replayDepth || !filledFor || !isFormPage()) return corrections.clear();
  if (formChangedPerson(lastKey)) return stopCorrections();
  refresh(corrections);
  const fields = worthSaving(corrections);
  corrections.clear();
  baselines.clear();
  changed.clear();
  if (!fields.length) return;
  try {
    await chrome.runtime.sendMessage({ country: "th", type: "LEARN_UPDATE", travellerId: filledFor, fields });
  } catch { /* extension reloaded under this page */ }
}

function readIdentity() {
  return new Map(IDENTITY.map(k => [k, readAnswer(k)?.value ?? ""]).filter(([, v]) => v) as [string, string][]);
}

/** The site swapped the form to another traveller (Add, or picking one in its list). */
function formChangedPerson(edited: string | null | undefined): boolean {
  return [...filledIdentity].some(([k, v]) => k !== edited && (readAnswer(k)?.value ?? "") !== v);
}

function stopCorrections() {
  filledFor = null;
  filledIdentity.clear();
  window.clearTimeout(correctionTimer);
  corrections.clear();
  baselines.clear();
  changed.clear();
}

// Unit tests can only dispatch synthetic events; production builds drop this.
const trusted = (e: Event) => e.isTrusted || import.meta.env.MODE === "test";

function onEvent(e: Event) {
  if (!trusted(e) || replayDepth || !isFormPage() || !(e.target instanceof Element)) return;
  if (e.target.closest("#thaiarrival-panel")) return;
  if (frozen || (!recording && !filledFor)) return;
  const key = keyOf(e.target);
  if (recording && formLeftThisPerson(key)) return freeze();
  if (!recording && formChangedPerson(key)) return stopCorrections();
  if (!recording && key && IDENTITY.includes(key)) filledIdentity.set(key, readAnswer(key)?.value ?? "");
  if (isAllowed(key)) {
    lastKey = key;
    const fields = recording ? captured : corrections;
    if (e.type === "click" && e.target.closest("mat-chip-row")) removing.add(key);
    const edited = e.type === "input" || e.type === "change";
    const now = readAnswer(key);
    // Focus and clicks only note what the field held. Only a change makes it an answer.
    if (!baselines.has(key)) baselines.set(key, edited ? fields.get(key)?.value ?? "" : now?.value ?? "");
    if (edited && now) {
      const was = fields.get(key);
      if (now.value) { changed.add(key); pending.add(key); fields.set(key, now); }
      // Emptied by the user: there must have been a value, here or in the draft.
      else if (was?.value || was?.cleared || baselines.get(key)) { changed.add(key); pending.add(key); fields.set(key, { ...now, value: "", cleared: true }); }
    }
  }
  // Any event can be the option click that changes a touched field: re-read shortly after.
  if (recording) scheduleFlush();
  else {
    window.clearTimeout(correctionTimer);
    correctionTimer = window.setTimeout(sendCorrections, 600);
  }
}

// focusin: a field reached by Tab is read before the user empties it.
for (const type of ["input", "change", "click", "focusin", "focusout"]) document.addEventListener(type, onEvent, true);
window.addEventListener("pagehide", flush);
window.addEventListener("hashchange", stopCorrections);

bus.addEventListener(REPLAY_START, () => {
  replayDepth++;
  window.clearTimeout(correctionTimer);
  corrections.clear();
  // A new fill may be for someone else: earlier edits on this form aren't theirs.
  if (!recording) { baselines.clear(); changed.clear(); removing.clear(); }
});
bus.addEventListener(REPLAY_END, () => {
  replayDepth = Math.max(0, replayDepth - 1);
  // What a fill just wrote is not the user's change.
  for (const key of baselines.keys()) if (!changed.has(key)) baselines.set(key, readAnswer(key)?.value ?? "");
});
bus.addEventListener(REPLAYED, e => {
  filledFor = (e as CustomEvent<string | undefined>).detail ?? null;
  filledIdentity = readIdentity();
});
bus.addEventListener(CAPTURE, e => {
  if (!recording) return;
  // As the form shows them now, so what's saved is what the traveller sees.
  for (const a of (e as CustomEvent<Answer[]>).detail) {
    const now = isAllowed(a.key) ? readAnswer(a.key) : null;
    if (now?.value) { captured.set(a.key, now); baselines.set(a.key, now.value); changed.add(a.key); pending.add(a.key); }
  }
  flush();
});
bus.addEventListener(SAVE_RECORDING, async () => {
  stopTimer();
  reread();
  try {
    const res = await chrome.runtime.sendMessage({ country: "th", type: "SAVE_LEARNED", fields: answers() });
    if (res?.ok) recording = false;
    emit(SAVED, res);
  } catch {
    emit(SAVED, null);
  }
});

if (hasStorage) {
  void chrome.storage.local.get(DRAFT_KEY).then(res => applyDraft(res[DRAFT_KEY]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && DRAFT_KEY in changes) applyDraft(changes[DRAFT_KEY].newValue);
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // The popup's Done: hand over everything captured, including keystrokes from
    // the last 250 ms that haven't reached the draft yet.
    if (msg?.type === "FLUSH_RECORDING") {
      stopTimer();
      reread();
      sendResponse({ ok: true, fields: answers() });
    }
    return false;
  });
}
