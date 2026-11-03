// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentStep, HEALTH, isAllowed, isFormPage, keyOf, LAST, PERSONAL, readAnswer, splitList, TRIP } from "./fields";
import { applyDateRules, dateRuleText, parseDate, typedDate, withDateRules } from "./dates";
import { mergeAnswers } from "../../background/th/travellers";

const FORM = `
 <div class="step"><div sit-validate-input="familyName"><sit-label>Family Name</sit-label><input formcontrolname="familyName" value="TAN"></div>
 <div sit-validate-input="gender"><sit-label>Gender</sit-label><mat-radio-group>
   <mat-radio-button><input type="radio"><label>MALE</label></mat-radio-button>
   <mat-radio-button><input type="radio" checked><label><mat-icon>person</mat-icon> FEMALE</label></mat-radio-button></mat-radio-group></div>
 <div sit-validate-input="nationalityDesc"><sit-autocomplete><input type="hidden" value="SGP"><input value="SINGAPORE"></sit-autocomplete></div></div>
 <div class="step" style="visibility:hidden"><div sit-validate-input="arrDate"><input class="mat-datepicker-input" value="2026/11/04"></div>
 <div sit-validate-input="traPurposeDesc"><mat-select><span class="mat-mdc-select-value-text"> HOLIDAY </span></mat-select></div>
 <div sit-validate-input="notStayInTh"><mat-checkbox><input type="checkbox"></mat-checkbox></div></div>`;

beforeEach(() => {
  document.body.innerHTML = FORM;
  vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
});

describe("fields", () => {
  it("only runs on the new-card form", () => {
    expect(isFormPage("#/tac/arrival-card/add")).toBe(true);
    expect(isFormPage("#/tac/arrival-card/add/abc/123")).toBe(true);
    for (const h of ["#/home", "#/tac/arrival-card/add/submitted/1", "#/tac/arrival-card/update/search", "#/tac/arrival-card/address"]) expect(isFormPage(h)).toBe(false);
  });
  it("reads each kind of field by its wrapper", () => {
    expect(readAnswer("familyName")).toMatchObject({ kind: "text", value: "TAN", label: "Family name" });
    expect(readAnswer("gender")).toMatchObject({ kind: "radio", value: "FEMALE", index: 1 });
    expect(readAnswer("nationalityDesc")).toMatchObject({ kind: "auto", value: "SINGAPORE" });
    expect(readAnswer("arrDate")).toMatchObject({ kind: "date", value: "2026/11/04" });
    expect(readAnswer("traPurposeDesc")).toMatchObject({ kind: "select", value: "HOLIDAY" });
    expect(readAnswer("notStayInTh")).toMatchObject({ kind: "check", value: "unchecked" });
    expect(readAnswer("flightNo")).toBeNull();
  });
  it("knows the step on screen from the stepper's visibility", () => {
    expect(currentStep()).toBe(PERSONAL);
    document.querySelector<HTMLElement>(".step")!.style.visibility = "hidden";
    document.querySelectorAll<HTMLElement>(".step")[1].style.visibility = "visible";
    expect(currentStep()).toBe(TRIP);
  });
  it("reads the health step's several-choice fields", () => {
    document.body.innerHTML = `
     <div sit-validate-input="ddcCountrys"><sit-chip-autocomplete>
       <mat-chip-row><span class="mdc-evolution-chip__text-label"> KOREA, REPUBLIC OF </span><mat-icon>cancel</mat-icon></mat-chip-row>
       <mat-chip-row><span class="mdc-evolution-chip__text-label">SINGAPORE</span><mat-icon>cancel</mat-icon></mat-chip-row><input></sit-chip-autocomplete></div>
     <fieldset sit-validate-input="symptomsIds">
       <mat-checkbox><input type="checkbox" checked><label>FEVER</label></mat-checkbox>
       <mat-checkbox><input type="checkbox"><label>COUGH</label></mat-checkbox>
       <mat-checkbox><input type="checkbox" checked><label> OTHERS </label></mat-checkbox></fieldset>`;
    const countries = readAnswer("ddcCountrys")!;
    expect(countries).toMatchObject({ kind: "chips", label: "Countries visited" });
    expect(splitList(countries.value)).toEqual(["KOREA, REPUBLIC OF", "SINGAPORE"]);
    expect(readAnswer("symptomsIds")).toMatchObject({ kind: "checks", value: "FEVER; OTHERS" });
  });
  it("knows the health step", () => {
    document.body.innerHTML = '<div sit-validate-input="ddcCountrys"><input></div>';
    expect(currentStep()).toBe(HEALTH);
    expect(HEALTH.every(isAllowed)).toBe(true);
  });
  it("knows the last page's email and agreement tick", () => {
    document.body.innerHTML = `<div sit-validate-input="sendTo"><input value="alex@example.com"></div>
     <div><mat-checkbox formcontrolname="checkedDecalraion"><input id="agree" type="checkbox"></mat-checkbox></div>
     <button id="submit">Submit</button>`;
    expect(currentStep()).toBe(LAST);
    expect(readAnswer("sendTo")).toMatchObject({ kind: "text", value: "alex@example.com", label: "Email for the card" });
    expect(readAnswer("agreedTerms")).toMatchObject({ kind: "check", value: "unchecked" });
    expect(keyOf(document.getElementById("agree")!)).toBe("agreedTerms");
    expect(keyOf(document.getElementById("submit")!)).toBeNull();
  });
  it("runs on the last page, but not once submitted", () => {
    expect(isFormPage("#/tac/arrival-card/add/preview/abc")).toBe(true);
    expect(isFormPage("#/tac/arrival-card/add/submitted/abc")).toBe(false);
  });
  it("never saves a certificate file or unknown fields", () => {
    for (const k of ["fileNameOriginal", "cf-turnstile-response", "somethingNew"]) expect(isAllowed(k)).toBe(false);
    const a = { kind: "text" as const, value: "x" };
    expect(mergeAnswers([], [{ key: "fileNameOriginal", ...a }, { key: "firstName", ...a }]).map(x => x.key)).toEqual(["firstName"]);
  });
  it("forgets an emptied answer and keeps the rest", () => {
    const a = { kind: "text" as const };
    const saved = [{ key: "firstName", value: "A", ...a }, { key: "visaNo", value: "V1", ...a }];
    expect(mergeAnswers(saved, [{ key: "visaNo", value: "", ...a }])).toEqual([saved[0]]);
  });
});

