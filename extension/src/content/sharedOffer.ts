/**
 * "We saw these in your saved records": shown in the on-page panel while a traveller
 * is being taught. Nothing reaches the form until they press Use these, and it only
 * counts as learned once they save the recording.
 */
import type { CountryId } from "../lib/countries";
import type { ShareItem } from "../lib/commonAnswers";

export const OFFER_STYLE = `
 .offer { margin: 8px 0 10px; padding: 10px; border-radius: 9px; background: #e6f2ed; }
 .offer h3 { font-size: 13px; margin: 0 0 4px; } .offer p { margin: 0 0 6px; font-size: 12px; }
 .offer ul { max-height: 130px; margin: 4px 0 6px; } .offer .who { font-size: 12px; font-weight: 700; margin-top: 8px; }
 .offer .use { width: 100%; padding: 7px; background: #0E3A34; color: white; font-weight: 700; }
 .offer .no { background: none; color: #0E3A34; text-decoration: underline; padding: 6px 0 0; font-size: 12px; }
`;

interface Offer { fromId: string; label: string; fromCountry: string; items: ShareItem[] }

export interface OfferOptions {
  country: CountryId;
  /** Fill the items whose fields are all blank; says how it went. */
  use(items: ShareItem[]): Promise<{ filled: number; text: string }>;
  say(text: string): void;
}

export function createOffer({ country, use, say }: OfferOptions) {
  const el = document.createElement("div");
  el.className = "offer";
  el.hidden = true;
  let askedFor: string | undefined;
  let offers: Offer[] = [];
  let closed = false;

  const send = (type: string, travellerId: string) => chrome.runtime.sendMessage({ type, country, travellerId });
  function close(travellerId: string) {
    closed = true;
    el.hidden = true;
    void send("CLOSE_SHARED", travellerId).catch(() => undefined);
  }

  function draw(travellerId: string) {
    const head = document.createElement("h3"); head.textContent = "We saw these in your saved records";
    const ask = document.createElement("p"); ask.textContent = "Want to use them here? Check they're yours, and still right.";
    const blocks = offers.flatMap((o) => {
      const who = document.createElement("div"); who.className = "who"; who.textContent = `${o.label} (${o.fromCountry})`;
      const list = document.createElement("ul");
      list.replaceChildren(...o.items.map((i) => {
        const li = document.createElement("li");
        const label = document.createElement("strong"); label.textContent = i.label;
        const value = document.createElement("span"); value.textContent = i.value;
        li.append(label, value);
        return li;
      }));
      const button = document.createElement("button"); button.type = "button"; button.className = "use";
      // Always the name: this puts someone's passport on a legal form.
      button.textContent = `Use ${o.label}'s`;
      button.addEventListener("click", async () => {
        el.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        say("Filling…");
        try {
          const { filled, text } = await use(o.items);
          say(text);
          // Nothing filled: leave the offer up rather than never asking again.
          if (filled) close(travellerId);
          else el.querySelectorAll("button").forEach((b) => { b.disabled = false; });
        } catch {
          say("Couldn't fill those. Fill them yourself, or refresh the page and try again.");
          el.querySelectorAll("button").forEach((b) => { b.disabled = false; });
        }
      });
      return [who, list, button];
    });
    const no = document.createElement("button"); no.type = "button"; no.className = "no"; no.textContent = "No thanks";
    no.addEventListener("click", () => close(travellerId));
    el.replaceChildren(head, ask, ...blocks, no);
  }

  /** Called on every panel render: asks the background once per traveller being taught. */
  function update(travellerId: string | undefined, onFirstStep: boolean) {
    if (!travellerId || !chrome.runtime?.sendMessage) {
      // Forget it all: by the next recording those records may have been deleted.
      askedFor = undefined;
      offers = [];
      el.hidden = true;
      return;
    }
    if (askedFor !== travellerId) {
      askedFor = travellerId;
      offers = [];
      closed = false;
      void send("GET_SHARED", travellerId).then((res) => {
        if (askedFor !== travellerId) return;
        offers = res?.offers ?? [];
        if (offers.length) draw(travellerId);
        el.hidden = !(offers.length && onFirstStep);
      }).catch(() => undefined);
    }
    el.hidden = closed || !offers.length || !onFirstStep;
  }

  return { el, update };
}
