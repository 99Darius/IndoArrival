/** chrome.storage.local keys shared by the popup, background and content scripts. */

/** The finished demonstration: fields + values replayed by "Fill". */
export const LEARNED_KEY = "learned";

/**
 * The in-progress demonstration, written by the recorder as the user types so a
 * page load, step navigation or closed tab doesn't lose it.
 */
export const DRAFT_KEY = "recording_draft";

export interface RecordingDraft<F = unknown> {
  active: boolean;
  fields: F[];
  /** The traveller being learned; answers are saved to them, whoever is active by then. */
  travellerId?: string;
}

/** Set by the popup's "Open the form": the home page then clicks through to the foreign-visitor card. */
export const OPEN_FORM_KEY = "open_form_pending";

/** Which traveller's answers are loaded into LEARNED_KEY. */
export const ACTIVE_PROFILE_KEY = "active_profile";
