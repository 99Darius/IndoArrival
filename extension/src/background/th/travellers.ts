/**
 * Travellers: each saved profile carries its own learned answers. The profile
 * is the source of truth; LEARNED_KEY is a read-only mirror of the active
 * traveller's answers for the content scripts, written only here. Every change
 * names the traveller it belongs to, so nothing lands on the wrong person.
 */
import { isAllowed, type Answer } from "../../content/th/fields";
import { ACTIVE_PROFILE_KEY, DRAFT_KEY, LEARNED_KEY, PROFILES_KEY, type RecordingDraft } from "../../lib/keysTh";
import { serialize } from "../localStore";

interface LocalProfile {
  id: string;
  label: string;
  learned: Answer[];
}

export interface Traveller {
  id: string;
  label: string;
  count: number;
}

async function load() {
  const res = await chrome.storage.local.get([PROFILES_KEY, ACTIVE_PROFILE_KEY]);
  return {
    profiles: (res[PROFILES_KEY] as LocalProfile[] | undefined) ?? [],
    active: res[ACTIVE_PROFILE_KEY] as string | undefined,
  };
}

async function save(profiles: LocalProfile[], activeId: string | undefined) {
  const active = profiles.find(p => p.id === activeId);
  await chrome.storage.local.set({
    [PROFILES_KEY]: profiles,
    [ACTIVE_PROFILE_KEY]: active?.id ?? null,
    [LEARNED_KEY]: active?.learned ?? [],
  });
}

const view = (profiles: LocalProfile[], activeId?: string) => ({
  travellers: profiles.map((p): Traveller => ({ id: p.id, label: p.label, count: p.learned.length })),
  activeId: profiles.some(p => p.id === activeId) ? activeId : undefined,
});

export function listTravellers() {
  return serialize(async () => {
    const { profiles, active } = await load();
    if (!profiles.some(p => p.id === active) && profiles.length) {
      await save(profiles, profiles[0].id);
      return view(profiles, profiles[0].id);
    }
    return view(profiles, active);
  });
}

export function selectTraveller(id: string) {
  return serialize(async () => {
    const { profiles } = await load();
    await save(profiles, id);
    return view(profiles, id);
  });
}

export function addTraveller(label: string) {
  return serialize(async () => {
    const { profiles } = await load();
    const p: LocalProfile = { id: crypto.randomUUID(), label, learned: [] };
    profiles.push(p);
    await save(profiles, p.id);
    return view(profiles, p.id);
  });
}

export function removeTraveller(id: string) {
  return serialize(async () => {
    const { profiles, active } = await load();
    const rest = profiles.filter(p => p.id !== id);
    const next = active === id ? rest[0]?.id : active;
    await save(rest, next);
    return view(rest, next);
  });
}

/**
 * Merge new answers over a traveller's saved ones: same field -> new value wins,
 * an emptied field is forgotten, other fields are kept. Fields outside the known
 * list are refused, so a bad message can't add anything else to the store.
 */
export function mergeAnswers(saved: Answer[], fields: Answer[]): Answer[] {
  const byKey = new Map(saved.map(a => [a.key, a]));
  for (const a of fields) {
    if (!isAllowed(a.key)) continue;
    if (a.value) byKey.set(a.key, a);
    else byKey.delete(a.key);
  }
  return [...byKey.values()];
}

async function writeAnswers(id: string | undefined, fields: Answer[]) {
  const { profiles, active } = await load();
  const p = profiles.find(x => x.id === id);
  if (!p || !fields.length) return { saved: 0 };
  // Strip the transient flag: an emptied answer is simply removed.
  p.learned = mergeAnswers(p.learned, fields).map(({ cleared: _cleared, ...a }) => a);
  await chrome.storage.local.set({ [PROFILES_KEY]: profiles, ...(id === active ? { [LEARNED_KEY]: p.learned } : {}) });
  return { saved: fields.filter(a => a.value).length, total: p.learned.length, label: p.label };
}

/** End of a recording. Nothing captured = nothing changes (never wipes answers). */
export function saveRecording(fields: Answer[]) {
  return serialize(async () => {
    const res = await chrome.storage.local.get([DRAFT_KEY, ACTIVE_PROFILE_KEY]);
    const draft = res[DRAFT_KEY] as RecordingDraft | undefined;
    const out = await writeAnswers(draft?.travellerId ?? res[ACTIVE_PROFILE_KEY], fields);
    await chrome.storage.local.remove(DRAFT_KEY); // recording is over, in every tab
    return out;
  });
}

/** A correction made after Fill. Dropped if another traveller has been picked since. */
export function learnUpdate(travellerId: string, fields: Answer[]) {
  return serialize(async () => {
    const { active } = await load();
    if (!travellerId || travellerId !== active) return { saved: 0 };
    return writeAnswers(travellerId, fields);
  });
}
