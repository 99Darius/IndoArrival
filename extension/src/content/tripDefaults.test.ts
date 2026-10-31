// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { dateRuleText, dateValue, parseDate, planForPage, rememberable, withDateRules } from "./tripDefaults";
import type { LearnedField } from "./formFill";
const travel = "/arrival-card-submission/travel-details";
const declaration = "/arrival-card-submission/declaration";
const field = (o: Partial<LearnedField> = {}): LearnedField => ({ selector: "#permit", control: "text", value: "STORED", step: travel, ...o });
beforeEach(() => { document.body.replaceChildren(); history.replaceState({}, "", travel); });

describe("per-trip defaults", () => {
  it("discovers unrecorded date fields and rolls departure across a month/year", () => {
    document.body.innerHTML = `<label for="std_arrival_date_foreigner_individual">Arrival Date to Indonesia</label><input id="std_arrival_date_foreigner_individual" readonly value="Select"><label for="std_departure_date_foreigner_individual">Departure Date from Indonesia</label><input id="std_departure_date_foreigner_individual" placeholder="DD/MM/YYYY">`;
    expect(planForPage([], new Date(2026, 11, 25)).map(f => f.value)).toEqual(["25/12/2026", "08/01/2027"]);
  });
  it("keeps edited dates, including Indonesian arrival date labels", () => {
    document.body.innerHTML = `<input id="std_arrival_date_foreigner_individual" readonly value="20 OKTOBER 2026"><input id="std_departure_date_foreigner_individual" value="15/11/2026">`;
    expect(planForPage([], new Date(2026, 9, 18)).map(f => f.value)).toEqual(["20 OKTOBER 2026", "15/11/2026"]);
    (document.querySelectorAll("input")[1] as HTMLInputElement).value = "";
    expect(planForPage([], new Date(2026, 9, 18))[1].value).toBe("03/11/2026");
  });
  it("keeps birth/expiry dates unchanged", () => {
    history.replaceState({}, "", "/arrival-card-submission/personal-information");
    const f = field({ step: location.pathname, selector: "#spi_dob_1", value: "01/01/1980" });
    expect(planForPage([f])[0].value).toBe("01/01/1980");
  });
  it("offers 0 baggage without a recording, and keeps an edited bag count", () => {
    history.replaceState({}, "", declaration);
    document.body.innerHTML = '<input id="asd_total_baggage_individual">';
    expect(planForPage([])[0].value).toBe("0");
    (document.querySelector("input") as HTMLInputElement).value = "3";
    expect(planForPage([])[0].value).toBe("3");
  });
  it("retains KITAS details and declaration answers, but not other steps", () => {
    expect(rememberable(field({ selector: "#std_visa_kitas_kitap_no_foreigner_individual" }))).toBe(true);
    const goods = field({ step: declaration, selector: "#goods", control: "choice", value: "NO" });
    const certify = field({ step: declaration, selector: "@q:I certify", control: "tick", value: "checked" });
    expect(rememberable(goods)).toBe(true);
    expect(rememberable(certify)).toBe(true);
    history.replaceState({}, "", declaration);
    expect(planForPage([goods, certify, field()])).toEqual([goods, certify]);
  });
  it("saves taught dates as rules and replays them from the next fill date", () => {
    const A = "#std_arrival_date_foreigner_individual", D = "#std_departure_date_foreigner_individual";
    const taught = withDateRules([
      field({ selector: A, control: "dropdown", value: "26 OCTOBER 2026" }),
      field({ selector: D, value: "09/11/2026" }),
    ], new Date(2026, 9, 25));
    expect(taught.map(f => f.offset)).toEqual([1, 14]);
    expect(taught.map(dateRuleText)).toEqual(["Form-fill date +1 (tomorrow, 26 Oct)", "Arrival date +14 (9 Nov, 14 days after arrival)"]);
    // Next trip, filled on 30 Dec: arrival 31 Dec, departure 14 Jan.
    document.body.innerHTML = `<input id="std_arrival_date_foreigner_individual" readonly value="Select"><input id="std_departure_date_foreigner_individual">`;
    const plan = planForPage(taught, new Date(2026, 11, 30));
    expect(plan.map(f => f.value)).toEqual(["31/12/2026", "14/01/2027"]);
    expect(plan.map(dateRuleText)).toEqual(["Form-fill date +1 (tomorrow, 31 Dec)", "Arrival date +14 (14 Jan, 14 days after arrival)"]);
  });
  it("rejects invalid dates and formats local dates without UTC day shifts", () => {
    expect(parseDate("31/02/2026")).toBeNull();
    expect(dateValue(new Date(2026, 0, 1))).toBe("01/01/2026");
  });
});
