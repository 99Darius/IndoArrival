/**
 * chrome.storage.local keys for Thailand's card. Same names as lib/keys.ts so the
 * Thai code reads the same, but separate values: answers learned on one country's
 * form have a different shape and never mix with the other's.
 */
export type { RecordingDraft } from "./keys";

export const LEARNED_KEY = "th_learned";
export const DRAFT_KEY = "th_recording_draft";
export const ACTIVE_PROFILE_KEY = "th_active_profile";
export const PROFILES_KEY = "th_local_profiles";
