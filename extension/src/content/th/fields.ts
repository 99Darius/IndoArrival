/**
 * The TDAC form's fields. The site is Angular Material on one route: every step
 * stays in the DOM, and each field sits in a wrapper with a stable
 * `sit-validate-input` attribute, which is what answers are keyed by.
 *
 * Only the fields listed here are ever read or saved. The health step's are in, as
 * they are for Indonesia: most travellers give the same answers each trip, and they
 * check every field before submitting. A certificate file is never saved.
 *
 * The last page is another route: the email for the card, and the agreement tick. That
 * tick opens the site's agreement window, and Agree there stays the traveller's to press.
 */
export type Kind = "text" | "date" | "select" | "radio" | "check" | "checks" | "chips" | "auto" | "suggest";

export interface Answer {
  key: string;
  kind: Kind;
  value: string;
  label?: string;
  /** For a radio: which option (0-based), which survives the site switching language. */
  index?: number;
  /** The user emptied an answer that had a value: saving forgets it. */
  cleared?: boolean;
  /** Trip dates are saved as rules: arrival = fill date + offset days, departure = arrival + offset days. */
  offset?: number;
}

const LABELS: Record<string, string> = {
  familyName: "Family name", firstName: "First name", middleName: "Middle name", passportNo: "Passport number", nationalityDesc: "Nationality",
  bdDateYear: "Birth year", bdDateMonth: "Birth month", bdDateDay: "Birth day", occupation: "Occupation", gender: "Gender", visaNo: "Visa number",
  countryResDesc: "Country of residence", cityRes: "City of residence", phoneCode: "Phone code", phoneNo: "Phone number",
  arrDate: "Arrival date", countryBoardDesc: "Country boarded from", traPurposeDesc: "Purpose of travel", traPurposeOTH: "Purpose (other)",
  traModeId: "Arrival mode", tranModeId: "Arrival transport", tranModeOTH: "Arrival transport (other)", flightNo: "Arrival flight",
  deptDate: "Departure date", deptTraModeId: "Departure mode", deptTranModeId: "Departure transport", deptTranModeOTH: "Departure transport (other)", deptFlightNo: "Departure flight",
  notStayInTh: "Not staying in Thailand", accTypeId: "Accommodation type", accTypeOTH: "Accommodation (other)", accProvinceDesc: "Province",
  accDistrictDesc: "District", accSubDistrictDesc: "Sub-district", accPostCode: "Post code", accAddress: "Address",
};
const HEALTH_LABELS: Record<string, string> = {
  ddcCountrys: "Countries visited", yellowFever: "Yellow fever vaccination", vacDate: "Vaccination date", symptomsIds: "Symptoms", symptomsOther: "Symptoms (other)",
};
const LAST_LABELS: Record<string, string> = { sendTo: "Email for the card", agreedTerms: "Agreement to the terms" };
export const PERSONAL = Object.keys(LABELS).slice(0, 15);
export const TRIP = Object.keys(LABELS).slice(15);
export const HEALTH = Object.keys(HEALTH_LABELS);
export const LAST = Object.keys(LAST_LABELS);
const isAllowedKey = (key: string) => [LABELS, HEALTH_LABELS, LAST_LABELS].some(labels => Object.hasOwn(labels, key));
export const isAllowed = (key: string | null | undefined): key is string => !!key && isAllowedKey(key);

/** The new-card form and its last page: never the site's home, submitted or update pages. */
export const isFormPage = (hash = location.hash) => /^#\/tac\/arrival-card\/add(?!\/submitted)(\/|\?|$)/.test(hash);

export const clean = (s: string | null | undefined) => (s ?? "").trim().replace(/\s+/g, " ");

/** The agreement tick is the one field the site gives no `sit-validate-input` wrapper. */
const AGREEMENT_BOX = 'mat-checkbox[formcontrolname="checkedDecalraion"]';
export const wrapper = (key: string) => key === "agreedTerms"
  ? document.querySelector<HTMLElement>(AGREEMENT_BOX)
  : document.querySelector<HTMLElement>(`[sit-validate-input="${key}"]`);
