// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shutDownLastLoad } from "../../test/isolate";

let store: Record<string, unknown>;
let sent: { type: string; fields?: { key: string; value: string }[]; travellerId?: string }[];
let onMessage: (m: { type: string }, s: unknown, r: (x: unknown) => void) => boolean;
let storageChanged: (changes: Record<string, { newValue?: unknown }>, area: string) => void;

async function load(initial: Record<string, unknown> = {}) {
  shutDownLastLoad();
  vi.resetModules();
  store = initial; sent = [];
  (globalThis as any).chrome = {
    storage: {
      local: { get: async () => store, set: async (o: Record<string, unknown>) => Object.assign(store, o) },
      onChanged: { addListener: (fn: typeof storageChanged) => { storageChanged = fn; } },
    },
    runtime: { sendMessage: async (m: (typeof sent)[number]) => { sent.push(m); return { ok: true }; }, onMessage: { addListener: (fn: typeof onMessage) => { onMessage = fn; } } },
  };
  const bus = await import("../bus");
  await import("./recorder");
  return bus;
}
const flushed = () => new Promise<{ fields: { key: string; value: string }[] }>(r => onMessage({ type: "FLUSH_RECORDING" }, null, x => r(x as never)));
/** A recording already under way when the content script starts. */
async function recordingLoaded() {
  await load({ th_recording_draft: { active: true, fields: [] } });
  await new Promise(r => setTimeout(r));
}

beforeEach(() => {
  history.replaceState({}, "", "#/tac/arrival-card/add");
  document.body.innerHTML = `
   <div sit-validate-input="firstName"><input id="first" value=""></div>
   <div sit-validate-input="visaNo"><input id="visa" value="ALREADY-THERE"></div>
   <div sit-validate-input="fileNameOriginal"><input id="file" value=""></div>
   <div sit-validate-input="ddcCountrys"><sit-chip-autocomplete id="chips"><input id="chip-input"></sit-chip-autocomplete></div>
   <div sit-validate-input="traPurposeDesc"><mat-select id="purpose"><span id="v" class="mat-mdc-select-value-text"></span></mat-select></div>`;
});

