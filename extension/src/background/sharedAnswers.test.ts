import { beforeEach, describe, expect, it } from "vitest";
import { closeOffer, offersFor, reopenOffer } from "./sharedAnswers";
import { wipeAll, PROFILES_KEY } from "./localStore";
import { DRAFT_KEY, SHARED_CLOSED_KEY } from "../lib/keys";
import * as TH from "../lib/keysTh";

const P1 = "/arrival-card-submission/personal-information";
const indoPerson = (id: string, label: string, passport: string) => ({ id, label, values: {}, learned: [
  { selector: '[id^="spi_passport_no_"]', control: "text", value: passport, step: P1 },
  { selector: '[id^="smta_flight_no_"]', control: "text", value: "123", step: "/arrival-card-submission/mode-of-transport" },
] });

let store: Record<string, unknown>;
beforeEach(() => {
  store = {
    [PROFILES_KEY]: [indoPerson("i-mei", "Mei", "M1111111X"), indoPerson("i-alex", "ALEX", "K0000000X")],
    [TH.PROFILES_KEY]: [{ id: "t-alex", label: "Alex", learned: [] }, { id: "t-other", label: "Other", learned: [] }],
    [TH.DRAFT_KEY]: { active: true, fields: [], travellerId: "t-alex" },
  };
  (globalThis as any).chrome = { storage: { local: {
    get: async (keys: string | string[]) => Object.fromEntries([keys].flat().filter((k) => k in store).map((k) => [k, structuredClone(store[k])])),
    set: async (items: Record<string, unknown>) => { Object.assign(store, structuredClone(items)); },
    remove: async (keys: string | string[]) => { for (const k of [keys].flat()) delete store[k]; },
  } } };
});

describe("shared answers", () => {
  it("offers the other country's travellers, the same name first", async () => {
    const { offers } = await offersFor("th", "t-alex");
    expect(offers.map((o) => [o.label, o.fromCountry])).toEqual([["ALEX", "Indonesia"], ["Mei", "Indonesia"]]);
    expect(offers[0].items.map((i) => i.value)).toEqual(["K0000000X"]);
  });

  it("copies nothing by itself", async () => {
    const before = JSON.stringify(store);
    await offersFor("th", "t-alex");
    expect(JSON.stringify(store)).toBe(before);
  });

  it("offers only for the traveller being recorded, and only while recording", async () => {
    expect((await offersFor("th", "t-other")).offers).toEqual([]);
    store[TH.DRAFT_KEY] = { active: false, fields: [], travellerId: "t-alex" };
    expect((await offersFor("th", "t-alex")).offers).toEqual([]);
  });

  it("leaves out what the traveller already answered on this form", async () => {
    store[TH.PROFILES_KEY] = [{ id: "t-alex", label: "Alex", learned: [{ key: "passportNo", kind: "text", value: "E9999999Z" }] }];
    expect((await offersFor("th", "t-alex")).offers).toEqual([]);
  });

  it("asks once per traveller per form, and Erase all data forgets that", async () => {
    await closeOffer("th", "t-alex");
    expect((await offersFor("th", "t-alex")).offers).toEqual([]);
    expect(store[SHARED_CLOSED_KEY]).toEqual(["th:t-alex"]);
    store.consent = { accepted: true, at: "x", version: 2 };
    await wipeAll();
    expect(store[SHARED_CLOSED_KEY]).toBeUndefined();
    expect(store[TH.PROFILES_KEY]).toBeUndefined();
    expect(store.consent).toBeUndefined();
  });

  it("comes back if the recording it was used in is cancelled", async () => {
    await closeOffer("th", "t-alex");
    await reopenOffer("th", "t-alex");
    expect((await offersFor("th", "t-alex")).offers).toHaveLength(2);
  });

  it("works the other way too", async () => {
    store[TH.PROFILES_KEY] = [{ id: "t-alex", label: "Alex", learned: [{ key: "passportNo", kind: "text", value: "K0000000X" }] }];
    store[PROFILES_KEY] = [{ id: "i-new", label: "Alex", values: {}, learned: [] }];
    store[DRAFT_KEY] = { active: true, fields: [], travellerId: "i-new" };
    const { offers } = await offersFor("id", "i-new");
    expect(offers[0].fromCountry).toBe("Thailand");
    expect(offers[0].items[0].answers).toMatchObject([{ selector: '[id^="spi_passport_no_"]', value: "K0000000X", step: P1 }]);
  });
});