export const keyOf = (el: Element) => el.closest(AGREEMENT_BOX) ? "agreedTerms" : el.closest("[sit-validate-input]")?.getAttribute("sit-validate-input") ?? null;

/** On screen now: the stepper hides inactive steps with visibility, not by removing them. */
export function isShown(el: Element | null): boolean {
  return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
}

export function currentStep(): string[] {
  if (isShown(wrapper("familyName"))) return PERSONAL;
  if (isShown(wrapper("arrDate"))) return TRIP;
  if (isShown(wrapper("ddcCountrys"))) return HEALTH;
  if (isShown(wrapper("sendTo"))) return LAST;
  return [];
}

export function kindOf(wrap: Element, key: string): Kind | null {
  if (wrap.querySelector("mat-select")) return "select";
  if (wrap.querySelector("mat-radio-group")) return "radio";
  if (wrap.querySelector("sit-chip-autocomplete")) return "chips";
  if (wrap.querySelectorAll("mat-checkbox").length > 1) return "checks";
  if (wrap.matches("mat-checkbox") || wrap.querySelector("mat-checkbox")) return "check";
  if (wrap.querySelector("sit-autocomplete, sit-bd-autocomplete")) return key === "cityRes" ? "suggest" : "auto";
  if (wrap.querySelector("input.mat-datepicker-input")) return "date";
  return wrap.querySelector("input, textarea") ? "text" : null;
}

/** A box the user unticked is an answer too, so it is kept and can be restored on a reused form. */
export const CHECKED = "checked";
export const UNCHECKED = "unchecked";

export const inputIn = (wrap: Element) => wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type="hidden"]), textarea');
export const radiosIn = (wrap: Element) => [...wrap.querySelectorAll<HTMLInputElement>('mat-radio-button input[type="radio"]')];
/** The option's words only: labels can start with an icon whose name is its text ("flight AIR"). */
export function radioLabel(radio: Element): string {
  const label = radio.closest("mat-radio-button")?.querySelector("label")?.cloneNode(true) as Element | undefined;
  label?.querySelectorAll("mat-icon").forEach(icon => icon.remove());
  return clean(label?.textContent);
}

/** A field holding several choices (countries, symptoms) keeps them in one value. */
const LIST_SEPARATOR = "; ";
export const splitList = (value: string) => value.split(LIST_SEPARATOR).map(clean).filter(Boolean);

export const chipsIn = (wrap: Element) => [...wrap.querySelectorAll(".mdc-evolution-chip__text-label")].map(c => clean(c.textContent)).filter(Boolean);
export const boxesIn = (wrap: Element) => [...wrap.querySelectorAll("mat-checkbox")].flatMap(box => {
  const input = box.querySelector<HTMLInputElement>('input[type="checkbox"]');
  return input ? [{ input, label: clean(box.querySelector("label")?.textContent) }] : [];
});

/** The field's current answer as the user sees it, or null if the field isn't on the page. */
export function readAnswer(key: string): Answer | null {
  const wrap = wrapper(key);
  const kind = wrap && kindOf(wrap, key);
  if (!wrap || !kind) return null;
  const base = { key, kind, label: LABELS[key] ?? HEALTH_LABELS[key] ?? LAST_LABELS[key] ?? key };
  if (kind === "chips") return { ...base, value: chipsIn(wrap).join(LIST_SEPARATOR) };
  if (kind === "checks") return { ...base, value: boxesIn(wrap).filter(b => b.input.checked).map(b => b.label).join(LIST_SEPARATOR) };
  if (kind === "select") return { ...base, value: clean(wrap.querySelector(".mat-mdc-select-value-text")?.textContent) };
  if (kind === "radio") {
    const radios = radiosIn(wrap);
    const index = radios.findIndex(r => r.checked);
    return index < 0 ? { ...base, value: "" } : { ...base, value: radioLabel(radios[index]), index };
  }
  if (kind === "check") return { ...base, value: wrap.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked ? CHECKED : UNCHECKED };
  return { ...base, value: inputIn(wrap)?.value ?? "" };
}
