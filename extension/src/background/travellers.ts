/**
 * Travellers: each saved profile carries its own learned answers. The profile
 * is the source of truth; LEARNED_KEY is a read-only mirror of the active
 * traveller's answers for the content scripts, written only here. Every change
 * names the traveller it belongs to, so nothing lands on the wrong person. Also
 * migrates older data:
 *   - profiles saved with the old profile form (PII values only) get learned
 *     answers derived from the step-1 field map, so they can fill right away;
 *   - a learned set saved before profiles existed is attached to the only
 *     profile, or to a new "Me" profile.
 */
import fieldMapJson from "../../../config/field-maps/allindonesia.v1.json";
import type { FieldMap, LearnedField } from "../content/formFill";
import { sameChoice } from "../lib/choice";
import { fieldKey } from "../content/formFields";
import { rememberable } from "../content/tripDefaults";
import { ACTIVE_PROFILE_KEY, DRAFT_KEY, LEARNED_KEY, type RecordingDraft } from "../lib/keys";
import { PROFILES_KEY, serialize, type LocalProfile } from "./localStore";

const fieldMap = fieldMapJson as unknown as FieldMap;

export interface Traveller {
  id: string;
  label: string;
  count: number;
}

/** Old-style profile values -> answers the fill engine can replay on step 1. */
export function legacyToLearned(values: Record<string, string>, map: FieldMap = fieldMap): LearnedField[] {
  const step = map.steps[0];
  const out: LearnedField[] = [];
  for (const f of step?.fields ?? []) {
    const value = values[f.key]?.trim();
    if (!value) continue;
    if (f.control === "text") out.push({ selector: f.selector, control: "text", value, step: step.path, label: f.key });
    else if (f.control === "dropdown" && f.key !== "occupation") out.push({ selector: f.selector, control: "dropdown", value, step: step.path, label: f.key });
    else if (f.control === "radio") out.push({ selector: f.selector, control: "choice", value, step: step.path, label: f.key });
  }
  return out;
}

/** Recorded answers win; legacy values only fill selectors the recording lacks. */
function merge(learned: LearnedField[], extra: LearnedField[]): LearnedField[] {
  const have = new Set(learned.map((f) => f.selector).filter(Boolean));
  return [...learned, ...extra.filter((f) => !have.has(f.selector))];
}

async function load() {
  const res = await chrome.storage.local.get([PROFILES_KEY, LEARNED_KEY, ACTIVE_PROFILE_KEY]);
  return {
    profiles: (res[PROFILES_KEY] as LocalProfile[] | undefined) ?? [],
    learned: (res[LEARNED_KEY] as LearnedField[] | undefined) ?? [],
    active: res[ACTIVE_PROFILE_KEY] as string | undefined,
  };
}

async function save(profiles: LocalProfile[], activeId: string | undefined) {
  const active = profiles.find((p) => p.id === activeId);
  await chrome.storage.local.set({
    [PROFILES_KEY]: profiles,
    [ACTIVE_PROFILE_KEY]: active?.id ?? null,
    [LEARNED_KEY]: active?.learned ?? [],
  });
}

const view = (profiles: LocalProfile[], activeId?: string) => ({
  travellers: profiles.map((p): Traveller => ({ id: p.id, label: p.label, count: p.learned?.length ?? 0 })),
  activeId: profiles.some((p) => p.id === activeId) ? activeId : undefined,
});

export function listTravellers() {
  return serialize(async () => {
    let { profiles, learned, active } = await load();
    let dirty = false;
    if (!profiles.length && learned.length) {
      profiles = [{ id: crypto.randomUUID(), label: "Me", values: {}, learned }];
      active = profiles[0].id;
      dirty = true;
    }
    for (const p of profiles) {
      if (!p.learned) { p.learned = legacyToLearned(p.values ?? {}); dirty = true; }
    }
    if (!profiles.some((p) => p.id === active) && profiles.length) { active = profiles[0].id; dirty = true; }
    // Answers learned before travellers existed belong to the only traveller.
    const current = profiles.find((p) => p.id === active);
    if (current && profiles.length === 1 && learned.length && !current.learned!.some((f) => f.step !== legacyStep())) {
      current.learned = merge(learned, current.learned!);
      dirty = true;
    }
    if (dirty) await save(profiles, active);
    return view(profiles, active);
  });
}

const legacyStep = () => fieldMap.steps[0]?.path;

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
    const p: LocalProfile = { id: crypto.randomUUID(), label, values: {}, learned: [] };
    profiles.push(p);
    await save(profiles, p.id);
    return view(profiles, p.id);
  });
}

export function removeTraveller(id: string) {
  return serialize(async () => {
    const { profiles, active } = await load();
    const rest = profiles.filter((p) => p.id !== id);
    const next = active === id ? rest[0]?.id : active;
    await save(rest, next);
    return view(rest, next);
  });
}

/**
 * Merge new answers over a traveller's saved ones: same field -> new value wins;
 * fields on pages not covered by `fields` are kept. Older selector-less copies
 * of a choice that was just answered are retired.
 */
export function mergeAnswers(saved: LearnedField[], fields: LearnedField[]): LearnedField[] {
  const byKey = new Map(saved.filter(rememberable).map((f) => [fieldKey(f), f]));
  for (const { options, ...f } of fields) {
    if (!rememberable(f)) continue;
    if (options?.length) {
      for (const [k, old] of byKey) {
        if (!old.selector && old.step === f.step && options.some((o) => sameChoice(o, old.value))) byKey.delete(k);
      }
    }
    byKey.set(fieldKey(f), f);
  }
  return [...byKey.values()];
}

async function writeAnswers(id: string | undefined, fields: LearnedField[]) {
  const { profiles, active } = await load();
  const p = profiles.find((x) => x.id === id);
  if (!p || !fields.length) return { saved: 0 };
  p.learned = mergeAnswers(p.learned ?? [], fields);
  await chrome.storage.local.set({ [PROFILES_KEY]: profiles, ...(id === active ? { [LEARNED_KEY]: p.learned } : {}) });
  return { saved: fields.length, total: p.learned.length, label: p.label as string | undefined };
}

/** End of a recording. Nothing captured = nothing changes (never wipes answers). */
export function saveRecording(fields: LearnedField[]) {
  return serialize(async () => {
    const res = await chrome.storage.local.get([DRAFT_KEY, ACTIVE_PROFILE_KEY]);
    const draft = res[DRAFT_KEY] as RecordingDraft | undefined;
    const out = await writeAnswers(draft?.travellerId ?? res[ACTIVE_PROFILE_KEY], fields);
    await chrome.storage.local.remove(DRAFT_KEY); // recording is over, in every tab
    return out;
  });
}

/** A correction made after Fill. Dropped if another traveller has been picked since. */
export function learnUpdate(travellerId: string, fields: LearnedField[]) {
  return serialize(async () => {
    const { active } = await load();
    if (!travellerId || travellerId !== active) return { saved: 0 };
    return writeAnswers(travellerId, fields);
  });
}
