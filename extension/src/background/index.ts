/**
 * Background service worker: the only writer of saved answers. Content scripts
 * and the popup send messages; traveller data changes here, one at a time.
 * Nothing is sent off the device.
 */
import { wipeAll } from "./localStore";
import { addTraveller, learnUpdate, listTravellers, removeTraveller, saveRecording, selectTraveller } from "./travellers";
import { LEARNED_KEY } from "../lib/keys";
import type { LearnedField } from "../content/formFill";

async function handle(msg: { type: string; [k: string]: unknown }): Promise<unknown> {
  switch (msg.type) {
    case "GET_TRAVELLERS":
      return { ok: true, ...(await listTravellers()) };
    case "SELECT_TRAVELLER":
      return { ok: true, ...(await selectTraveller(msg.id as string)) };
    case "ADD_TRAVELLER":
      return { ok: true, ...(await addTraveller(String(msg.label ?? "").trim() || "Traveller")) };
    case "DELETE_TRAVELLER":
      return { ok: true, ...(await removeTraveller(msg.id as string)) };
    case "SAVE_LEARNED":
      // End of a recording: merge into the traveller being learned.
      return { ok: true, ...(await saveRecording((msg.fields ?? []) as LearnedField[])) };
    case "LEARN_UPDATE":
      // A correction after Fill: only applies if that traveller is still active.
      return { ok: true, ...(await learnUpdate(msg.travellerId as string, (msg.fields ?? []) as LearnedField[])) };
    case "GET_LEARNED": {
      const { [LEARNED_KEY]: learned } = await chrome.storage.local.get(LEARNED_KEY);
      return { ok: true, learned: learned ?? [] };
    }
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
