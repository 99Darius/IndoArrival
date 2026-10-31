// Update-email list, kept as one encrypted Vercel Blob object (no database).
// The payload is AES-256-GCM encrypted with LEADS_ENC_KEY, so the stored file
// is ciphertext even if the private blob URL ever leaked.
//
// Read-modify-write on one object: two signups in the same instant can race
// (last writer wins). Fine at this volume; switch to put()'s ifMatch if it isn't.
import crypto from "node:crypto";
import { get, put } from "@vercel/blob";

const BLOB_PATH = "subscribers.json.enc";

function key() {
  const hex = process.env.LEADS_ENC_KEY;
  if (!hex || hex.length !== 64) throw new Error("LEADS_ENC_KEY missing or not 32 bytes (64 hex chars)");
  return Buffer.from(hex, "hex");
}

// iv(12) | authTag(16) | ciphertext, base64-encoded.
function encrypt(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

function decrypt(b64) {
  const raw = Buffer.from(b64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"));
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// A missing blob means no subscribers yet. A decrypt failure is thrown, never
// treated as empty: that would overwrite the real list.
export async function readSubscribers() {
  const res = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!res || !res.stream) return [];
  const b64 = await streamToString(res.stream);
  return b64.trim() ? decrypt(b64).subscribers || [] : [];
}

// Adds the email unless already present (case-insensitive). True if newly added.
export async function addSubscriber(email, source) {
  const subscribers = await readSubscribers();
  const lower = email.toLowerCase();
  if (subscribers.some((s) => s.email.toLowerCase() === lower)) return false;
  subscribers.push({ email, ts: new Date().toISOString(), source });
  await put(BLOB_PATH, encrypt({ subscribers }), {
    access: "private",
    contentType: "text/plain",
    allowOverwrite: true,
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
  return true;
}
