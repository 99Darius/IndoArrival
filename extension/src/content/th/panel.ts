/** Floating learning/fill panel, isolated from the government page's styles. */
import { dateRuleText } from "./dates";
import { CHECKED, currentStep, HEALTH, isFormPage, LAST, PERSONAL, readAnswer, TRIP, wrapper, type Answer } from "./fields";
import { fillStep, planForStep } from "./fill";
import { ACTIVE_PROFILE_KEY, DRAFT_KEY, LEARNED_KEY, PROFILES_KEY, type RecordingDraft } from "../../lib/keysTh";
import { bus, CAPTURE, emit, PERSON_CHANGED, REPLAYED, SAVE_RECORDING, SAVED } from "../bus";
import { createOffer, OFFER_STYLE } from "../sharedOffer";
import { keepClearOf, makeDraggable, releasePanel } from "../dragPanel";
import { REVEAL_STYLE, revealNewest, type Row } from "../revealNewest";

const STYLE = `
 :host { all: initial; position: fixed; left: 8px; top: 60px; z-index: 2147483647;
   width: min(275px, calc(100vw - 24px)); font: 13px/1.45 -apple-system,system-ui,sans-serif; color: #0E3A34; }
 * { box-sizing: border-box; } .panel { background: #FBFAF6; border: 1px solid #ccd3e0; border-radius: 12px;
   box-shadow: 0 4px 24px #1b2f5b38; overflow: hidden; }
 header { display: flex; align-items: center; justify-content: space-between; background: #0E3A34; color: white; padding: 9px 12px; }
 header button { background: none; color: white; padding: 2px 7px; font-size: 17px; }
 .body { padding: 12px; max-height: min(65vh, 520px); overflow: auto; } h2 { font-size: 14px; margin: 0 0 7px; }
 p { margin: 6px 0 9px; } .note { font-size: 12px; color: #55607a; }
 ul { list-style: none; padding: 0; margin: 8px 0; max-height: 180px; overflow: auto; }
 li { border-top: 1px solid #e0e3ea; padding: 5px 0; overflow-wrap: anywhere; }
 li strong { display: block; font-size: 11px; color: #55607a; } li span { white-space: pre-wrap; }
 button { border: 0; border-radius: 7px; cursor: pointer; font: inherit; }
 .action { width: 100%; padding: 9px; background: #C8452D; color: white; font-weight: 700; }
 button:disabled { opacity: .55; cursor: wait; } button:focus-visible { outline: 2px solid #4a6fc0; outline-offset: 2px; }
 .msg { font-size: 12px; margin: 8px 0 0; } .msg:empty { display: none; }
${OFFER_STYLE}${REVEAL_STYLE}`;

/** What the panel mustn't cover on the last page: the email, the tick with its words, and every button there. */
function lastPageTargets(): Element[] {
  const tick = wrapper("agreedTerms");
  return [
    ...(wrapper("sendTo")?.querySelectorAll("input") ?? []),
    ...(tick?.parentElement?.children ?? []),
    ...[...document.querySelectorAll("button")].filter(b => !b.closest("mat-accordion")),
  ];
}

function stepNotes(step: string[]): string[] {
  if (step === TRIP) return ["Arrival counts from today and departure from arrival, so both move with the calendar. I reuse your last flight and address: change them if this trip is different."];
  if (step === LAST) return ["I add your email and open the site's agreement. Read it and press Agree there yourself, then check everything and press Submit yourself."];
  if (step === HEALTH) return ["These are your answers from last time. Check the countries and symptoms are true for this trip. Upload any vaccination certificate yourself."];
  return [];
}

