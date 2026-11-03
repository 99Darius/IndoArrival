import { describe, expect, it } from "vitest";
import manifest from "../../manifest.json";
import { COUNTRIES } from "./countries";

const covers = (patterns: string[], site: RegExp) => patterns.some(p => site.test(p.replace("*", "")));

describe("every country", () => {
  for (const c of COUNTRIES) {
    it(`${c.name} works on install, with no extra permission to ask for`, () => {
      expect(covers(manifest.host_permissions, c.site)).toBe(true);
      expect(covers(manifest.content_scripts.flatMap(s => s.matches), c.site)).toBe(true);
    });
  }
  it("theAsianparent shows everywhere, Rumah123 only on Indonesia", () => {
    for (const c of COUNTRIES) {
      expect(c.ads).toContain("theasianparent");
      expect(c.ads.includes("rumah123")).toBe(c.id === "id");
    }
  });
  it("no permission is left to ask for later", () => {
    expect(manifest).not.toHaveProperty("optional_host_permissions");
  });
});
