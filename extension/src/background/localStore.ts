/**
 * Storage for travellers. Everything lives in chrome.storage.local in this
 * browser profile — there is no server. Not encrypted by the extension (same
 * trust level as the browser's own autofill data).
 */
import type { LearnedField } from "../content/formFill";
import { ACTIVE_PROFILE_KEY, DRAFT_KEY, LEARNED_KEY, OPEN_FORM_KEY, REVIEW_KEY } from "../lib/keys";

export interface LocalProfile {
  id: string;
  label: string;
  /** Answers typed into the pre-1.0 profile form; migrated to `learned` (see travellers.ts). */
  values: Record<string, string>;
  /** This traveller's answers, learned on the form. */
  learned?: LearnedField[];
}

export const PROFILES_KEY = "local_profiles";
/** Written by pre-1.0 builds; still erased by "Erase all data". */
const LEGACY_KEYS = ["local_submissions", "local_trip_defaults"];

// Serialize every read-modify-write of traveller data so concurrent messages
// (popup, panel, corrections) can't interleave and lose or misfile a write.
let mutationLock: Promise<unknown> = Promise.resolve();
export function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = mutationLock.then(fn, fn);
  mutationLock = run.catch(() => undefined);
  return run;
}

export function wipeAll(): Promise<{ ok: true }> {
  return serialize(async () => {
    await chrome.storage.local.remove([PROFILES_KEY, LEARNED_KEY, DRAFT_KEY, OPEN_FORM_KEY, ACTIVE_PROFILE_KEY, REVIEW_KEY, ...LEGACY_KEYS]);
    return { ok: true } as const;
  });
}