export function mountPanel(): void {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  const host = document.createElement("div");
  host.id = "thaiarrival-panel";
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style"); style.textContent = STYLE;
  const panel = document.createElement("section"); panel.className = "panel"; panel.setAttribute("aria-label", "ArrivalFiller assistant");
  const header = document.createElement("header");
  const brand = document.createElement("b");
  const toggle = document.createElement("button"); toggle.type = "button";
  const body = document.createElement("div"); body.className = "body";
  const title = document.createElement("h2");
  const notes = document.createElement("div");
  const list = document.createElement("ul"); list.setAttribute("aria-label", "Saved answers");
  const action = document.createElement("button"); action.type = "button"; action.className = "action";
  const msg = document.createElement("div"); msg.className = "msg"; msg.setAttribute("role", "status");
  const offer = createOffer({
    country: "th",
    say: text => { msg.textContent = text; },
    async use(items) {
      // All of an item or none (a typed birth year stays with its own month and day),
      // and only over blank fields: never over something the traveller has typed.
      const blank = items.filter(i => (i.answers as Answer[]).every(a => !readAnswer(a.key)?.value)).flatMap(i => i.answers as Answer[]);
      const result = await fillStep(blank);
      emit(CAPTURE, blank.filter(a => result.filled.includes(a.label ?? a.key)));
      const left = [...result.opened, ...result.missing];
      return { filled: result.filled.length, text: `${result.filled.length} filled from your saved records.${left.length ? ` Fill yourself: ${left.join(", ")}.` : ""} Check them, then keep going.` };
    },
  });
  header.append(brand, toggle); body.append(title, notes, offer.el, list, action, msg); panel.append(header, body); root.append(style, panel);

  makeDraggable(host, header);

  let learned: Answer[] = [];
  let travellerId: string | undefined;
  let profiles: { id: string; label: string }[] = [];
  let draft: RecordingDraft<Answer> | undefined;
  let collapsed = false;
  let busy = false;
  /** Shown after Done until the user starts learning again. */
  let savedNote: { title: string; text: string } | null = null;
  let hash = location.hash;
  let fingerprint = "";
  /** Last value shown per field, so a new or changed answer can be scrolled to. */
  let lastShown = new Map<string, string>();

  function render() {
    const recording = !!draft?.active;
    const onForm = isFormPage();
    const show = onForm && (recording || learned.length > 0);
    host.style.display = show ? "block" : "none";
    if (show && !host.isConnected) document.documentElement.append(host);
    if (!show) return;
    const step = currentStep();
    const plan = planForStep(learned);
    const shown = recording ? (draft?.fields ?? []).filter(a => a.value) : plan;
    const who = profiles.find(p => p.id === (recording ? draft?.travellerId : travellerId))?.label;
    brand.textContent = recording ? `ArrivalFiller · Learning ${who ?? ""} (${shown.length})` : `ArrivalFiller · ${who ?? "Ready"}`;
    toggle.textContent = collapsed ? "+" : "−";
    toggle.setAttribute("aria-label", collapsed ? "Expand ArrivalFiller" : "Minimize ArrivalFiller");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    body.hidden = collapsed;
    if (recording) savedNote = null;
    offer.update(recording ? draft?.travellerId : undefined, step === PERSONAL);
    title.textContent = recording ? `Remembering ${shown.length} ${shown.length === 1 ? "answer" : "answers"} as you fill`
      : savedNote ? savedNote.title
      : !step.length ? "This step is yours"
      : plan.length ? `I can fill ${plan.length} ${plan.length === 1 ? "field" : "fields"} on this step` : "Nothing saved for this step";
    const text = recording ? ["Keep going through the steps, including health, then save here."]
      : savedNote ? [savedNote.text]
      : !step.length ? ["I don't fill this step. Check everything before you submit."]
      : step === LAST ? stepNotes(step)
      : ["Fill this step, check the results, then press Continue yourself.", ...stepNotes(step)];
    const signature = JSON.stringify([text, shown]);
    if (fingerprint !== signature) {
      fingerprint = signature;
      notes.replaceChildren(...text.map(t => { const p = document.createElement("p"); p.className = "note"; p.textContent = t; return p; }));
      const rows: Row[] = [];
      list.replaceChildren(...shown.map(a => {
        const li = document.createElement("li");
        const label = document.createElement("strong"); label.textContent = a.label || a.key;
        const value = document.createElement("span"); value.textContent = dateRuleText(a) ?? (a.kind === "check" ? (a.value === CHECKED ? "Yes" : "No") : a.value);
        li.append(label, value);
        rows.push({ key: a.key, value: a.value, li });
        return li;
      }));
      if (recording) lastShown = revealNewest(lastShown, rows, list, body);
      else { lastShown = new Map(); list.scrollTop = 0; }
    }
    action.hidden = !recording && !step.length;
    action.textContent = recording ? "Done: save what I learned" : `Fill this step${who ? ` as ${who}` : ""} (${plan.length})`;
    action.disabled = busy || (!recording && plan.length === 0);
    if (step === LAST) keepClearOf(host, lastPageTargets());
    else releasePanel(host);
  }

  toggle.addEventListener("click", () => { collapsed = !collapsed; render(); });
  action.addEventListener("click", async () => {
    if (draft?.active) {
      busy = true; render(); msg.textContent = "Saving…";
      emit(SAVE_RECORDING);
      return;
    }
    busy = true; render(); msg.textContent = "Filling…";
    // Whoever was picked when Fill was pressed, even if the popup switches traveller meanwhile.
    const filled = travellerId;
    try {
      const result = await fillStep(learned);
      emit(REPLAYED, filled);
      const bits = [`${result.filled.length} filled`];
      if (result.opened.length) bits.push(`Do yourself: ${result.opened.join(", ")}`);
      if (result.missing.length) bits.push(`Not found: ${result.missing.join(", ")}`);
      msg.textContent = `${bits.join(" · ")}. Review every answer before you continue.`;
    } catch (e) { msg.textContent = /Still filling/.test((e as Error).message) ? (e as Error).message : "Couldn't fill this step. Refresh the page and try again."; }
    finally { busy = false; render(); }
  });
  bus.addEventListener(PERSON_CHANGED, () => {
    msg.textContent = "The form moved to someone else, so I've stopped learning. Press Done to save what I have so far.";
  });
  bus.addEventListener(SAVED, e => {
    busy = false;
    const res = (e as CustomEvent<{ ok?: boolean; saved?: number; total?: number; label?: string } | null>).detail;
    if (res?.ok && res.saved) {
      const who = res.label ? ` for ${res.label}` : "";
      savedNote = { title: `Learned ${res.saved} ${res.saved === 1 ? "answer" : "answers"}${who}`,
        text: `${res.total ?? res.saved} answers saved in total. Next trip: open the form, pick who's travelling, and press Fill on each step.` };
      msg.textContent = "";
    } else {
      msg.textContent = !res?.ok ? "Couldn't save. Open the extension and try Done again." : "Nothing new was filled in, so nothing changed.";
    }
    render();
  });
  void chrome.storage.local.get([LEARNED_KEY, DRAFT_KEY, ACTIVE_PROFILE_KEY, PROFILES_KEY]).then(res => {
    learned = res[LEARNED_KEY] ?? []; draft = res[DRAFT_KEY]; travellerId = res[ACTIVE_PROFILE_KEY] ?? undefined; profiles = res[PROFILES_KEY] ?? []; render();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (LEARNED_KEY in changes) learned = changes[LEARNED_KEY].newValue ?? [];
    if (ACTIVE_PROFILE_KEY in changes) travellerId = changes[ACTIVE_PROFILE_KEY].newValue ?? undefined;
    if (DRAFT_KEY in changes) draft = changes[DRAFT_KEY].newValue;
    if (PROFILES_KEY in changes) profiles = changes[PROFILES_KEY].newValue ?? [];
    render();
  });
  // The steps and the site's routes change without a page load.
  window.setInterval(() => {
    if (hash !== location.hash) { hash = location.hash; msg.textContent = ""; savedNote = null; collapsed = false; }
    if (!busy) render();
  }, 600);
}
