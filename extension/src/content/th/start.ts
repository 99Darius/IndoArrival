/**
 * Runs the TDAC content script: the floating panel, the recorder and the
 * popup's Fill command. One entry point so all modules share one module graph
 * (and the private event bus). It never advances steps or submits.
 */
import { fillStep } from "./fill";
import { mountPanel } from "./panel";
import { emit, REPLAYED } from "../bus";
import type { Answer } from "./fields";
import "./recorder";

mountPanel();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "REPLAY_LEARNED") return false;
  fillStep((msg.fields ?? []) as Answer[])
    .then(result => {
      emit(REPLAYED, msg.travellerId as string | undefined);
      sendResponse({ ok: true, result });
    })
    .catch(e => sendResponse({ ok: false, error: (e as Error).message }));
  return true;
});
