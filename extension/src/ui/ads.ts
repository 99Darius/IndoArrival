/** Picks which advertiser shows in the footer. Each country lists its own in popup/countries.ts. */
import { AD_TURN_KEY } from "../lib/keys";

export type Ad = "rumah123" | "theasianparent";

let turn: Promise<number> | undefined;

/**
 * Advances once per popup open, so moving between screens doesn't swap the ad. The
 * counter stays in this browser and is never sent anywhere.
 */
function turnForThisOpen(): Promise<number> {
  turn ??= (async () => {
    try {
      const saved = (await chrome.storage.local.get(AD_TURN_KEY))[AD_TURN_KEY];
      const now = Number.isInteger(saved) && (saved as number) >= 0 ? (saved as number) : 0;
      await chrome.storage.local.set({ [AD_TURN_KEY]: (now + 1) % 1000 });
      return now;
    } catch {
      return 0;
    }
  })();
  return turn;
}

/** The ad to show now, from a country's list. */
export async function adForThisOpen(ads: readonly Ad[]): Promise<Ad> {
  return ads[(await turnForThisOpen()) % ads.length];
}
