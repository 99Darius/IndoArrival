/**
 * Answers both countries' forms ask for, so a traveller taught on one form can be
 * offered them on the other. Everything goes through one common shape: adding a
 * country means adding its `from...` and `...Items` functions here.
 *
 * Shared only where the meaning is certain:
 *  - Passport number, date of birth and phone number go both ways.
 *  - Gender goes from Indonesia to Thailand only. Indonesia's choice group shows no
 *    readable selection, so filling it could overwrite one the traveller already made.
 *  - Thailand's name parts join into Indonesia's full name. The other way is left
 *    out: "TAN WEI MING" can't be split safely, and this is a legal form.
 *  - Nationality is left out: the lists word it differently (SINGAPORE, SINGAPOREAN).
 *  - Trip details, declarations and health answers are never shared.
 * The traveller sees every value and chooses to use them; see content/sharedOffer.ts.
 */
import type { LearnedField } from "../content/formFill";
import type { Answer } from "../content/th/fields";
import { parseDate } from "../content/tripDefaults";
import { sameChoice } from "./choice";

export interface Common {
  fullName?: string;
  passportNo?: string;
  birth?: { year: string; month: string; day: string };
  gender?: "MALE" | "FEMALE";
  phoneNo?: string;
}

/** One line of an offer: what the traveller reads, and what filling it means on this form. */
export interface ShareItem<A = unknown> {
  key: keyof Common;
  label: string;
  value: string;
  answers: A[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const birthText = (b: NonNullable<Common["birth"]>) => `${b.day}/${b.month}/${b.year}`;
const genderOf = (value: string | undefined): Common["gender"] =>
  value && sameChoice(value, "male") ? "MALE" : value && sameChoice(value, "female") ? "FEMALE" : undefined;

// ---- Indonesia: answers are found by the field's id, whatever its numeric suffix ----
export const INDONESIA_FIRST_PAGE = "/arrival-card-submission/personal-information";
const INDO = {
  fullName: "spi_full_name_",
  passportNo: "spi_passport_no_",
  dob: "spi_dob_",
  gender: "spi_gender_",
  phoneNo: "spi_mobile_no_",
};

export function fromIndonesia(fields: LearnedField[]): Common {
  const find = (stem: string) => fields.find((f) => f.selector?.includes(stem))?.value?.trim() || undefined;
  const out: Common = {};
  const fullName = find(INDO.fullName);
  if (fullName) out.fullName = fullName;
  const passportNo = find(INDO.passportNo);
  if (passportNo) out.passportNo = passportNo;
  const dob = find(INDO.dob);
  const date = dob ? parseDate(dob) : null;
  if (date) out.birth = { year: String(date.getFullYear()), month: pad(date.getMonth() + 1), day: pad(date.getDate()) };
  // Older recordings of this choice kept no selector, only its label or option text.
  const gender = genderOf(find(INDO.gender))
    ?? genderOf(fields.find((f) => /gender|jenis kelamin/i.test(f.label ?? ""))?.value)
    ?? genderOf(fields.find((f) => !f.selector && genderOf(f.value))?.value);
  if (gender) out.gender = gender;
  const phoneNo = find(INDO.phoneNo);
  if (phoneNo) out.phoneNo = phoneNo;
  return out;
}

export function indonesiaItems(c: Common): ShareItem<LearnedField>[] {
  const field = (stem: string, control: string, value: string, label: string): LearnedField =>
    ({ selector: `[id^="${stem}"]`, control, value, label, step: INDONESIA_FIRST_PAGE });
  const items: ShareItem<LearnedField>[] = [];
  const add = (key: keyof Common, label: string, value: string, f: LearnedField) => items.push({ key, label, value, answers: [f] });
  if (c.fullName) add("fullName", "Full name", c.fullName, field(INDO.fullName, "text", c.fullName, "Full name"));
  if (c.passportNo) add("passportNo", "Passport number", c.passportNo, field(INDO.passportNo, "text", c.passportNo, "Passport number"));
  if (c.birth) add("birth", "Date of birth", birthText(c.birth), field(INDO.dob, "text", birthText(c.birth), "Date of birth"));
  if (c.phoneNo) add("phoneNo", "Phone number", c.phoneNo, field(INDO.phoneNo, "text", c.phoneNo, "Phone number"));
  return items;
}

// ---- Thailand: answers are keyed by the form's stable field names ----
export function fromThailand(answers: Answer[]): Common {
  const get = (key: string) => answers.find((a) => a.key === key)?.value?.trim() || undefined;
  const out: Common = {};
  const names = [get("firstName"), get("middleName"), get("familyName")].filter(Boolean);
  // A family name alone may be all a traveller typed so far: not a full name yet.
  if (get("firstName") && get("familyName")) out.fullName = names.join(" ");
  const passportNo = get("passportNo");
  if (passportNo) out.passportNo = passportNo;
  const [year, month, day] = [get("bdDateYear"), get("bdDateMonth"), get("bdDateDay")];
  if (year && month && day) out.birth = { year, month: month.padStart(2, "0"), day: day.padStart(2, "0") };
  const gender = genderOf(get("gender"));
  if (gender) out.gender = gender;
  const phoneNo = get("phoneNo");
  if (phoneNo) out.phoneNo = phoneNo;
  return out;
}

export function thailandItems(c: Common): ShareItem<Answer>[] {
  const items: ShareItem<Answer>[] = [];
  if (c.passportNo) items.push({ key: "passportNo", label: "Passport number", value: c.passportNo, answers: [{ key: "passportNo", kind: "text", value: c.passportNo, label: "Passport number" }] });
  if (c.birth) {
    items.push({ key: "birth", label: "Date of birth", value: birthText(c.birth), answers: [
      { key: "bdDateYear", kind: "auto", value: c.birth.year, label: "Birth year" },
      { key: "bdDateMonth", kind: "auto", value: c.birth.month, label: "Birth month" },
      { key: "bdDateDay", kind: "auto", value: c.birth.day, label: "Birth day" },
    ] });
  }
  if (c.gender) items.push({ key: "gender", label: "Gender", value: c.gender, answers: [{ key: "gender", kind: "radio", value: c.gender, label: "Gender" }] });
  if (c.phoneNo) items.push({ key: "phoneNo", label: "Phone number", value: c.phoneNo, answers: [{ key: "phoneNo", kind: "text", value: c.phoneNo, label: "Phone number" }] });
  return items;
}
