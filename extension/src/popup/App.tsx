/**
 * Popup — travellers.
 *
 *   Consent (gate) -> Travellers <-> Add traveller -> Learning
 *
 * Each traveller's answers are learned by demonstration: they fill the real gov
 * form once while the recorder watches. Picking a traveller loads their answers;
 * "Fill" replays them on the form page. The popup never submits — the human
 * reviews and presses the government Submit.
 */
import { useEffect, useState } from "react";
import { AdFooter } from "../ui/AdFooter";
import { ConsentGate } from "../ui/ConsentGate";
import { DRAFT_KEY, OPEN_FORM_KEY, type RecordingDraft } from "../lib/keys";
import "./popup.css";

type Phase = "loading" | "home" | "add" | "recording";

interface Traveller { id: string; label: string; count: number }

const FORM_URL = "https://allindonesia.imigrasi.go.id/";
const FORM_PAGE = /^https:\/\/allindonesia\.imigrasi\.go\.id\/arrival-card-submission\//;

function Header({ chip }: { chip: { label: string; kind?: string } }) {
  return (
    <div className="ia-head">
      <div className="ia-mark">
        <b>IndoArrival</b>
        <span>e-arrival</span>
      </div>
      <div className={`ia-chip ${chip.kind ?? ""}`}>Status: {chip.label}</div>
    </div>
  );
}

