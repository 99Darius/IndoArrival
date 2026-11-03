// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { keepClearOf, makeDraggable, releasePanel } from "./dragPanel";

const pointer = (type: string, x: number, y: number) => Object.assign(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }), { pointerId: 1 });

describe("dragging the panel", () => {
  it("moves with the pointer, stays on screen, and ignores the minimise button", () => {
    const host = document.createElement("div");
    const handle = document.createElement("header");
    const button = document.createElement("button");
    handle.append(button); host.append(handle); document.body.append(host);
    vi.spyOn(host, "getBoundingClientRect").mockReturnValue({ left: 100, top: 10, width: 300 } as DOMRect);
    makeDraggable(host, handle);

    button.dispatchEvent(pointer("pointerdown", 110, 15));
    handle.dispatchEvent(pointer("pointermove", 500, 200));
    expect(host.style.left).toBe("");

    handle.dispatchEvent(pointer("pointerdown", 110, 15));
    handle.dispatchEvent(pointer("pointermove", 210, 115));
    expect([host.style.left, host.style.top, host.style.right]).toEqual(["200px", "110px", "auto"]);
    handle.dispatchEvent(pointer("pointermove", -999, -999));
    expect([host.style.left, host.style.top]).toEqual(["0px", "0px"]);
    handle.dispatchEvent(pointer("pointerup", 0, 0));
    handle.dispatchEvent(pointer("pointermove", 400, 400));
    expect(host.style.left).toBe("0px");
  });
});

describe("keeping clear", () => {
  const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
  const at = (r: DOMRect) => { const el = document.createElement("div"); el.getBoundingClientRect = () => r; return el; };
  const panel = () => {
    const host = at(rect(8, 60, 275, 300));
    Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
    return host;
  };
  const tick = () => at(rect(23, 235, 40, 40));
  const email = () => at(rect(496, 190, 185, 20));
  const submit = () => at(rect(1305, 290, 72, 36));

  it("slides past the tick and email without landing on Submit", () => {
    const host = panel();
    const words = at(rect(63, 240, 345, 25));
    keepClearOf(host, [tick(), words, email(), submit()]);
    expect(host.style.left).toBe("689px");
  });
  it("stays put when it covers nothing", () => {
    const host = panel();
    keepClearOf(host, [at(rect(500, 200, 50, 50)), at(rect(30, 600, 50, 50))]);
    expect(host.style.left).toBe("");
  });
  it("stays put when nowhere is clear", () => {
    const host = panel();
    keepClearOf(host, [at(rect(0, 100, 1400, 40))]);
    expect(host.style.left).toBe("");
  });
  it("goes back afterwards, and never overrides the traveller's own drag", () => {
    const host = panel();
    keepClearOf(host, [tick()]);
    expect(host.style.left).not.toBe("");
    releasePanel(host);
    expect(host.style.left).toBe("");

    const handle = document.createElement("header"); host.append(handle); document.body.append(host);
    makeDraggable(host, handle);
    handle.dispatchEvent(pointer("pointerdown", 10, 65));
    handle.dispatchEvent(pointer("pointermove", 40, 65));
    handle.dispatchEvent(pointer("pointerup", 40, 65));
    const placed = host.style.left;
    keepClearOf(host, [tick()]);
    releasePanel(host);
    expect(host.style.left).toBe(placed);
  });
});
