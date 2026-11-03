// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEARNED_KEY } from "../../lib/keysTh";

let root: ShadowRoot;
beforeEach(() => {
  vi.useFakeTimers(); vi.resetModules();
  document.querySelector("#thaiarrival-panel")?.remove();
  vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  const attach = HTMLElement.prototype.attachShadow;
  vi.spyOn(HTMLElement.prototype, "attachShadow").mockImplementation(function (this: HTMLElement, options) { root = attach.call(this, options); return root; });
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

async function mount(store: Record<string, unknown>) {
  (globalThis as any).chrome = { storage: { local: { get: async () => store }, onChanged: { addListener: () => {} } } };
  const { mountPanel } = await import("./panel");
  mountPanel(); await vi.advanceTimersByTimeAsync(1);
}
const name = { key: "firstName", kind: "text", value: "ALEX", label: "First name" };

describe("floating panel", () => {
  it("offers Fill for the step on screen", async () => {
    history.replaceState({}, "", "#/tac/arrival-card/add");
    document.body.innerHTML = '<div sit-validate-input="familyName"><input></div><div sit-validate-input="firstName"><input></div>';
    await mount({ [LEARNED_KEY]: [name] });
    expect(root.querySelector("h2")?.textContent).toBe("I can fill 1 field on this step");
    expect(root.querySelector(".action")?.textContent).toBe("Fill this step (1)");
    // Page scripts cannot read the private answers through the host.
    expect(document.querySelector("#thaiarrival-panel")?.shadowRoot).toBeNull();
  });
  it("fills the health step, and says to check it's true for this trip", async () => {
    history.replaceState({}, "", "#/tac/arrival-card/add");
    document.body.innerHTML = '<div sit-validate-input="ddcCountrys"><input></div>';
    await mount({ [LEARNED_KEY]: [name, { key: "ddcCountrys", kind: "chips", value: "SINGAPORE" }] });
    expect(root.querySelector("h2")?.textContent).toBe("I can fill 1 field on this step");
    expect(root.querySelector<HTMLButtonElement>(".action")?.hidden).toBe(false);
    expect(root.textContent).toContain("true for this trip");
  });
  it("offers no Fill on a step it doesn't know", async () => {
    history.replaceState({}, "", "#/tac/arrival-card/add");
    document.body.innerHTML = '<div sit-validate-input="somethingNew"><input></div>';
    await mount({ [LEARNED_KEY]: [name] });
    expect(root.querySelector("h2")?.textContent).toBe("This step is yours");
    expect(root.querySelector<HTMLButtonElement>(".action")?.hidden).toBe(true);
  });
  it("stays hidden off the form, even with saved answers", async () => {
    history.replaceState({}, "", "#/home");
    await mount({ [LEARNED_KEY]: [name] });
    expect(document.querySelector<HTMLElement>("#thaiarrival-panel")).toBeNull();
  });
});
