// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revealNewest, type Row } from "./revealNewest";

let list: HTMLElement;
let body: HTMLElement;

function row(key: string, value: string, top: number): Row {
  const li = document.createElement("li");
  Object.defineProperty(li, "offsetTop", { value: top });
  Object.defineProperty(li, "offsetHeight", { value: 40 });
  li.getBoundingClientRect = () => ({ top, bottom: top + 40 }) as DOMRect;
  return { key, value, li };
}

beforeEach(() => {
  vi.useFakeTimers();
  list = document.createElement("ul");
  Object.defineProperty(list, "clientHeight", { value: 180 });
  body = document.createElement("div");
  body.getBoundingClientRect = () => ({ top: 0, bottom: 300 }) as DOMRect;
});

describe("revealNewest", () => {
  const rows = () => [row("a", "1", 0), row("b", "2", 200), row("c", "3", 400)];

  it("scrolls to a new answer at the end and flashes it", () => {
    const r = rows();
    const next = revealNewest(new Map([["a", "1"], ["b", "2"]]), r, list, body);
    expect(list.scrollTop).toBe(400 - (180 - 40) / 2);
    expect(r[2].li.classList.contains("fresh")).toBe(true);
    vi.advanceTimersByTime(50);
    expect(r[2].li.classList.contains("fresh")).toBe(false);
    expect([...next]).toEqual([["a", "1"], ["b", "2"], ["c", "3"]]);
  });

  it("scrolls back up to an earlier answer the traveller changed", () => {
    revealNewest(new Map([["a", "1"], ["b", "OLD"], ["c", "3"]]), rows(), list, body);
    expect(list.scrollTop).toBe(200 - (180 - 40) / 2);
  });

  it("stays put when nothing changed", () => {
    list.scrollTop = 77;
    const r = rows();
    revealNewest(new Map([["a", "1"], ["b", "2"], ["c", "3"]]), r, list, body);
    expect(list.scrollTop).toBe(77);
    expect(r.some(x => x.li.classList.contains("fresh"))).toBe(false);
  });

  it("starts at the end on opening, without a flash", () => {
    const r = rows();
    revealNewest(new Map(), r, list, body);
    expect(list.scrollTop).toBe(400 - (180 - 40) / 2);
    expect(r[2].li.classList.contains("fresh")).toBe(false);
  });

  it("scrolls the panel too when the answer is below its fold", () => {
    revealNewest(new Map([["a", "1"], ["b", "2"]]), rows(), list, body);
    expect(body.scrollTop).toBe(440 - 300);
  });
});
