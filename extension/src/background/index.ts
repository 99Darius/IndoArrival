/**
 * Background service worker: the only writer of saved answers. Content scripts
 * and the popup send messages; traveller data changes here, one at a time.
 * Each country has its own travellers: messages say `country: "th"` for Thailand,
 * and anything else is Indonesia. Nothing is sent off the device.
 */
import { wipeAll } from "./localStore";
import * as indonesia from "./travellers";
import * as thailand from "./th/travellers";
import { closeOffer, offersFor, reopenOffer } from "./sharedAnswers";
import { LEARNED_KEY } from "../lib/keys";
import { LEARNED_KEY as TH_LEARNED_KEY } from "../lib/keysTh";
import type { LearnedField } from "../content/formFill";
import type { Answer } from "../content/th/fields";

async function handle(msg: { type: string; country?: string; [k: string]: unknown }): Promise<unknown> {
  const thai = msg.country === "th";
  const store = thai ? thailand : indonesia;
  switch (msg.type) {
    case "GET_TRAVELLERS":
      return { ok: true, ...(await store.listTravellers()) };
    case "SELECT_TRAVELLER":
      return { ok: true, ...(await store.selectTraveller(msg.id as string)) };
    case "ADD_TRAVELLER":
      return { ok: true, ...(await store.addTraveller(String(msg.label ?? "").trim() || "Traveller")) };
    case "DELETE_TRAVELLER":
      return { ok: true, ...(await store.removeTraveller(msg.id as string)) };
    case "SAVE_LEARNED":
      // End of a recording: merge into the traveller being learned.
      return { ok: true, ...(thai ? await thailand.saveRecording((msg.fields ?? []) as Answer[]) : await indonesia.saveRecording((msg.fields ?? []) as LearnedField[])) };
    case "LEARN_UPDATE":
      // A correction after Fill: only applies if that traveller is still active.
      return { ok: true, ...(thai ? await thailand.learnUpdate(msg.travellerId as string, (msg.fields ?? []) as Answer[]) : await indonesia.learnUpdate(msg.travellerId as string, (msg.fields ?? []) as LearnedField[])) };
    case "GET_LEARNED": {
      const key = thai ? TH_LEARNED_KEY : LEARNED_KEY;
      const { [key]: learned } = await chrome.storage.local.get(key);
      return { ok: true, learned: learned ?? [] };
    }
    case "GET_SHARED":
      // What the other country has saved that could help the traveller being taught.
      return { ok: true, ...(await offersFor(thai ? "th" : "id", msg.travellerId as string)) };
    case "CLOSE_SHARED":
      return { ok: true, ...(await closeOffer(thai ? "th" : "id", msg.travellerId as string)) };
    case "REOPEN_SHARED":
      return { ok: true, ...(await reopenOffer(thai ? "th" : "id", msg.travellerId as string)) };
    case "WIPE_DATA":
      return { ok: true, result: await wipeAll() };
    default:
      return { ok: false, error: "unknown message" };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handle(msg)
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, error: (e as Error).message }));
  return true; // async
});
