/** Floating learning/replay panel, isolated from the government page's styles. */
import fieldMapJson from "../../../config/field-maps/allindonesia.v1.json";
import { isReplayable, replayLearned, type FieldMap, type LearnedField } from "./formFill";
import { controls, describeField, fieldKey } from "./formFields";
import { dateRuleText, isFormPage, pageNotes, planForPage, rememberable } from "./tripDefaults";
import { ACTIVE_PROFILE_KEY, DRAFT_KEY, LEARNED_KEY, type RecordingDraft } from "../lib/keys";
import { bus, emit, REPLAYED, SAVE_RECORDING, SAVED } from "./bus";

const STYLE = `
 :host { all: initial; position: fixed; right: 18px; top: 12px; z-index: 2147483647;
   width: min(330px, calc(100vw - 24px)); font: 13px/1.45 -apple-system,system-ui,sans-serif; color: #0E3A34; }
 * { box-sizing: border-box; } .panel { background: #FBFAF6; border: 1px solid #ccd8d3; border-radius: 12px;
   box-shadow: 0 4px 24px #0e3a3438; overflow: hidden; }
 header { display: flex; align-items: center; justify-content: space-between; background: #0E3A34; color: white; padding: 9px 12px; }
 header button { background: none; color: white; padding: 2px 7px; font-size: 17px; }
 .body { padding: 12px; max-height: min(65vh, 520px); overflow: auto; } h2 { font-size: 14px; margin: 0 0 7px; }
 p { margin: 6px 0 9px; } .note { font-size: 12px; color: #52635e; }
 ul { list-style: none; padding: 0; margin: 8px 0; max-height: 180px; overflow: auto; position: relative; }
 li.fresh { background: #fdeee9; transition: background 1.5s; } li { transition: background 1.5s; }
 li { border-top: 1px solid #e0e3dc; padding: 5px 0; overflow-wrap: anywhere; }
 li strong { display: block; font-size: 11px; color: #52635e; } li span { white-space: pre-wrap; }
 button { border: 0; border-radius: 7px; cursor: pointer; font: inherit; }
 .action { width: 100%; padding: 9px; background: #C8452D; color: white; font-weight: 700; }
 button:disabled { opacity: .55; cursor: wait; } button:focus-visible { outline: 2px solid #339b7b; outline-offset: 2px; }
 .msg { font-size: 12px; margin: 8px 0 0; } .msg:empty { display: none; }
`;

