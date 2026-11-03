/**
 * Every country's panel uses this while learning: bring the answer just learned into
 * view and flash it, so it's clear it was captured.
 */
export const REVEAL_STYLE = `
 ul { position: relative; } li { transition: background 1.5s; } li.fresh { background: #fdeee9; }`;

export interface Row {
  key: string;
  value: string;
  li: HTMLElement;
}

/** Scroll `body` only as far as needed to show the row: it can sit below an offer or notes. */
function showInBody(li: HTMLElement, body: HTMLElement) {
  const row = li.getBoundingClientRect();
  const view = body.getBoundingClientRect();
  if (row.bottom > view.bottom) body.scrollTop += row.bottom - view.bottom;
  else if (row.top < view.top) body.scrollTop -= view.top - row.top;
}

/**
 * Call after the list is redrawn, with what was shown before. Returns what to pass
 * next time. A panel that has just opened on a recording under way starts at the end.
 */
export function revealNewest(before: Map<string, string>, rows: Row[], list: HTMLElement, body: HTMLElement): Map<string, string> {
  const latest = before.size ? rows.filter(r => before.get(r.key) !== r.value).pop() : rows[rows.length - 1];
  if (latest) {
    const { li } = latest;
    list.scrollTop = li.offsetTop - (list.clientHeight - li.offsetHeight) / 2;
    showInBody(li, body);
    if (before.size) {
      li.classList.add("fresh");
      window.setTimeout(() => li.classList.remove("fresh"), 50);
    }
  }
  return new Map(rows.map(r => [r.key, r.value]));
}
