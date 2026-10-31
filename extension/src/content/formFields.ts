import { deriveSelector, selectorFromId } from "../lib/selector";
import type { LearnedField } from "./formFill";

export type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export const controls = () => [...document.querySelectorAll<FormControl>("input, textarea, select")]
  .filter(el => !el.disabled && !(el instanceof HTMLInputElement && /^(hidden|submit|button|file)$/.test(el.type)));

export function choiceGroup(el: Element): HTMLElement | null {
  if (!(el instanceof HTMLInputElement) || !el.readOnly || el.id) return null;
  if (el.parentElement?.querySelector("svg")) return null;
  const group = el.parentElement?.closest<HTMLElement>("[id]");
  const n = group?.querySelectorAll("input[readonly]").length ?? 0;
  if (group && n >= 2 && n <= 8) return group;
  // Declaration page: no ids, just option boxes side by side with one readonly input each.
  const grid = el.parentElement?.parentElement;
  const rows = grid ? [...grid.children] : [];
  const isGroup = rows.length >= 2 && rows.length <= 8 && rows.every(r =>
    r.querySelectorAll("input").length === 1 && r.querySelector("input[readonly]:not([id])") && !r.querySelector("svg"));
  return isGroup ? grid as HTMLElement : null;
}

const clean = (s: string | null | undefined) => (s ?? "").trim().replace(/\s+/g, " ");

/** The question above an id-less field: the first of the <p> lines just before it. */
export function questionText(el: Element): string {
  for (let a: Element | null = el, i = 0; a && a !== document.body && i < 5; a = a.parentElement, i++) {
    for (let s = a.previousElementSibling; s; s = s.previousElementSibling) {
      if (s.tagName === "P" && clean(s.textContent)) {
        let q: Element = s;
        while (q.previousElementSibling?.tagName === "P") q = q.previousElementSibling;
        return clean(q.textContent);
      }
      if (s.querySelector("input, textarea, select")) return "";
    }
  }
  return "";
}

/**
 * A multi-pick dropdown (countries visited) shows only the last pick in its box and
 * lists every pick as a chip under "Selected countries:". Null when there is no list.
 */
export function selectedPicks(el: Element): string[] | null {
  for (let a: Element | null = el, i = 0; a && a !== document.body && i < 5; a = a.parentElement, i++) {
    for (let s = a.nextElementSibling, j = 0; s && j < 3; s = s.nextElementSibling, j++) {
      if (s.querySelector("input, textarea, select, label")) return null;
      const chips = [...s.querySelectorAll(":scope > div > div > p:first-child")].filter(p => p.parentElement?.querySelector("svg"));
      if (chips.length) return chips.map(p => clean(p.textContent));
    }
  }
  return null;
}

/**
 * The site's own tick box (the declaration's "I certify"): a box div that holds an
 * svg tick when on, next to its <p> text. No input element at all.
 */
function isTick(c: Element | null): c is HTMLElement {
  const box = c?.firstElementChild;
  return !!c && c.tagName === "DIV" && box?.tagName === "DIV" && !clean(box.textContent) &&
    !!c.querySelector(":scope > p") && c.children.length <= 4 && !c.querySelector("input, textarea, select, button");
}
export const tickText = (c: Element) => clean(c.querySelector(":scope > p")?.textContent);
export const tickOn = (c: Element) => !!c.firstElementChild?.querySelector("svg");
/** The tick a click landed in, if the click was on its box. */
export function tickFrom(target: Element): HTMLElement | null {
  for (let a: Element | null = target, i = 0; a && i < 4; a = a.parentElement, i++) {
    if (isTick(a.parentElement) && a === a.parentElement.firstElementChild) return a.parentElement;
  }
  return null;
}

/** Id-less fields are saved as "@q:<question text>". */
const Q = "@q:";
const bySelector = (selector: string): HTMLElement[] => {
  if (selector.startsWith(Q)) {
    const want = selector.slice(Q.length);
    const hits = new Set<HTMLElement>();
    for (const el of document.querySelectorAll<HTMLInputElement>("input[readonly]:not([id])")) {
      const target = choiceGroup(el) ?? el;
      if (questionText(target) === want) hits.add(target);
    }
    for (const p of document.querySelectorAll("div > p")) {
      if (isTick(p.parentElement) && tickText(p.parentElement) === want) hits.add(p.parentElement);
    }
    return [...hits];
  }
  try { return [...document.querySelectorAll<HTMLElement>(selector)]; } catch { return []; /* old selector */ }
};
export const queryField = (selector: string): HTMLElement | null => bySelector(selector)[0] ?? null;