describe("trip dates", () => {
  const now = new Date(2026, 10, 3);
  const date = (key: string, value: string, offset?: number) => ({ key, kind: "date" as const, value, offset });
  it("reads the site's shown format and writes the format its parser accepts", () => {
    expect(typedDate(parseDate("2026/11/04")!)).toBe("04/11/2026");
    expect(typedDate(parseDate("04/11/2026")!)).toBe("04/11/2026");
    expect(parseDate("2026/13/01")).toBeNull();
  });
  it("saves dates as rules, with arrival inside TDAC's 3-day window", () => {
    const rules = withDateRules([date("arrDate", "2026/11/04"), date("deptDate", "2026/11/18")], now);
    expect(rules.map(r => r.offset)).toEqual([1, 14]);
    expect(withDateRules([date("arrDate", "2026/12/25")], now)[0].offset).toBe(3);
    expect(dateRuleText(rules[0])).toBe("Today +1 (2026/11/04)");
  });
  it("measures a departure-only fix from the arrival date on the form", () => {
    document.body.innerHTML = '<div sit-validate-input="arrDate"><input class="mat-datepicker-input" value="2026/11/04"></div>';
    expect(withDateRules([date("deptDate", "2026/11/11")], now)[0].offset).toBe(7);
  });
  it("moves dates with the calendar, and leaves dates already on the form alone", () => {
    document.body.innerHTML = '<div sit-validate-input="arrDate"><input class="mat-datepicker-input" value=""></div><div sit-validate-input="deptDate"><input class="mat-datepicker-input" value=""></div>';
    const plan = applyDateRules([date("arrDate", "2026/01/02", 1), date("deptDate", "2026/01/16", 14)], now);
    expect(plan.map(p => p.value)).toEqual(["2026/11/04", "2026/11/18"]);
    document.querySelector<HTMLInputElement>('[sit-validate-input="arrDate"] input')!.value = "2026/11/05";
    const kept = applyDateRules([date("arrDate", "2026/01/02", 1), date("deptDate", "2026/01/16", 14)], now);
    expect(kept.map(p => [p.key, p.value])).toEqual([["deptDate", "2026/11/19"]]);
  });
});
