/** What differs between the countries in the popup: where the form lives and how to talk about it. */
import type { CountryId } from "../lib/countries";
import { DRAFT_KEY, OPEN_FORM_KEY } from "../lib/keys";
import { DRAFT_KEY as TH_DRAFT_KEY } from "../lib/keysTh";
import type { Ad } from "../ui/ads";

export interface Country {
  id: CountryId;
  name: string;
  draftKey: string;
  site: RegExp;
  form: RegExp;
  /** What one Fill covers. */
  unit: "page" | "step";
  /** What the Start button opens. */
  opens: "the form" | "the site";
  /** Whether this tab is far enough along that Start needn't open anything. */
  arrived(at: { onSite: boolean; onForm: boolean }): boolean;
  /** Open a new tab at the country's arrival card. */
  open(): Promise<void>;
  learningHint: string;
  fillHint: string;
  learnHint: string;
  fillError: string;
  /** Take turns in the footer. theAsianparent suits every country; the others are local. */
  ads: readonly Ad[];
  /** The human must click through to the form; shown when on the site but not on the form yet. */
  clickThrough?: string;
}

export const INDONESIA: Country = {
  id: "id",
  name: "Indonesia",
  draftKey: DRAFT_KEY,
  site: /^https:\/\/allindonesia\.imigrasi\.go\.id\//,
  form: /^https:\/\/allindonesia\.imigrasi\.go\.id\/arrival-card-submission\//,
  unit: "page",
  opens: "the form",
  arrived: ({ onForm }) => onForm,
  async open() {
    // The form page can't be opened directly: the site bounces a fresh visit to
    // its home page. So open home and let the content script click through.
    await chrome.storage.local.set({ [OPEN_FORM_KEY]: Date.now() });
    await chrome.tabs.create({ url: "https://allindonesia.imigrasi.go.id/" });
  },
  learningHint: "Fill the arrival card as usual, page by page. When you're done, open this again and press Done.",
  fillHint: "Press Fill on each page of the form. You check every answer and press Next and Submit yourself.",
  learnHint: "Fill the form once as usual. Answers are remembered for next time.",
  fillError: "Refresh the form page (⌘R), then press Fill again.",
  ads: ["rumah123", "theasianparent"],
};

export const THAILAND: Country = {
  id: "th",
  name: "Thailand",
  draftKey: TH_DRAFT_KEY,
  site: /^https:\/\/tdac\.immigration\.go\.th\//,
  form: /^https:\/\/tdac\.immigration\.go\.th\/arrival-card\/#\/tac\/arrival-card\/add(?!\/submitted)(\/|\?|$)/,
  unit: "step",
  opens: "the site",
  arrived: ({ onSite }) => onSite,
  // The form sits behind the site's own bot check, so the human clicks through to it.
  async open() {
    await chrome.tabs.create({ url: "https://tdac.immigration.go.th/" });
  },
  learningHint: "Press Arrival Card on the site, then fill every step as usual, up to your email and the agreement on the last page. When you're done, open this again and press Done.",
  fillHint: "Press Fill on each step. You check every answer and press Continue and Submit yourself.",
  learnHint: "Fill the form once as usual. Answers are remembered for next time.",
  fillError: "Press Fill on the form's own panel, or refresh the page and start again.",
  ads: ["theasianparent"],
  clickThrough: "Arrival Card",
};

export const COUNTRIES = [INDONESIA, THAILAND];