export function fieldLabel(el: Element): string {
  if (el.id) {
    const label = [...document.querySelectorAll<HTMLLabelElement>("label[for]")].find(l => l.htmlFor === el.id);
    if (label?.textContent) return label.textContent.trim();
  }
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  const label = el.closest("label");
  if (label?.textContent) return label.textContent.trim();
  const group = choiceGroup(el);
  if (group) return (group.id ? "" : questionText(group)) || (group.parentElement?.querySelector("p, label")?.textContent?.trim() ?? "");
  for (let a = el.parentElement, i = 0; a && i < 3; a = a.parentElement, i++) {
    if (a === document.body || a.tagName === "FORM" || a.querySelectorAll("input[id], textarea[id], select[id]").length > 1) break;
    const label = a.querySelector(":scope > label");
    if (label?.textContent) return label.textContent.trim();
  }
  return el instanceof HTMLInputElement && el.readOnly && !el.id ? questionText(el) : "";
}

function selectorViaLabel(el: Element): string | null {
  for (let a = el.parentElement, i = 0; a && i < 6; a = a.parentElement, i++) {
    if (a === document.body || a.tagName === "FORM" || a.querySelectorAll("input[id], textarea[id], select[id]").length > 1) break;
    const forId = a.querySelector(":scope > label[for]")?.getAttribute("for");
    if (!forId) continue;
    const m = selectorFromId(forId)?.match(/^\[id\^="(.*)"\]$/);
    const escaped = forId.replace(/["\\]/g, "\\$&");
    return `${a.tagName.toLowerCase()}:has(> ${m ? `label[for^="${m[1]}"]` : `label[for="${escaped}"]`}) input[readonly]:not([id])`;
  }
  return null;
}

const asQuestion = (el: Element) => { const q = questionText(el); return q ? Q + q : null; };

export function describeTick(c: HTMLElement): LearnedField {
  return { selector: Q + tickText(c), control: "tick", label: tickText(c), value: tickOn(c) ? "checked" : "", step: location.pathname };
}

export function describeField(el: FormControl): LearnedField {
  const group = choiceGroup(el);
  const picks = !group && el instanceof HTMLInputElement && el.readOnly && !el.id ? selectedPicks(el) : null;
  const control = group ? "choice" : el instanceof HTMLSelectElement ? "select" :
    el instanceof HTMLTextAreaElement ? "textarea" : /^(radio|checkbox)$/.test(el.type) ? el.type :
    el.readOnly ? "dropdown" : "text";
  return {
    selector: group ? deriveSelector(group) ?? asQuestion(group) : deriveSelector(el) ?? selectorViaLabel(el) ?? (el instanceof HTMLInputElement && el.readOnly ? asQuestion(el) : null),
    control, label: fieldLabel(el), placeholder: el.getAttribute("placeholder") ?? "",
    value: picks?.length ? picks.join(", ") : el instanceof HTMLInputElement && /^(radio|checkbox)$/.test(el.type) && !el.checked ? "" : el.value,
    step: location.pathname,
    ...(group ? { index: [...group.querySelectorAll("input[readonly]")].indexOf(el) } : {}),
  };
}

export function fieldKey(f: LearnedField): string {
  return `${f.step}::${f.selector || f.label || f.placeholder}${f.control === "radio" ? `::${f.value}` : ""}`;
}

export function findField(f: LearnedField): HTMLElement | null {
  if (f.selector) {
    const matches = bySelector(f.selector);
    const el = f.control === "radio" ? matches.find(el => (el as HTMLInputElement).value === f.value) : matches[0];
    if (el) return el;
  }
  if (!f.label) return null;
  const matches = controls().filter(el => fieldLabel(el).trim().toLowerCase() === f.label!.trim().toLowerCase());
  return matches.length === 1 ? matches[0] : null;
}
