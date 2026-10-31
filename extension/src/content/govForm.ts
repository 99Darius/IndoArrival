/**
 * Content script for the arrival-card site: the floating panel, the recorder,
 * the popup's "Open the form" click-through and its Fill command. One entry
 * point so all modules share one module graph (and the private event bus).
 * It never advances steps or submits.
 */
import { replayLearned, type FieldMap, type LearnedField } from "./formFill";
import { mountFillButton } from "./fillButton";
import { emit, REPLAYED } from "./bus";
import { OPEN_FORM_KEY } from "../lib/keys";
import fieldMapJson from "../../../config/field-maps/allindonesia.v1.json";
import "./recorder";

mountFillButton();
void continueToForm();

/**
 * After the popup's "Open the arrival card form", the site lands on its home
 * page (it won't open the form directly). Click the foreign-visitor card.
 */
async function continueToForm() {
  if (location.pathname !== "/" || !chrome.storage?.local) return;
  const { [OPEN_FORM_KEY]: at } = await chrome.storage.local.get(OPEN_FORM_KEY);
  if (!at) return;
  await chrome.storage.local.remove(OPEN_FORM_KEY);
  if (Date.now() - (at as number) > 60_000) return;
  for (let t = 0; t < 50; t++) {
    const card = [...document.querySelectorAll("h1")].find((h) => /^(foreign visitors?|pengunjung asing)$/i.test(h.textContent?.trim() ?? ""));
    if (card) return (card.parentElement ?? card).click();
    await new Promise((r) => setTimeout(r, 200));
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "REPLAY_LEARNED") return false;
  replayLearned((msg.fields ?? []) as LearnedField[], fieldMapJson as unknown as FieldMap)
    .then((result) => {
      emit(REPLAYED, msg.travellerId as string | undefined);
      sendResponse({ ok: true, result });
    })
    .catch((e) => sendResponse({ ok: false, error: (e as Error).message }));
  return true;
});
