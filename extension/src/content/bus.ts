/**
 * Private channel between the content-script modules (panel, recorder, replay).
 * They share one isolated world and one module graph, so an in-module
 * EventTarget can't be seen or spoofed by the government page — unlike window
 * events, which page scripts could dispatch.
 */
export const bus = new EventTarget();

/** Replay is filling the page: the recorder must ignore the events it causes. */
export const REPLAY_START = "replay-start";
export const REPLAY_END = "replay-end";
/** Replay finished on this page for a traveller: corrections here may update them. */
export const REPLAYED = "replayed";
/** Panel asks the recorder to save; recorder answers with SAVED (detail: ok). */
export const SAVE_RECORDING = "save-recording";
export const SAVED = "saved";

export const emit = (type: string, detail?: unknown) => bus.dispatchEvent(new CustomEvent(type, { detail }));
