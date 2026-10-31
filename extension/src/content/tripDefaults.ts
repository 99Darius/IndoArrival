import type { LearnedField } from "./formFill";
import { controls, describeField, fieldKey, findField } from "./formFields";

export function fieldRole(f: LearnedField): "arrival" | "departure" | "baggage" | undefined {
  const role = (text: string) => {
    if (/arrival.?date|date.?of.?arrival|tanggal.*kedatangan/.test(text)) return "arrival";
    if (/departure.?date|date.?of.?departure|tanggal.*keberangkatan/.test(text)) return "departure";
    if (/baggage|bagasi/.test(text) && !["choice", "radio", "checkbox"].includes(f.control)) return "baggage";
  };
  // Prefer the field's own stable identifier to labels from older recordings.
  const selector = (f.selector ?? "").toLowerCase();
  if (/spi_|std_|smta_|asd_/.test(selector)) return role(selector);
  return role(`${selector} ${f.label ?? ""} ${f.placeholder ?? ""}`.toLowerCase());
}

/** Only the arrival-card form pages are learned or filled — never the site's home, help or other pages. */
export const isFormPage = (path = location.pathname) => /^\/arrival-card-submission\//.test(path);

export function rememberable(f: LearnedField): boolean {
  if (!isFormPage(f.step)) return false;
  // Never keep secrets or one-time codes, even if a page has them.
  return !/password|one-time|otp|verification|captcha/i.test(`${f.selector ?? ""} ${f.placeholder ?? ""} ${f.label ?? ""}`);
}

export function dateValue(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function parseDate(value: string): Date | null {
  const months: Record<string, string> = { januari: "January", februari: "February", maret: "March", mei: "May", juni: "June", juli: "July", agustus: "August", oktober: "October", desember: "December" };
  value = value.replace(/\b(januari|februari|maret|mei|juni|juli|agustus|oktober|desember)\b/gi, m => months[m.toLowerCase()]);
  const dm = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dm ? new Date(+dm[3], +dm[2] - 1, +dm[1]) : iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (dm && (date.getDate() !== +dm[1] || date.getMonth() !== +dm[2] - 1)) return null;
  return date;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a: Date, b: Date) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 864e5);

function pageArrival(): Date | null {
  for (const el of controls()) if (fieldRole(describeField(el)) === "arrival") return parseDate(el.value);
  return null;
}

/**
 * Turn taught trip dates into rules, so next trip they move with the calendar:
 * arrival = days after the day the form is filled, departure = days after arrival.
 */
export function withDateRules(fields: LearnedField[], now = new Date()): LearnedField[] {
  const taught = fields.find(f => fieldRole(f) === "arrival");
  const arrival = parseDate(taught?.value ?? "") ?? (fields.some(f => f.step === location.pathname) ? pageArrival() : null);
  return fields.map(f => {
    const role = fieldRole(f);
    const date = parseDate(f.value);
    if (!date || (role !== "arrival" && role !== "departure")) return f;
    if (role === "arrival") return { ...f, offset: daysBetween(now, date) };
    return arrival ? { ...f, offset: daysBetween(arrival, date) } : f;
  });
}

/** "Form-fill date +1 (tomorrow, 26 Oct)" / "Arrival date +14 (8 Nov, 14 days after arrival)". */
export function dateRuleText(f: LearnedField): string | null {
  const role = fieldRole(f);
  const date = parseDate(f.value);
  if (f.offset == null || !date || (role !== "arrival" && role !== "departure")) return null;
  const n = f.offset;
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const plus = n ? ` ${n > 0 ? "+" : "−"}${Math.abs(n)}` : "";
  if (role === "arrival") {
    const when = n === 0 ? "today" : n === 1 ? "tomorrow" : n > 0 ? `in ${n} days` : `${-n} days ago`;
    return `Form-fill date${plus} (${when}, ${day})`;
  }
  return `Arrival date${plus} (${day}, ${Math.abs(n)} ${Math.abs(n) === 1 ? "day" : "days"} ${n >= 0 ? "after" : "before"} arrival)`;
}

export function pageNotes(path = location.pathname): string[] {
  if (/travel-details/.test(path)) return ["Dates follow your rule: arrival counts from the day you fill the form, departure from arrival (14 days unless you taught otherwise). Edit either date on the form. Your visa / KITAS / KITAP answer and number are remembered."];
  if (/mode-of-transport/.test(path)) return ["I reuse your last flight and port of entry. Check and edit them for this trip."];
  if (/declaration/.test(path)) return ["Baggage defaults to 0. Your usual health, quarantine, goods and device answers are remembered: check every one is true for this trip before you submit."];
  return [];
}

/** Build the same plan for the popup and floating panel, including unrecorded defaults. */
export function planForPage(learned: LearnedField[], now = new Date()): LearnedField[] {
  const fields = learned.filter(f => f.step === location.pathname);
  const byKey = new Map(fields.map(f => [fieldKey(f), { ...f }]));
  for (const el of controls()) {
    const f = describeField(el);
    const role = f.selector && fieldRole(f);
    if (!role) continue;
    // One entry per trip date, whatever selector an older save used for it.
    const saved = [...byKey].filter(([, g]) => fieldRole(g) === role);
    const entry: [string, LearnedField] = [fieldKey(f), { ...f, offset: saved.find(([, g]) => g.offset != null)?.[1].offset }];
    if (!saved.length) { byKey.set(...entry); continue; }
    const kept = [...byKey].flatMap(([k, g]): [string, LearnedField][] => k === saved[0][0] ? [entry] : saved.some(([sk]) => sk === k) ? [] : [[k, g]]);
    byKey.clear();
    kept.forEach(([k, g]) => byKey.set(k, g));
  }
  const values = [...byKey.values()];
  const arrivalField = values.find(f => fieldRole(f) === "arrival");
  const arrivalEl = arrivalField && findField(arrivalField);
  const arrivalRule = addDays(now, arrivalField?.offset ?? 0);
  const arrival = parseDate((arrivalEl as HTMLInputElement | null)?.value ?? "") ?? arrivalRule;
  const departure = addDays(arrival, values.find(f => fieldRole(f) === "departure")?.offset ?? 14);
  for (const f of byKey.values()) {
    const role = fieldRole(f);
    if (!role) continue;
    // Existing values are explicit choices for this trip; don't overwrite them.
    const el = findField(f) as FormControlValue | null;
    const current = el?.value ?? "";
    if (role === "baggage") { f.value = current || "0"; continue; }
    f.value = parseDate(current) ? current : dateValue(role === "arrival" ? arrivalRule : departure);
    f.offset = daysBetween(role === "arrival" ? now : arrival, parseDate(f.value)!);
    if (role === "departure" && el instanceof HTMLInputElement && !el.readOnly) f.control = "text";
  }
  return [...byKey.values()];
}
type FormControlValue = HTMLElement & { value?: string };