function Main() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [recCount, setRecCount] = useState(0);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [onForm, setOnForm] = useState(true);
  const [filling, setFilling] = useState(false);

  const active = travellers.find((t) => t.id === activeId);

  function apply(res: { travellers?: Traveller[]; activeId?: string } | undefined) {
    setTravellers(res?.travellers ?? []);
    setActiveId(res?.activeId);
    return res?.travellers ?? [];
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!cancelled) setOnForm(!!tab?.url && FORM_PAGE.test(tab.url));
      const res = await chrome.runtime.sendMessage({ type: "GET_TRAVELLERS" });
      if (cancelled) return;
      const list = apply(res);
      // The popup closes whenever you click into the page; a recording carries
      // on in storage, so come back to it.
      const draft = await readDraft();
      if (cancelled) return;
      if (draft?.active) {
        setRecCount(draft.fields?.length ?? 0);
        setPhase("recording");
      } else {
        setPhase(list.length ? "home" : "add");
      }
    })();
    const onChanged = (changes: { [k: string]: chrome.storage.StorageChange }, area: string) => {
      const draft = changes[DRAFT_KEY]?.newValue as RecordingDraft | undefined;
      if (area === "local" && draft?.active) setRecCount(draft.fields?.length ?? 0);
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => { cancelled = true; chrome.storage.onChanged.removeListener(onChanged); };
  }, []);

  async function readDraft(): Promise<RecordingDraft | undefined> {
    return (await chrome.storage.local.get(DRAFT_KEY))[DRAFT_KEY];
  }

  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function openForm() {
    // The form page can't be opened directly — the site bounces a fresh visit to
    // its home page. So open home and let the content script click through.
    await chrome.storage.local.set({ [OPEN_FORM_KEY]: Date.now() });
    chrome.tabs.create({ url: FORM_URL });
  }

  async function select(id: string) {
    setStatus("");
    apply(await chrome.runtime.sendMessage({ type: "SELECT_TRAVELLER", id }));
  }

  /** Start learning a traveller's answers. Recorders pick this up in every form tab. */
  async function startLearning(travellerId = activeId) {
    const draft: RecordingDraft = { active: true, fields: [], travellerId };
    await chrome.storage.local.set({ [DRAFT_KEY]: draft });
    setRecCount(0);
    setStatus("");
    setPhase("recording");
    if (!onForm) await openForm();
  }

  async function addTraveller() {
    const label = name.trim();
    if (!label) return setStatus("Type the traveller's name first.");
    const res = apply(await chrome.runtime.sendMessage({ type: "ADD_TRAVELLER", label }));
    setName("");
    await startLearning(res.find((t) => t.label === label)?.id);
  }

  async function finishLearning() {
    const tab = await activeTab();
    let fields: unknown[] = (await readDraft())?.fields ?? [];
    try {
      // The live recorder may hold keystrokes it hasn't written to the draft yet.
      const res = await chrome.tabs.sendMessage(tab!.id!, { type: "FLUSH_RECORDING" });
      if ((res?.fields?.length ?? 0) >= fields.length) fields = res.fields;
    } catch {
      /* not on the form tab — the saved draft has everything */
    }
    const saved = await chrome.runtime.sendMessage({ type: "SAVE_LEARNED", fields });
    apply(await chrome.runtime.sendMessage({ type: "GET_TRAVELLERS" }));
    setPhase("home");
    setStatus(saved?.saved ? "Saved." : "Nothing new was filled in, so nothing changed.");
  }

  async function cancelLearning() {
    await chrome.storage.local.remove(DRAFT_KEY);
    setPhase(travellers.length ? "home" : "add");
  }

  async function fill() {
    if (filling) return;
    setFilling(true);
    setStatus("Filling…");
    const tab = await activeTab();
    const res = await chrome.runtime.sendMessage({ type: "GET_LEARNED" });
    chrome.tabs.sendMessage(tab!.id!, { type: "REPLAY_LEARNED", fields: res?.learned ?? [], travellerId: activeId }, (r) => {
      setFilling(false);
      if (chrome.runtime.lastError || !r?.ok) return setStatus(r?.error ?? "Refresh the form page (⌘R), then press Fill again.");
      const { filled, opened, missing } = r.result;
      const bits = [`Filled ${filled.length}`];
      if (opened.length) bits.push(`${opened.length} to pick yourself`);
      if (missing.length) bits.push(`${missing.length} not on this page`);
      setStatus(`${bits.join(" · ")}. Check every field before Next.`);
    });
  }

  async function remove(t: Traveller) {
    if (!window.confirm(`Delete ${t.label} and their saved answers?`)) return;
    const list = apply(await chrome.runtime.sendMessage({ type: "DELETE_TRAVELLER", id: t.id }));
    if (!list.length) setPhase("add");
  }

  async function eraseAll() {
    if (!window.confirm("Erase every traveller and all saved answers from this browser?")) return;
    await chrome.runtime.sendMessage({ type: "WIPE_DATA" });
    apply(undefined);
    setPhase("add");
  }

  // ---- render ----
  if (phase === "loading") {
    return <div className="ia"><Header chip={{ label: "···" }} /><div className="ia-body" /></div>;
  }

  if (phase === "recording") {
    return (
      <div className="ia">
        <Header chip={{ label: "Learning", kind: "rec" }} />
        <div className="ia-body">
          <h1 className="ia-h1">{active ? `Learning ${active.label}'s answers` : "Learning answers"}</h1>
          <p className="ia-lede">Fill the arrival card as usual, page by page. When you're done, open this again and press Done.</p>
          <div className="ia-panel">
            <div className="ia-stat"><b>{recCount}</b><span>answers so far</span></div>
          </div>
          <button className="ia-btn ia-btn-primary" onClick={finishLearning}>
            <span className="ia-rec-dot" /> Done — save answers
          </button>
          <button className="ia-link" onClick={cancelLearning}>Cancel</button>
          {status && <div className="ia-status">{status}</div>}
        </div>
        <AdFooter />
      </div>
    );
  }

  if (phase === "add") {
    const first = travellers.length === 0;
    return (
      <div className="ia">
        <Header chip={{ label: "Setup" }} />
        <div className="ia-body">
          <h1 className="ia-h1">{first ? "Fill the arrival card once" : "Add a traveller"}</h1>
          <p className="ia-lede">
            {first
              ? "Next trip, it fills itself. Type who is travelling, then fill the form as usual — IndoArrival remembers the answers."
              : "Fill the form for them once. IndoArrival remembers their answers for next time."}
          </p>
          <label className="ia-label" htmlFor="ia-name">Traveller's name</label>
          <input
            id="ia-name"
            className="ia-input"
            value={name}
            placeholder="e.g. Alex"
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void addTraveller(); }}
          />
          <button className="ia-btn ia-btn-primary" onClick={addTraveller}>
            {onForm ? "Start" : "Start — opens the form"}
          </button>
          {!first && (
            <div className="ia-row ia-foot">
              <button className="ia-link" onClick={() => { setStatus(""); setPhase("home"); }}>Back</button>
              <button className="ia-link" onClick={eraseAll}>Erase all data</button>
            </div>
          )}
          {status && <div className="ia-status">{status}</div>}
        </div>
        <AdFooter />
      </div>
    );
  }

  // home
  const ready = !!active?.count;
  return (
    <div className="ia">
      <Header chip={ready ? { label: "Ready", kind: "ready" } : { label: "Setup" }} />
      <div className="ia-body">
        <h1 className="ia-h1">Who's travelling?</h1>
        <div className="ia-people" role="radiogroup" aria-label="Traveller">
          {travellers.map((t) => (
            <div key={t.id} className={`ia-person ${t.id === activeId ? "on" : ""}`}>
              <button role="radio" aria-checked={t.id === activeId} className="ia-person-pick" onClick={() => select(t.id)}>
                <span className="ia-dot" />
                <span className="ia-person-name">{t.label}</span>
                <span className="ia-person-meta">{t.count ? `${t.count} answers` : "not learned yet"}</span>
              </button>
              <button className="ia-x" aria-label={`Delete ${t.label}`} title="Delete" onClick={() => remove(t)}>×</button>
            </div>
          ))}
          <button className="ia-person-add" onClick={() => { setStatus(""); setPhase("add"); }}>+ Add traveller</button>
        </div>

        {!ready ? (
          <button className="ia-btn ia-btn-primary" onClick={() => startLearning()}>
            Learn {active?.label}'s answers{onForm ? "" : " — opens the form"}
          </button>
        ) : onForm ? (
          <button className="ia-btn ia-btn-primary" onClick={fill} disabled={filling}>
            {filling ? "Filling…" : `Fill this page as ${active?.label}`}
          </button>
        ) : (
          <button className="ia-btn ia-btn-primary" onClick={openForm}>Open the arrival card form</button>
        )}
        <p className="ia-note-muted">
          {ready
            ? "Press Fill on each page of the form. You check every answer and press Next and Submit yourself."
            : "Fill the form once as usual. Answers are remembered for next time."}
        </p>
        {status && <div className="ia-status">{status}</div>}

        <div className="ia-row ia-foot">
          {ready ? <button className="ia-link" onClick={() => startLearning()}>Teach {active?.label} more</button> : <span />}
          <button className="ia-link" onClick={eraseAll}>Erase all data</button>
        </div>
      </div>
      <AdFooter />
    </div>
  );
}

export function App() {
  return (
    <ConsentGate>
      <Main />
    </ConsentGate>
  );
}