const type = (id: string, value: string) => {
  const el = document.getElementById(id) as HTMLInputElement; el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("recording", () => {
  it("forgets both fields when two are emptied before the next re-read", async () => {
    await recordingLoaded();
    type("first", "ALEX");
    type("visa", "V1");
    await new Promise(r => setTimeout(r, 300));
    type("first", "");
    type("visa", "");
    const { fields } = await flushed();
    expect(fields.filter(f => f.key === "firstName" || f.key === "visaNo").map(f => [f.key, f.value, (f as { cleared?: boolean }).cleared])).toEqual([["firstName", "", true], ["visaNo", "", true]]);
  });
});

describe("recording, whose answers", () => {
  const setDraft = (draft: unknown) => { store.th_recording_draft = draft; storageChanged({ th_recording_draft: { newValue: draft } }, "local"); };
  const focus = (id: string) => document.getElementById(id)!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  const click = (id: string) => document.getElementById(id)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const later = (ms = 300) => new Promise(r => setTimeout(r, ms));
  const drafted = () => (store.th_recording_draft as { fields: { key: string; value: string }[] }).fields.map(f => [f.key, f.value]);

  it("doesn't take a value already on the form from focus or a click alone", async () => {
    await recordingLoaded();
    focus("visa"); click("visa"); document.getElementById("visa")!.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect((await flushed()).fields).toEqual([]);
  });

  it("takes it once the user changes it, even back to what it was", async () => {
    await recordingLoaded();
    focus("visa");
    type("visa", "NEW");
    type("visa", "ALREADY-THERE");
    expect((await flushed()).fields.map(f => [f.key, f.value])).toEqual([["visaNo", "ALREADY-THERE"]]);
  });

  it("keeps writing the draft for a second traveller after Done on the panel", async () => {
    const { emit, SAVE_RECORDING } = await load({ th_recording_draft: { active: true, fields: [], travellerId: "a" } });
    await later(0);
    type("first", "ANN");
    emit(SAVE_RECORDING);
    await later(0);
    setDraft(undefined);
    setDraft({ active: true, fields: [], travellerId: "b" });
    type("first", "BEA");
    await later();
    expect(drafted()).toEqual([["firstName", "BEA"]]);
  });

  it("doesn't let a panel click arm the save timer or count as a field", async () => {
    await recordingLoaded();
    const host = document.createElement("div"); host.id = "thaiarrival-panel"; document.body.append(host);
    host.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await later();
    expect(drafted()).toEqual([]);
  });

  it("starts clean when the recording moves to another traveller", async () => {
    await load({ th_recording_draft: { active: true, fields: [], travellerId: "a" } });
    await later(0);
    type("first", "ANN");
    setDraft({ active: true, fields: [], travellerId: "b" });
    expect((await flushed()).fields).toEqual([]);
  });

  it("never overwrites another tab's answers with what this tab's form shows", async () => {
    await load({ th_recording_draft: { active: true, travellerId: "a", fields: [{ key: "visaNo", kind: "text", value: "A-VISA" }] } });
    await later(0);
    // This tab's form shows someone else's visa number, and the user hasn't touched it.
    expect((await flushed()).fields.map(f => [f.key, f.value])).toEqual([["visaNo", "A-VISA"]]);
    window.dispatchEvent(new Event("pagehide"));
    await later(0);
    expect(drafted()).toEqual([["visaNo", "A-VISA"]]);
  });

  it("takes another tab's newer answer, unless this tab changed that field itself", async () => {
    await load({ th_recording_draft: { active: true, travellerId: "a", fields: [{ key: "visaNo", kind: "text", value: "OLD" }, { key: "firstName", kind: "text", value: "OLD" }] } });
    await later(0);
    type("first", "MINE");
    setDraft({ active: true, travellerId: "a", fields: [{ key: "visaNo", kind: "text", value: "NEWER" }, { key: "firstName", kind: "text", value: "THEIRS" }] });
    expect((await flushed()).fields.map(f => [f.key, f.value]).sort()).toEqual([["firstName", "MINE"], ["visaNo", "NEWER"]]);
  });

  it("doesn't bring back its old answer after another tab changed that field", async () => {
    await load({ th_recording_draft: { active: true, travellerId: "a", fields: [] } });
    await later(0);
    type("first", "MINE");
    await later();
    setDraft({ active: true, travellerId: "a", fields: [{ key: "firstName", kind: "text", value: "THEIRS" }] });
    type("visa", "V1");
    await later();
    expect(drafted().sort()).toEqual([["firstName", "THEIRS"], ["visaNo", "V1"]]);
  });

  it("doesn't forget the last answer when the site blanks the form", async () => {
    await recordingLoaded();
    type("first", "ANN");
    focus("visa"); type("visa", "V1");
    (document.getElementById("first") as HTMLInputElement).value = "";
    (document.getElementById("visa") as HTMLInputElement).value = "";
    const { fields } = await flushed();
    expect(fields.filter(f => (f as { cleared?: boolean }).cleared)).toEqual([]);
    expect(fields.map(f => [f.key, f.value])).toEqual([["firstName", "ANN"], ["visaNo", "V1"]]);
  });

  it("stops learning when the form moves to someone else, and keeps what it had", async () => {
    const { bus, PERSON_CHANGED } = await load({ th_recording_draft: { active: true, fields: [], travellerId: "a" } });
    const told = vi.fn(); bus.addEventListener(PERSON_CHANGED, told);
    await later(0);
    type("first", "ANN");
    (document.getElementById("first") as HTMLInputElement).value = "BEA"; // no input event: the site did this
    type("visa", "BEA-VISA");
    expect(told).toHaveBeenCalledOnce();
    expect((await flushed()).fields.map(f => [f.key, f.value])).toEqual([["firstName", "ANN"]]);
  });

  it("isn't fooled by the site changing the case of a name", async () => {
    const { bus, PERSON_CHANGED } = await load({ th_recording_draft: { active: true, fields: [], travellerId: "a" } });
    const told = vi.fn(); bus.addEventListener(PERSON_CHANGED, told);
    await later(0);
    type("first", "ann");
    (document.getElementById("first") as HTMLInputElement).value = "ANN";
    type("visa", "V1");
    expect(told).not.toHaveBeenCalled();
    expect((await flushed()).fields.map(f => f.value)).toEqual(["ANN", "V1"]);
  });
});

describe("last page", () => {
  it("keeps learning there: a page without name boxes isn't another person", async () => {
    const { bus, PERSON_CHANGED } = await load({ th_recording_draft: { active: true, fields: [], travellerId: "a" } });
    const told = vi.fn(); bus.addEventListener(PERSON_CHANGED, told);
    await new Promise(r => setTimeout(r));
    type("first", "ANN");
    history.replaceState({}, "", "#/tac/arrival-card/add/preview/abc");
    document.body.innerHTML = `<div sit-validate-input="sendTo"><input id="email"></div>
      <div><mat-checkbox formcontrolname="checkedDecalraion"><input id="agree" type="checkbox"></mat-checkbox></div>`;
    type("email", "ann@example.com");
    // The site takes the tick back, then sets it when Agree is pressed in its window.
    const box = document.getElementById("agree") as HTMLInputElement;
    box.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    box.checked = true;
    expect(told).not.toHaveBeenCalled();
    expect((await flushed()).fields.map(f => [f.key, f.value])).toEqual([["firstName", "ANN"], ["sendTo", "ann@example.com"], ["agreedTerms", "checked"]]);
  });
});

describe("corrections", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML("afterbegin", '<div sit-validate-input="familyName"><input id="family" value="TAN"></div><div sit-validate-input="passportNo"><input id="pass" value="K0000000X"></div>');
  });
  const wait = () => new Promise(r => setTimeout(r, 650));
  it("never file one traveller's quick edit under the next one filled", async () => {
    const { emit, REPLAYED, REPLAY_START, REPLAY_END } = await load();
    emit(REPLAYED, "alex");
    type("visa", "ALEX-VISA");
    emit(REPLAY_START); emit(REPLAY_END); emit(REPLAYED, "bea");
    type("first", "BEA");
    await wait();
    expect(sent.flatMap(m => m.fields ?? []).map(f => [f.key, f.value])).toEqual([["firstName", "BEA"]]);
    expect(sent.map(m => m.travellerId)).toEqual(["bea"]);
  });
  it("stop when the site resets the form for another traveller", async () => {
    const { emit, REPLAYED } = await load();
    emit(REPLAYED, "alex");
    (document.getElementById("family") as HTMLInputElement).value = "";
    (document.getElementById("pass") as HTMLInputElement).value = "";
    type("pass", "BEA-PASSPORT");
    await wait();
    type("first", "BEA");
    await wait();
    expect(sent).toEqual([]);
  });
  it("stop when the site loads another traveller into the form", async () => {
    const { emit, REPLAYED } = await load();
    emit(REPLAYED, "alex");
    (document.getElementById("pass") as HTMLInputElement).value = "OTHER";
    type("first", "BEA");
    await wait();
    expect(sent).toEqual([]);
  });
  it("still accept the traveller's own passport fix, and later edits", async () => {
    const { emit, REPLAYED } = await load();
    emit(REPLAYED, "alex");
    type("pass", "K1111111X");
    await wait();
    type("first", "ALEX");
    await wait();
    expect(sent.map(m => m.fields?.[0].key)).toEqual(["passportNo", "firstName"]);
  });
});

