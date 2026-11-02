// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountFillButton } from "./fillButton";
import { DRAFT_KEY, LEARNED_KEY } from "../lib/keys";
import { bus, SAVE_RECORDING } from "./bus";

let root: ShadowRoot;
let onChanged: (changes: Record<string, { newValue?: unknown }>, area: string) => void;
beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = "";
  document.querySelector("#indoarrival-panel")?.remove();
  history.replaceState({}, "", "/arrival-card-submission/travel-details");
  const attach = HTMLElement.prototype.attachShadow;
  vi.spyOn(HTMLElement.prototype, "attachShadow").mockImplementation(function (this: HTMLElement, options) { root = attach.call(this, options); return root; });
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

function install(store: Record<string, unknown>) {
  (globalThis as any).chrome = { storage: {
    local: { get: async () => store },
    onChanged: { addListener: (fn: typeof onChanged) => { onChanged = fn; } },
  } };
}

describe("floating panel", () => {
  it("shows live labels/answers while learning and can save or minimize", async () => {
    install({ [DRAFT_KEY]: { active: true, fields: [] } });
    mountFillButton(); await Promise.resolve();
    expect(root.textContent).toContain("Remembering 0 fields");
    onChanged({ [DRAFT_KEY]: { newValue: { active: true, fields: [{ selector: "#permit", label: "KITAS number", control: "text", value: "TEST-123", step: location.pathname }] } } }, "local");
    expect(root.querySelector("li")?.textContent).toBe("KITAS numberTEST-123");
    expect(root.querySelector(".note")?.textContent).toContain("captured");
    const save = vi.fn(); bus.addEventListener(SAVE_RECORDING, save, { once: true });
    root.querySelector<HTMLButtonElement>(".action")!.click();
    expect(save).toHaveBeenCalledOnce();
    root.querySelector<HTMLButtonElement>("header button")!.click();
    expect((root.querySelector(".body") as HTMLElement).hidden).toBe(true);
    // Page scripts cannot read the private answers through the host.
    expect(document.querySelector("#indoarrival-panel")?.shadowRoot).toBeNull();
  });
  it("offers defaults on pages with no prior recorded fields and updates across routes", async () => {
    install({ [LEARNED_KEY]: [{ selector: "#name", control: "text", value: "TEST", step: "/arrival-card-submission/personal-information" }] });
    document.body.innerHTML = '<input id="std_arrival_date_foreigner_individual" readonly value="Select"><input id="std_departure_date_foreigner_individual">';
    mountFillButton(); await Promise.resolve();
    expect(root.querySelector("h2")?.textContent).toBe("I see 2 fields; I can fill 2");
    expect(root.textContent).toContain("14 days");
    history.replaceState({}, "", "/arrival-card-submission/declaration");
    document.body.innerHTML = '<input id="asd_total_baggage_individual">';
    vi.advanceTimersByTime(600);
    expect(root.querySelector("h2")?.textContent).toBe("I see 1 field; I can fill 1");
    expect(root.querySelector(".action")?.textContent).toBe("Fill this page (1)");
    expect(root.textContent).toContain("Baggage defaults to 0");
  });
});

describe("review ask", () => {
  it("shows after the 3rd card's last-page fill, once per visit, and 'never' stops it", async () => {
    // Fresh modules: panels mounted by earlier tests also listen on the shared bus.
    vi.resetModules();
    const { REVIEW_KEY } = await import("../lib/keys");
    const { REPLAYED, emit } = await import("./bus");
    const { mountFillButton } = await import("./fillButton");
    const store: Record<string, unknown> = { [LEARNED_KEY]: [], [REVIEW_KEY]: { fills: 2, asks: 0, nextAt: 3, stopped: false } };
    (globalThis as any).chrome = { storage: {
      local: { get: async () => store, set: async (o: Record<string, unknown>) => Object.assign(store, o) },
      onChanged: { addListener: () => {} },
    } };
    history.replaceState({}, "", "/arrival-card-submission/declaration");
    mountFillButton(); await Promise.resolve();
    emit(REPLAYED); emit(REPLAYED); await vi.advanceTimersByTimeAsync(1);
    expect((store[REVIEW_KEY] as { fills: number }).fills).toBe(3);
    const box = root.querySelector<HTMLElement>(".review")!;
    expect(box.hidden).toBe(false);
    expect(box.querySelector("a")?.getAttribute("href")).toContain("/reviews");
    expect(box.textContent).not.toContain("Never ask again");
    // 2nd ask, five cards later, offers "never".
    store[REVIEW_KEY] = { fills: 7, asks: 1, nextAt: 8, stopped: false };
    history.replaceState({}, "", "/arrival-card-submission/personal-information"); vi.advanceTimersByTime(600);
    history.replaceState({}, "", "/arrival-card-submission/declaration"); vi.advanceTimersByTime(600);
    emit(REPLAYED); await vi.advanceTimersByTimeAsync(1);
    const never = [...box.querySelectorAll("button")].find(b => b.textContent === "Never ask again")!;
    never.click(); await vi.advanceTimersByTimeAsync(1);
    expect(box.hidden).toBe(true);
    expect((store[REVIEW_KEY] as ReviewStateLike).stopped).toBe(true);
  });
});
type ReviewStateLike = { stopped: boolean };
