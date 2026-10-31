import { describe, it, expect } from "vitest";
import { selectorFromId, deriveSelector } from "./selector";

describe("selectorFromId", () => {
  it("strips a timestamp suffix to a prefix selector", () => {
    expect(selectorFromId("spi_full_name_1782107186388")).toBe('[id^="spi_full_name_"]');
    expect(selectorFromId("spi_passport_no_1782107186388")).toBe('[id^="spi_passport_no_"]');
  });
  it("uses exact id when there is no numeric suffix", () => {
    expect(selectorFromId("email")).toBe("#email");
  });
  it("returns null for empty id", () => {
    expect(selectorFromId("")).toBeNull();
  });
});

describe("deriveSelector", () => {
  it("prefers id", () => {
    expect(deriveSelector({ id: "spi_dob_1782107186388" })).toBe('[id^="spi_dob_"]');
  });
  it("falls back to name, then aria-label, then placeholder", () => {
    expect(deriveSelector({ id: "", name: "gender" })).toBe('[name="gender"]');
    expect(deriveSelector({ id: "", getAttribute: (n) => (n === "aria-label" ? "Nationality" : null) })).toBe('[aria-label="Nationality"]');
    expect(deriveSelector({ id: "", placeholder: "Cari" })).toBe('[placeholder="Cari"]');
  });
  it("returns null when nothing identifies the element", () => {
    expect(deriveSelector({ id: "" })).toBeNull();
  });
});

describe("selectorFromId: declaration page ids", () => {
  it("strips the seat number's PRF… suffix", () => {
    expect(selectorFromId("fd_seat_number_PRF1025e8047aba651792939559788")).toBe('[id^="fd_seat_number_"]');
    expect(selectorFromId("asd_total_baggage_individual")).toBe("#asd_total_baggage_individual");
  });
});
