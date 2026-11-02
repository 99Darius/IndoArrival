/**
 * When to ask for a Chrome Web Store review: after the 3rd arrival card filled,
 * then every 5 cards, until the user leaves a review or says never.
 * A card counts once, when Fill runs on its last page (the declaration).
 */
export const REVIEW_URL = "https://chromewebstore.google.com/detail/emdkbckehgnfnjggcfndccmjahncjkmc/reviews";
export const FIRST_ASK = 3;
export const ASK_EVERY = 5;

export interface ReviewState {
  /** Arrival cards filled (Fill pressed on the declaration page). */
  fills: number;
  /** Times the ask has been shown. */
  asks: number;
  /** Ask again once `fills` reaches this. */
  nextAt: number;
  /** Reviewed or chose "never": don't ask again. */
  stopped: boolean;
}

export const initialReview = (): ReviewState => ({ fills: 0, asks: 0, nextAt: FIRST_ASK, stopped: false });

export const isLastPage = (path: string) => /declaration/.test(path);

/** Count one filled card; `ask` says whether to show the review ask now (already recorded as shown). */
export function countFill(prev: ReviewState | undefined): { state: ReviewState; ask: boolean } {
  const s = { ...initialReview(), ...prev };
  s.fills += 1;
  if (s.stopped || s.fills < s.nextAt) return { state: s, ask: false };
  // Showing counts as an ask: ignoring it is the same as "Not now".
  return { state: { ...s, asks: s.asks + 1, nextAt: s.fills + ASK_EVERY }, ask: true };
}

/** "Never ask again" is offered from the second ask onwards. */
export const offerNever = (s: ReviewState) => s.asks >= 2;
