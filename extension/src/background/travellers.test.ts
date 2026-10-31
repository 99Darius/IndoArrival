import { describe, it, expect, beforeEach } from "vitest";
import { addTraveller, learnUpdate, legacyToLearned, listTravellers, saveRecording, selectTraveller } from "./travellers";
import { ACTIVE_PROFILE_KEY, DRAFT_KEY, LEARNED_KEY } from "../lib/keys";
import { PROFILES_KEY } from "./localStore";

let store: Record<string, unknown>;
beforeEach(() => {
  store = {};
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: async (keys: string | string[]) => Object.fromEntries([keys].flat().filter((k) => k in store).map((k) => [k, structuredClone(store[k])])),
        set: async (items: Record<string, unknown>) => { Object.assign(store, structuredClone(items)); },
        remove: async (keys: string | string[]) => { for (const k of [keys].flat()) delete store[k]; },
      },
    },
  };
});

const P1 = "/arrival-card-submission/personal-information";
const P3 = "/arrival-card-submission/mode-of-transport";
const learned = (step: string, value: string, selector = `#${value}`) => ({ selector, control: "text", value, step });

describe("travellers", () => {
  it("turns an old saved profile into answers that can fill step 1", async () => {
    store[PROFILES_KEY] = [{ id: "r", label: "alex", values: { fullName: "ALEX T", gender: "FEMALE", nationality: "SINGAPORE", occupation: "X" } }];
    const res = await listTravellers();
    expect(res).toMatchObject({ activeId: "r", travellers: [{ label: "alex", count: 3 }] });
    const fill = store[LEARNED_KEY] as { control: string; value: string }[];
    expect(fill.map((f) => `${f.control}:${f.value}`).sort()).toEqual(["choice:FEMALE", "dropdown:SINGAPORE", "text:ALEX T"]);
  });

  it("files answers learned before travellers existed under a new traveller", async () => {
    store[LEARNED_KEY] = [learned(P1, "x")];
    const res = await listTravellers();
    expect(res.travellers).toMatchObject([{ label: "Me", count: 1 }]);
  });

  it("keeps each traveller's answers separate", async () => {
    store[PROFILES_KEY] = [{ id: "r", label: "alex", values: {} }];
    await listTravellers();
    store[DRAFT_KEY] = { active: true, fields: [], travellerId: "r" };
    await saveRecording([learned(P1, "alex", "#name")] as any);
    const { activeId: d } = await addTraveller("darius");
    expect(store[LEARNED_KEY]).toEqual([]);
    store[DRAFT_KEY] = { active: true, fields: [], travellerId: d };
    await saveRecording([learned(P1, "darius", "#name")] as any);
    await selectTraveller("r");
    expect((store[LEARNED_KEY] as any[])[0].value).toBe("alex");
    expect(store[ACTIVE_PROFILE_KEY]).toBe("r");
    await selectTraveller(d!);
    expect((store[LEARNED_KEY] as any[])[0].value).toBe("darius");
  });

  it("Done with nothing captured never wipes saved answers", async () => {
    store[PROFILES_KEY] = [{ id: "r", label: "alex", values: {}, learned: [learned(P1, "keep")] }];
    await listTravellers();
    store[DRAFT_KEY] = { active: true, fields: [], travellerId: "r" };
    expect(await saveRecording([])).toEqual({ saved: 0 });
    expect((store[LEARNED_KEY] as any[]).map((f) => f.value)).toEqual(["keep"]);
    expect(store[DRAFT_KEY]).toBeUndefined();
  });

  it("teaching more replaces only what was re-taught", async () => {
    store[PROFILES_KEY] = [{ id: "r", label: "alex", values: {}, learned: [learned(P1, "old", "#phone"), learned(P3, "SQ1", "#flight")] }];
    await listTravellers();
    store[DRAFT_KEY] = { active: true, fields: [], travellerId: "r" };
    await saveRecording([learned(P1, "new", "#phone")] as any);
    expect((store[LEARNED_KEY] as any[]).map((f) => f.value).sort()).toEqual(["SQ1", "new"]);
  });

  it("drops a correction meant for a traveller who is no longer selected", async () => {
    store[PROFILES_KEY] = [{ id: "a", label: "alex", values: {}, learned: [] }, { id: "b", label: "bea", values: {}, learned: [learned(P1, "bea", "#name")] }];
    await listTravellers();
    await selectTraveller("b");
    expect(await learnUpdate("a", [learned(P1, "alex", "#name")] as any)).toEqual({ saved: 0 });
    expect((store[LEARNED_KEY] as any[])[0].value).toBe("bea");
    expect(await learnUpdate("b", [learned(P1, "bea2", "#name")] as any)).toMatchObject({ saved: 1 });
    expect((store[LEARNED_KEY] as any[])[0].value).toBe("bea2");
  });

  it("maps only fields the field map can locate", () => {
    expect(legacyToLearned({ passportNo: "K1", occupation: "Dev", email: "" }).map((f) => f.value)).toEqual(["K1"]);
  });
});
