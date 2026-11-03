import { vi } from "vitest";

const undo: (() => void)[] = [];

/**
 * vi.resetModules() reloads a content script but leaves the last copy's page
 * listeners and timers alive, and those write into the next test's storage. Call
 * this before each load to shut the last copy down. Fake timers need no help:
 * vi.useFakeTimers() drops whatever was pending.
 */
export function shutDownLastLoad() {
  for (const fn of undo.splice(0).reverse()) fn();
  for (const target of [document, window] as EventTarget[]) {
    const add = target.addEventListener;
    target.addEventListener = function (type: string, fn: EventListenerOrEventListenerObject | null, opts?: boolean | AddEventListenerOptions) {
      undo.push(() => target.removeEventListener(type, fn, opts));
      return add.call(target, type, fn, opts);
    };
    undo.push(() => { target.addEventListener = add; });
  }
  if (vi.isFakeTimers()) return;
  const set = window.setTimeout;
  window.setTimeout = ((...args: Parameters<typeof window.setTimeout>) => {
    const id = set(...args);
    undo.push(() => window.clearTimeout(id));
    return id;
  }) as typeof window.setTimeout;
  undo.push(() => { window.setTimeout = set; });
}
