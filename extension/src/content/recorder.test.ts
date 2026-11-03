// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { shutDownLastLoad } from "../test/isolate";
import { DRAFT_KEY } from "../lib/keys";

// jsdom has no CSS.escape; the recorder uses it for label lookup.
(globalThis as any).CSS ??= { escape: (s: string) => s };

type Listener = (msg: { type: string }, sender: unknown, respond: (r: any) => void) => void;
const STEP1 = "/arrival-card-submission/personal-information";
/** The real declaration page's shape: no ids, questions in <p>, a div tick box. */
const option = (v: string) => `<div><div><div></div></div><div></div><input readonly value="${v}"></div>`;
const DECLARATION = `<form>
  <div><p>Do you currently have any symptoms?</p><div></div><div>${option("Yes")}${option("No")}</div></div>
  <p>Do you carry goods that must be declared to Customs?</p><div></div><div><div><p>Click here to view the list.</p><div><div><svg></svg></div></div></div></div>
  <div></div><div><div>${option("Yes")}${option("No")}</div></div>
  <div id="tick"><div></div><div></div><p>I, the Applicant hereby certify that I understand and agree</p></div></form>`;

/** Minimal chrome stub: a storage.local that outlives the "page" (module reload). */
function installChrome(store: Record<string, unknown>) {
  const messageListeners: Listener[] = [];
  const changeListeners: ((c: Record<string, { newValue?: unknown }>, area: string) => void)[] = [];
  const sent: any[] = [];
  (globalThis as any).chrome = {
    runtime: {
      onMessage: { addListener: (l: Listener) => messageListeners.push(l) },
      sendMessage: async (m: unknown) => { sent.push(m); return { ok: true, saved: 1 }; },
    },
    storage: {
      local: {
        get: async (k: string) => (k in store ? { [k]: structuredClone(store[k]) } : {}),
        set: async (items: Record<string, unknown>) => {
          Object.assign(store, structuredClone(items));
          const changes = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, { newValue: v }]));
          changeListeners.forEach((l) => l(changes, "local"));
        },
      },
      onChanged: { addListener: (l: (typeof changeListeners)[number]) => changeListeners.push(l) },
    },
  };
  const send = (type: string) => new Promise<any>((resolve) => messageListeners.forEach((l) => l({ type }, null, resolve)));
  const setDraft = (draft: unknown) => {
    if (draft) store[DRAFT_KEY] = draft; else delete store[DRAFT_KEY];
    changeListeners.forEach((l) => l({ [DRAFT_KEY]: { newValue: draft ?? undefined } }, "local"));
  };
  return { send, setDraft, sent };
}

function type(id: string, value: string) {
  let el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) { el = document.createElement("input"); el.id = id; document.body.append(el); }
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Load the content script as a fresh page would. */
async function loadPage(store: Record<string, unknown>) {
  shutDownLastLoad();
  vi.resetModules();
  const page = installChrome(store);
  await import("./recorder");
  await Promise.resolve(); // let the initial draft read resolve
  return page;
}

