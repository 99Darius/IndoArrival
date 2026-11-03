import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ad } from "./ads";

const BOTH: Ad[] = ["rumah123", "theasianparent"];
const TAP_ONLY: Ad[] = ["theasianparent"];

let store: Record<string, unknown>;

/** A popup opening: the module, and so the turn, starts fresh. */
async function open() {
  vi.resetModules();
  return (await import("./ads")).adForThisOpen;
}

beforeEach(() => {
  store = {};
  (globalThis as any).chrome = {
    storage: { local: { get: async () => store, set: async (o: Record<string, unknown>) => Object.assign(store, o) } },
  };
});

describe("adForThisOpen", () => {
  it("takes turns each time the popup opens", async () => {
    const seen = [];
    for (let i = 0; i < 4; i++) seen.push(await (await open())(BOTH));
    expect(seen).toEqual(["rumah123", "theasianparent", "rumah123", "theasianparent"]);
  });

  it("always shows the only ad a country has", async () => {
    const seen = [];
    for (let i = 0; i < 3; i++) seen.push(await (await open())(TAP_ONLY));
    expect(seen).toEqual(["theasianparent", "theasianparent", "theasianparent"]);
  });

  it("keeps the same ad while the popup stays open", async () => {
    const ad = await open();
    expect([await ad(BOTH), await ad(BOTH), await ad(BOTH)]).toEqual(["rumah123", "rumah123", "rumah123"]);
    expect(store.ad_turn).toBe(1);
  });

  it("never shows a country another country's ad when switching in one open popup", async () => {
    const ad = await open();
    expect(await ad(BOTH)).toBe("rumah123");
    expect(await ad(TAP_ONLY)).toBe("theasianparent");
    expect(store.ad_turn).toBe(1);
  });

  it("copes with a bad saved counter", async () => {
    store.ad_turn = "nonsense";
    expect(await (await open())(BOTH)).toBe("rumah123");
    store.ad_turn = 7;
    expect(await (await open())(BOTH)).toBe("theasianparent");
  });

  it("still shows an ad when storage fails", async () => {
    (globalThis as any).chrome.storage.local.get = async () => { throw new Error("no storage"); };
    expect(await (await open())(BOTH)).toBe("rumah123");
  });
});