describe("recorder", () => {
  it("saves only fields the user touched, and never a certificate file", async () => {
    await recordingLoaded();
    type("first", "ALEX"); type("file", "C:\\passport.jpg");
    const res = await flushed();
    expect(res.fields.map(f => [f.key, f.value])).toEqual([["firstName", "ALEX"]]);
  });
  const chip = (name: string) => `<mat-chip-row><span class="mdc-evolution-chip__text-label">${name}</span><button class="x"></button></mat-chip-row>`;
  const chipBox = () => document.getElementById("chips")!;
  it("learns countries picked from the popup list, and adds later ones", async () => {
    await recordingLoaded();
    document.getElementById("chip-input")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    chipBox().insertAdjacentHTML("afterbegin", chip("SINGAPORE"));
    expect((await flushed()).fields.map(f => [f.key, f.value])).toEqual([["ddcCountrys", "SINGAPORE"]]);
    chipBox().insertAdjacentHTML("afterbegin", chip("SWEDEN"));
    expect((await flushed()).fields.map(f => f.value)).toEqual(["SWEDEN; SINGAPORE"]);
  });
  it("forgets the countries when the user removes the last one, not when the site blanks the form", async () => {
    await recordingLoaded();
    document.getElementById("chip-input")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    chipBox().insertAdjacentHTML("afterbegin", chip("SINGAPORE"));
    await flushed();
    chipBox().querySelector("mat-chip-row")!.remove();
    expect((await flushed()).fields.map(f => f.value)).toEqual(["SINGAPORE"]);
    chipBox().insertAdjacentHTML("afterbegin", chip("SINGAPORE"));
    await flushed();
    chipBox().querySelector(".x")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    chipBox().querySelector("mat-chip-row")!.remove();
    expect((await flushed()).fields).toEqual([expect.objectContaining({ key: "ddcCountrys", value: "", cleared: true })]);
  });
  it("forgets an answer the user emptied, but not a blank field they only clicked", async () => {
    await recordingLoaded();
    document.getElementById("visa")!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    type("visa", "");
    expect((await flushed()).fields).toEqual([expect.objectContaining({ key: "visaNo", value: "", cleared: true })]);
    document.getElementById("first")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect((await flushed()).fields.map(f => f.key)).toEqual(["visaNo"]);
  });
  it("re-reads a select after its option is picked in the popup", async () => {
    await recordingLoaded();
    document.getElementById("purpose")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.getElementById("v")!.textContent = "HOLIDAY";
    const res = await flushed();
    expect(res.fields).toEqual([expect.objectContaining({ key: "traPurposeDesc", value: "HOLIDAY" })]);
  });
  it("learns nothing from a hand-filled form unless Fill ran first, then updates that traveller", async () => {
    const { emit, REPLAYED } = await load();
    await new Promise(r => setTimeout(r));
    type("first", "NOPE");
    await new Promise(r => setTimeout(r, 650));
    expect(sent).toEqual([]);
    emit(REPLAYED, "t1");
    type("first", "ALEX");
    await new Promise(r => setTimeout(r, 650));
    expect(sent[0]).toMatchObject({ type: "LEARN_UPDATE", travellerId: "t1", fields: [{ key: "firstName", value: "ALEX" }] });
  });
});