async function settle() {
  vi.advanceTimersByTime(700);
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

beforeEach(() => {
  document.body.innerHTML = "";
  history.replaceState({}, "", STEP1);
  vi.useFakeTimers();
});

describe("recording", () => {
  it("keeps what was learned across a full page load mid-recording", async () => {
    const store: Record<string, unknown> = { [DRAFT_KEY]: { active: true, fields: [], travellerId: "t1" } };
    await loadPage(store);
    type("spi_full_name_1782107186388", "ALEX");
    await settle();
    expect((store[DRAFT_KEY] as any).travellerId).toBe("t1");

    history.replaceState({}, "", "/arrival-card-submission/mode-of-transport");
    document.body.innerHTML = "";
    const step2 = await loadPage(store);
    type("smta_flight_no_foreigner", "SQ950");
    const res = await step2.send("FLUSH_RECORDING");
    expect(res.fields.map((f: { value: string }) => f.value).sort()).toEqual(["ALEX", "SQ950"]);
  });

  it("does not copy values already on the page that the user didn't touch", async () => {
    document.body.innerHTML = '<input id="spi_email_1" value="previous@traveller.com">';
    const store: Record<string, unknown> = {};
    const page = await loadPage(store);
    page.setDraft({ active: true, fields: [], travellerId: "t2" });
    type("spi_full_name_1", "BEA");
    const res = await page.send("FLUSH_RECORDING");
    expect(res.fields.map((f: { value: string }) => f.value)).toEqual(["BEA"]);
  });

  it("stops recording when the draft is cleared from elsewhere", async () => {
    const store: Record<string, unknown> = {};
    const page = await loadPage(store);
    page.setDraft({ active: true, fields: [] });
    type("spi_full_name_1", "ALEX");
    page.setDraft(undefined);
    type("spi_email_1", "a@b.c");
    const res = await page.send("FLUSH_RECORDING");
    expect(res.fields).toEqual([]);
  });

  it("takes another tab's answer in a new recording, on a field touched in the last one", async () => {
    const store: Record<string, unknown> = {};
    const page = await loadPage(store);
    page.setDraft({ active: true, fields: [], travellerId: "t1" });
    type("spi_full_name_1", "ANN");
    const [field] = (await page.send("FLUSH_RECORDING")).fields;
    page.setDraft(undefined);
    page.setDraft({ active: true, fields: [{ ...field, value: "BEA" }], travellerId: "t2" });
    expect((await page.send("FLUSH_RECORDING")).fields.map((f: { value: string }) => f.value)).toEqual(["BEA"]);
  });

  it("starts clean when the recording moves straight to another traveller", async () => {
    const store: Record<string, unknown> = {};
    const page = await loadPage(store);
    page.setDraft({ active: true, fields: [], travellerId: "t1" });
    type("spi_full_name_1", "ANN");
    const [field] = (await page.send("FLUSH_RECORDING")).fields;
    page.setDraft({ active: true, fields: [{ ...field, value: "BEA" }], travellerId: "t2" });
    expect((await page.send("FLUSH_RECORDING")).fields.map((f: { value: string }) => f.value)).toEqual(["BEA"]);
    type("spi_email_1", "bea@example.com");
    expect((await page.send("FLUSH_RECORDING")).fields.map((f: { value: string }) => f.value).sort()).toEqual(["BEA", "bea@example.com"]);
  });

  it("doesn't bring back its old answer after another tab changed that field", async () => {
    const store: Record<string, unknown> = { [DRAFT_KEY]: { active: true, fields: [], travellerId: "t1" } };
    const page = await loadPage(store);
    type("spi_full_name_1", "MINE");
    await settle();
    const [field] = (store[DRAFT_KEY] as { fields: { value: string }[] }).fields;
    page.setDraft({ active: true, fields: [{ ...field, value: "THEIRS" }], travellerId: "t1" });
    type("spi_email_1", "a@example.com");
    await settle();
    expect((store[DRAFT_KEY] as { fields: { value: string }[] }).fields.map(f => f.value).sort()).toEqual(["THEIRS", "a@example.com"]);
  });

  it("re-reads a dropdown picked without an input/change event", async () => {
    history.replaceState({}, "", "/arrival-card-submission/mode-of-transport");
    const store: Record<string, unknown> = {};
    const page = await loadPage(store);
    page.setDraft({ active: true, fields: [] });
    document.body.innerHTML = '<label for="smta_place_of_arrival_air_foreigner">Port of Entry</label><input id="smta_place_of_arrival_air_foreigner" readonly value="Select port"><div id="option">SOEKARNO HATTA</div>';
    const port = document.querySelector<HTMLInputElement>("input")!;
    port.click();
    port.value = "SOEKARNO HATTA"; // React updates the readonly value after the option click
    document.querySelector<HTMLElement>("#option")!.click();
    await settle();
    const draft = store[DRAFT_KEY] as { fields: { value: string; label: string }[] };
    expect(draft.fields).toContainEqual(expect.objectContaining({ value: "SOEKARNO HATTA", label: "Port of Entry" }));
  });

  it("records the declaration page's id-less questions and tick box, but no page outside the form", async () => {
    history.replaceState({}, "", "/arrival-card-submission/declaration");
    document.body.innerHTML = DECLARATION;
    const store: Record<string, unknown> = {};
    const page = await loadPage(store);
    page.setDraft({ active: true, fields: [] });
    const no = [...document.querySelectorAll<HTMLInputElement>("input[readonly]")].filter(i => i.value === "No");
    no[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const box = document.querySelector<HTMLElement>("#tick > div")!;
    box.addEventListener("click", () => { box.innerHTML = "<svg></svg>"; });
    box.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    history.replaceState({}, "", "/");
    type("site_language", "EN");
    history.replaceState({}, "", "/arrival-card-submission/declaration");
    const r = await page.send("FLUSH_RECORDING");
    expect(r.fields.map((f: { selector: string; value: string; control: string }) => [f.control, f.selector, f.value])).toEqual([
      ["choice", "@q:Do you carry goods that must be declared to Customs?", "No"],
      ["tick", "@q:I, the Applicant hereby certify that I understand and agree", "checked"],
    ]);
  });
});

describe("corrections after Fill", () => {
  it("teaches nothing when the form is filled by hand without Fill", async () => {
    const page = await loadPage({});
    type("spi_passport_no_1", "SPOUSE123");
    await settle();
    expect(page.sent).toEqual([]);
  });

  it("sends a correction for the traveller that was filled, tagged with their id", async () => {
    const page = await loadPage({});
    const { emit, REPLAYED } = await import("./bus");
    emit(REPLAYED, "alex-id");
    type("spi_passport_no_1", "NEW123");
    await settle();
    expect(page.sent).toEqual([expect.objectContaining({ type: "LEARN_UPDATE", travellerId: "alex-id", fields: [expect.objectContaining({ value: "NEW123" })] })]);
  });
});