function displayLabel(f: LearnedField): string {
  if (f.label && f.label.length > 90) return `${f.label.slice(0, 88)}…`;
  return f.label || f.placeholder || f.selector?.replace(/\[id\^?="|"\]|^#|_\d{6,}$/g, "").replace(/_/g, " ") || "Field";
}

export function mountFillButton(): void {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  const host = document.createElement("div");
  host.id = "indoarrival-panel";
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style"); style.textContent = STYLE;
  const panel = document.createElement("section"); panel.className = "panel"; panel.setAttribute("aria-label", "IndoArrival assistant");
  const header = document.createElement("header");
  const brand = document.createElement("b");
  const toggle = document.createElement("button"); toggle.type = "button";
  const body = document.createElement("div"); body.className = "body";
  const title = document.createElement("h2");
  const notes = document.createElement("div");
  const list = document.createElement("ul"); list.setAttribute("aria-label", "Learned fields");
  const action = document.createElement("button"); action.type = "button"; action.className = "action";
  const msg = document.createElement("div"); msg.className = "msg"; msg.setAttribute("role", "status");
  header.append(brand, toggle); body.append(title, notes, list, action, msg); panel.append(header, body); root.append(style, panel);

  let learned: LearnedField[] = [];
  let travellerId: string | undefined;
  let draft: RecordingDraft<LearnedField> | undefined;
  let collapsed = false;
  let busy = false;
  /** Shown after Done until the user moves to another page or starts learning again. */
  let savedNote: { title: string; text: string } | null = null;
  let path = location.pathname;
  let fingerprint = "";
  /** Last value shown per field, so a new or changed answer can be scrolled to. */
  let lastShown = new Map<string, string>();

  function render() {
    const recording = !!draft?.active;
    const onStep = isFormPage();
    const show = recording || (learned.length > 0 && onStep);
    host.style.display = show ? "block" : "none";
    if (show && !host.isConnected) document.documentElement.append(host);
    const plan = planForPage(learned).filter(isReplayable);
    const visibleFields = new Set(controls().map(describeField).map(fieldKey)).size;
    const shown = recording ? (draft?.fields ?? []).filter(f => rememberable(f) && isReplayable(f)) : plan;
    brand.textContent = recording ? `IndoArrival · Learning (${shown.length})` : "IndoArrival · Ready";
    toggle.textContent = collapsed ? "+" : "−";
    toggle.setAttribute("aria-label", collapsed ? "Expand IndoArrival" : "Minimize IndoArrival");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    body.hidden = collapsed;
    if (recording) savedNote = null;
    title.textContent = recording ? `Remembering ${shown.length} ${shown.length === 1 ? "field" : "fields"} as you fill`
      : savedNote ? savedNote.title
      : plan.length ? `I see ${visibleFields} ${visibleFields === 1 ? "field" : "fields"}; I can fill ${plan.length}` : "Nothing to fill on this page";
    const text = recording ? ["These are the answers I've captured. Keep going through every page, then save here.", ...pageNotes()]
      : savedNote ? [savedNote.text]
      : ["Fill this page, check the results, then move to the next page yourself.", ...pageNotes()];
    const signature = JSON.stringify([text, shown]);
    if (fingerprint !== signature) {
      fingerprint = signature;
      notes.replaceChildren(...text.map(t => { const p = document.createElement("p"); p.className = "note"; p.textContent = t; return p; }));
      let latest: HTMLLIElement | undefined;
      list.replaceChildren(...shown.map(f => {
        const li = document.createElement("li");
        const label = document.createElement("strong"); label.textContent = displayLabel(f);
        const value = document.createElement("span"); value.textContent = dateRuleText(f) ?? f.value;
        li.append(label, value);
        if (recording && lastShown.size && lastShown.get(fieldKey(f)) !== f.value) latest = li;
        return li;
      }));
      // Bring the answer just learned into view and flash it, so it's clear it was captured.
      if (latest) {
        const li = latest;
        list.scrollTop = li.offsetTop - (list.clientHeight - li.offsetHeight) / 2;
        li.classList.add("fresh");
        window.setTimeout(() => li.classList.remove("fresh"), 50);
      }
      lastShown = new Map(shown.map(f => [fieldKey(f), f.value]));
    }
    action.textContent = recording ? "Done — save what I learned" : `Fill this page (${plan.length})`;
    action.disabled = busy || (!recording && plan.length === 0);
  }

  toggle.addEventListener("click", () => { collapsed = !collapsed; render(); });
  action.addEventListener("click", async () => {
    if (draft?.active) {
      busy = true; render(); msg.textContent = "Saving…";
      emit(SAVE_RECORDING);
      return;
    }
    busy = true; render(); msg.textContent = "Filling…";
    try {
      const result = await replayLearned(learned, fieldMapJson as unknown as FieldMap);
      emit(REPLAYED, travellerId);
      const bits = [`${result.filled.length} filled`];
      if (result.opened.length) bits.push(`Choose manually: ${result.opened.join(", ")}`);
      if (result.missing.length) bits.push(`Not found: ${result.missing.join(", ")}`);
      msg.textContent = `${bits.join(" · ")}. Review every answer before you continue.`;
    } catch { msg.textContent = "Couldn't fill this page. Refresh it and try again."; }
    finally { busy = false; render(); }
  });
  bus.addEventListener(SAVED, e => {
    busy = false; render();
    const res = (e as CustomEvent<{ ok?: boolean; saved?: number; total?: number; label?: string } | null>).detail;
    if (res?.ok && res.saved) {
      const who = res.label ? ` for ${res.label}` : "";
      savedNote = { title: `Learned ${res.saved} ${res.saved === 1 ? "answer" : "answers"}${who}`,
        text: `${res.total ?? res.saved} answers saved in total. Next trip: open the form, pick who's travelling, and press Fill on each page.` };
      msg.textContent = "";
    } else {
      msg.textContent = !res?.ok ? "Couldn't save. Open the extension and try Done again." : "Nothing new was filled in, so nothing changed.";
    }
    render();
  });
  void chrome.storage.local.get([LEARNED_KEY, DRAFT_KEY, ACTIVE_PROFILE_KEY]).then(res => {
    learned = res[LEARNED_KEY] ?? []; draft = res[DRAFT_KEY]; travellerId = res[ACTIVE_PROFILE_KEY] ?? undefined; render();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (LEARNED_KEY in changes) learned = changes[LEARNED_KEY].newValue ?? [];
    if (ACTIVE_PROFILE_KEY in changes) travellerId = changes[ACTIVE_PROFILE_KEY].newValue ?? undefined;
    if (DRAFT_KEY in changes) draft = changes[DRAFT_KEY].newValue;
    render();
  });
  // Routes, conditional controls and lazy dropdowns can change without navigation.
  window.setInterval(() => {
    if (path !== location.pathname) { path = location.pathname; msg.textContent = ""; savedNote = null; collapsed = false; }
    if (!busy) render();
  }, 600);
}
