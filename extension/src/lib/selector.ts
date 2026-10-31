/**
 * Derive a stable CSS selector for a gov-form field element.
 *
 * Gov form ids carry a regenerated timestamp suffix (e.g.
 * `spi_full_name_1782107186388`). We strip a trailing `_<digits>` and match by
 * prefix so the selector survives reloads. Fields without a usable id fall back
 * to name / aria-label / placeholder.
 */
export interface ElementLike {
  id?: string;
  name?: string;
  getAttribute?(n: string): string | null;
  placeholder?: string;
  tagName?: string;
  type?: string;
}

/** From an id string alone, return the best selector (prefix if it has a numeric suffix). */
export function selectorFromId(id: string): string | null {
  if (!id) return null;
  // Timestamp suffixes: "_1782107186388", or "_PRF1025e8047aba651792939559788" (seat number).
  const m = id.match(/^(.*_)(?:\d{6,}|[A-Z]{2,4}\d[0-9a-f]{12,})$/);
  if (m) return `[id^="${cssEscapeAttr(m[1])}"]`;
  return `#${cssEscapeId(id)}`;
}

/** Best selector for a live element, trying id → name → aria-label → placeholder. */
export function deriveSelector(el: ElementLike): string | null {
  const byId = selectorFromId(el.id ?? "");
  if (byId) return byId;
  if (el.name) return `[name="${cssEscapeAttr(el.name)}"]`;
  const aria = el.getAttribute?.("aria-label");
  if (aria) return `[aria-label="${cssEscapeAttr(aria)}"]`;
  if (el.placeholder) return `[placeholder="${cssEscapeAttr(el.placeholder)}"]`;
  return null;
}

function cssEscapeAttr(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}

function cssEscapeId(s: string): string {
  // Minimal id escaping for selector use (digits-leading, special chars).
  return s.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}
