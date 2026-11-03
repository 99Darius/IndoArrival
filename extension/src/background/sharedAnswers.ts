/**
 * Offers a traveller being taught on one form the answers already saved on the
 * other. Only read here: nothing is copied until the traveller chooses to use an
 * offer and then saves their recording. An offer is only ever made for the traveller
 * being recorded right now, and asked once per traveller per country.
 */
import { fromIndonesia, fromThailand, indonesiaItems, thailandItems, type Common, type ShareItem } from "../lib/commonAnswers";
import type { CountryId } from "../lib/countries";
import { DRAFT_KEY, SHARED_CLOSED_KEY, type RecordingDraft } from "../lib/keys";
import * as TH from "../lib/keysTh";
import type { LearnedField } from "../content/formFill";
import type { Answer } from "../content/th/fields";
import { PROFILES_KEY, serialize } from "./localStore";

interface Saved<A> { id: string; label: string; learned?: A[] }

export interface Offer {
  fromId: string;
  label: string;
  fromCountry: string;
  items: ShareItem[];
}

const norm = (s: string) => s.trim().toLowerCase();
const closedId = (country: CountryId, travellerId: string) => `${country}:${travellerId}`;
const MAX_OFFERS = 5;

export function offersFor(country: CountryId, travellerId: string) {
  return serialize(async () => {
    const res = await chrome.storage.local.get([PROFILES_KEY, TH.PROFILES_KEY, DRAFT_KEY, TH.DRAFT_KEY, SHARED_CLOSED_KEY]);
    const draft = res[country === "th" ? TH.DRAFT_KEY : DRAFT_KEY] as RecordingDraft | undefined;
    if (!draft?.active || draft.travellerId !== travellerId) return { offers: [] as Offer[] };
    if (((res[SHARED_CLOSED_KEY] as string[] | undefined) ?? []).includes(closedId(country, travellerId))) return { offers: [] as Offer[] };

    const indo = (res[PROFILES_KEY] as Saved<LearnedField>[] | undefined) ?? [];
    const thai = (res[TH.PROFILES_KEY] as Saved<Answer>[] | undefined) ?? [];
    const toThailand = country === "th";
    const me = toThailand ? thai.find((p) => p.id === travellerId) : indo.find((p) => p.id === travellerId);
    if (!me) return { offers: [] as Offer[] };
    // Don't offer what this traveller has already answered on this form.
    const known: Common = toThailand ? fromThailand((me.learned ?? []) as Answer[]) : fromIndonesia((me.learned ?? []) as LearnedField[]);
    const others = toThailand
      ? indo.map((p) => ({ p, items: thailandItems(fromIndonesia(p.learned ?? [])) as ShareItem[] }))
      : thai.map((p) => ({ p, items: indonesiaItems(fromThailand(p.learned ?? [])) as ShareItem[] }));
    const offers = others
      .map(({ p, items }): Offer => ({ fromId: p.id, label: p.label, fromCountry: toThailand ? "Indonesia" : "Thailand", items: items.filter((i) => !known[i.key]) }))
      .filter((o) => o.items.length)
      // The same name is most likely the same person, so it comes first. The traveller still chooses.
      .sort((a, b) => Number(norm(b.label) === norm(me.label)) - Number(norm(a.label) === norm(me.label)))
      .slice(0, MAX_OFFERS);
    return { offers };
  });
}

/** Used or turned down: don't ask again for this traveller on this form. */
export function closeOffer(country: CountryId, travellerId: string) {
  return serialize(async () => {
    const res = await chrome.storage.local.get(SHARED_CLOSED_KEY);
    const closed = (res[SHARED_CLOSED_KEY] as string[] | undefined) ?? [];
    const id = closedId(country, travellerId);
    if (!closed.includes(id)) await chrome.storage.local.set({ [SHARED_CLOSED_KEY]: [...closed, id] });
    return { closed: true };
  });
}

/** The recording was cancelled, so whatever was used wasn't kept: the offer can come back. */
export function reopenOffer(country: CountryId, travellerId: string) {
  return serialize(async () => {
    const res = await chrome.storage.local.get(SHARED_CLOSED_KEY);
    const closed = (res[SHARED_CLOSED_KEY] as string[] | undefined) ?? [];
    const id = closedId(country, travellerId);
    if (closed.includes(id)) await chrome.storage.local.set({ [SHARED_CLOSED_KEY]: closed.filter((c) => c !== id) });
    return { closed: false };
  });
}
