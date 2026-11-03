/**
 * Trip dates move with the calendar. The site shows yyyy/MM/dd but its date
 * parser only accepts dd/MM/yyyy when typed, and TDAC opens 3 days before arrival.
 */
import type { Answer } from "./fields";
import { readAnswer } from "./fields";

const MAX_ARRIVAL_OFFSET = 3;

export function parseDate(value: string): Date | null {
  let m = value.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  const ymd = m ? [m[1], m[2], m[3]] : (m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)) ? [m[3], m[2], m[1]] : null;
  if (!ymd) return null;
  const date = new Date(+ymd[0], +ymd[1] - 1, +ymd[2]);
  return date.getMonth() === +ymd[1] - 1 ? date : null;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** What the site's parser accepts. */
export const typedDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const shownDate = (d: Date) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a: Date, b: Date) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 864e5);

/** Turn taught trip dates into rules: arrival = days after today, departure = days after arrival. */
export function withDateRules(answers: Answer[], now = new Date()): Answer[] {
  // A departure fix on its own still measures from the arrival date on the form.
  const arrival = parseDate(answers.find(a => a.key === "arrDate")?.value ?? readAnswer("arrDate")?.value ?? "");
  return answers.map(a => {
    const date = parseDate(a.value);
    if (!date) return a;
    if (a.key === "arrDate") return { ...a, offset: Math.min(MAX_ARRIVAL_OFFSET, Math.max(0, daysBetween(now, date))) };
    if (a.key === "deptDate" && arrival) return { ...a, offset: daysBetween(arrival, date) };
    return a;
  });
}

/**
 * Work out this trip's dates from the rules. A date already on the form is an
 * explicit choice for this trip, so it is left alone (and dropped from the plan).
 */
export function applyDateRules(answers: Answer[], now = new Date()): Answer[] {
  const onForm = (key: string) => parseDate(readAnswer(key)?.value ?? "");
  const saved = answers.find(a => a.key === "arrDate");
  const arrival = onForm("arrDate") ?? addDays(now, saved?.offset ?? 0);
  return answers.flatMap(a => {
    if (a.key !== "arrDate" && a.key !== "deptDate") return [a];
    if (onForm(a.key)) return [];
    if (a.offset == null) return [a];
    const date = a.key === "arrDate" ? arrival : addDays(arrival, a.offset);
    return [{ ...a, value: shownDate(date) }];
  });
}

/** "Today +1 (2026/11/04)" / "Arrival +14 (2026/11/18)". */
export function dateRuleText(a: Answer): string | null {
  if (a.offset == null || !parseDate(a.value)) return null;
  const plus = a.offset ? ` ${a.offset > 0 ? "+" : "−"}${Math.abs(a.offset)}` : "";
  return `${a.key === "arrDate" ? "Today" : "Arrival"}${plus} (${a.value})`;
}
