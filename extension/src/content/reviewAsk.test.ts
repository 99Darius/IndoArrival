import { describe, expect, it } from "vitest";
import { countFill, offerNever, type ReviewState } from "./reviewAsk";

function run(n: number, start?: ReviewState) {
  let s = start; const asked: number[] = [];
  for (let i = 1; i <= n; i++) { const r = countFill(s); s = r.state; if (r.ask) asked.push(s.fills); }
  return { s: s!, asked };
}

describe("review ask schedule", () => {
  it("asks on the 3rd card, then every 5", () => {
    expect(run(18).asked).toEqual([3, 8, 13, 18]);
  });
  it("offers 'never' only from the second ask", () => {
    expect(offerNever(run(3).s)).toBe(false);
    expect(offerNever(run(8).s)).toBe(true);
  });
  it("stops for good once reviewed or never", () => {
    const { s } = run(3);
    expect(run(20, { ...s, stopped: true }).asked).toEqual([]);
  });
});
