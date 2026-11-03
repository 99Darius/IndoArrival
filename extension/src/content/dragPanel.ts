const dragged = new WeakSet<HTMLElement>();

/**
 * Slides the panel sideways to the first spot clear of what the traveller must reach,
 * if it's covering any of it. Their own drag always wins. Stays put if nowhere is clear.
 */
export function keepClearOf(host: HTMLElement, targets: Element[]): void {
  if (dragged.has(host)) return;
  const box = host.getBoundingClientRect();
  const rects = targets.map(t => t.getBoundingClientRect()).filter(r => r.width && r.height && r.bottom > box.top && r.top < box.bottom);
  const covers = (left: number) => rects.some(r => r.left < left + box.width && r.right > left);
  if (!covers(box.left)) return;
  const spots = [8, ...rects.map(r => r.right + 8), window.innerWidth - box.width - 8];
  const clear = spots.find(left => left >= 0 && left + box.width <= window.innerWidth && !covers(left));
  if (clear !== undefined) host.style.left = `${clear}px`;
}

/** Back to where the stylesheet puts it, unless the traveller has placed it themselves. */
export function releasePanel(host: HTMLElement): void {
  if (!dragged.has(host)) host.style.left = "";
}

/** Lets the traveller drag the floating panel by its header, off anything it's covering. */
export function makeDraggable(host: HTMLElement, handle: HTMLElement): void {
  handle.style.cursor = "move";
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (start) => {
    if ((start.target as Element).closest("button")) return; // the minimise button stays a button
    const box = host.getBoundingClientRect();
    const grabX = start.clientX - box.left;
    const grabY = start.clientY - box.top;
    handle.setPointerCapture?.(start.pointerId);
    const move = (e: PointerEvent) => {
      dragged.add(host);
      // Keep the header on screen, so it can always be grabbed again.
      const x = Math.min(Math.max(0, e.clientX - grabX), window.innerWidth - box.width);
      const y = Math.min(Math.max(0, e.clientY - grabY), window.innerHeight - handle.offsetHeight);
      host.style.left = `${x}px`;
      host.style.top = `${y}px`;
      host.style.right = "auto";
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  });
}
