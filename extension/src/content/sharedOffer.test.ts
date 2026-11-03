// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOffer } from "./sharedOffer";

const item = (label: string, value: string) => ({ key: "passportNo", label, value, answers: [{ key: label, value }] });
const OFFERS = [{ fromId: "a", label: "Alex", fromCountry: "Indonesia", items: [item("Passport number", "K0000000X")] }];

let sent: Record<string, unknown>[];
function setup(offers: unknown[] = OFFERS, use = vi.fn(async () => ({ filled: 1, text: "1 filled" }))) {
  sent = [];
  (globalThis as any).chrome = { runtime: { sendMessage: async (m: Record<string, unknown>) => { sent.push(m); return m.type === "GET_SHARED" ? { ok: true, offers } : { ok: true }; } } };
  const say = vi.fn();
  return { offer: createOffer({ country: "th", use, say }), use, say };
}
const settle = () => new Promise((r) => setTimeout(r));
const buttons = (el: HTMLElement) => [...el.querySelectorAll("button")];

beforeEach(() => { document.body.innerHTML = ""; });

describe("saved-records offer", () => {
  it("shows the values and fills nothing until asked", async () => {
    const { offer, use } = setup();
    offer.update("t1", true); await settle();
    expect(offer.el.hidden).toBe(false);
    expect(offer.el.textContent).toContain("We saw these in your saved records");
    expect(offer.el.textContent).toContain("Alex (Indonesia)");
    expect(offer.el.textContent).toContain("K0000000X");
    expect(use).not.toHaveBeenCalled();
  });

  it("using it fills, reports, and doesn't ask again", async () => {
    const { offer, use, say } = setup();
    offer.update("t1", true); await settle();
    buttons(offer.el).find((b) => b.textContent === "Use Alex's")!.click(); await settle();
    expect(use).toHaveBeenCalledWith(OFFERS[0].items);
    expect(say).toHaveBeenLastCalledWith("1 filled");
    expect(sent.at(-1)).toMatchObject({ type: "CLOSE_SHARED", country: "th", travellerId: "t1" });
    expect(offer.el.hidden).toBe(true);
    offer.update("t1", true);
    expect(offer.el.hidden).toBe(true);
  });

  it("No thanks closes without filling", async () => {
    const { offer, use } = setup();
    offer.update("t1", true); await settle();
    buttons(offer.el).find((b) => b.textContent === "No thanks")!.click(); await settle();
    expect(use).not.toHaveBeenCalled();
    expect(sent.at(-1)).toMatchObject({ type: "CLOSE_SHARED" });
    expect(offer.el.hidden).toBe(true);
  });

  it("a failed fill can be tried again, and isn't marked as asked", async () => {
    const { offer, say } = setup(OFFERS, vi.fn(async () => { throw new Error("no"); }));
    offer.update("t1", true); await settle();
    buttons(offer.el)[0].click(); await settle();
    expect(say.mock.calls.at(-1)?.[0]).toContain("Couldn't fill");
    expect(sent.some((m) => m.type === "CLOSE_SHARED")).toBe(false);
    expect(buttons(offer.el)[0].disabled).toBe(false);
  });

  it("stays up if nothing could be filled", async () => {
    const { offer } = setup(OFFERS, vi.fn(async () => ({ filled: 0, text: "0 filled" })));
    offer.update("t1", true); await settle();
    buttons(offer.el)[0].click(); await settle();
    expect(sent.some((m) => m.type === "CLOSE_SHARED")).toBe(false);
    expect(offer.el.hidden).toBe(false);
    expect(buttons(offer.el)[0].disabled).toBe(false);
  });

  it("asks afresh for the next recording, so deleted records are never offered from memory", async () => {
    const { offer } = setup();
    offer.update("t1", true); await settle();
    offer.update(undefined, true);
    offer.update("t1", true); await settle();
    expect(sent.filter((m) => m.type === "GET_SHARED")).toHaveLength(2);
  });

  it("stays out of the way off the first step, with nothing to offer, or when not learning", async () => {
    const { offer } = setup();
    offer.update("t1", false); await settle();
    expect(offer.el.hidden).toBe(true);
    offer.update("t1", true);
    expect(offer.el.hidden).toBe(false);
    offer.update(undefined, true);
    expect(offer.el.hidden).toBe(true);
    const none = setup([]);
    none.offer.update("t2", true); await settle();
    expect(none.offer.el.hidden).toBe(true);
    expect(sent.filter((m) => m.type === "GET_SHARED")).toHaveLength(1);
  });

  it("names each person when there's a choice of records", async () => {
    const { offer } = setup([...OFFERS, { ...OFFERS[0], fromId: "b", label: "Mei" }]);
    offer.update("t1", true); await settle();
    expect(buttons(offer.el).map((b) => b.textContent)).toEqual(["Use Alex's", "Use Mei's", "No thanks"]);
  });
});
