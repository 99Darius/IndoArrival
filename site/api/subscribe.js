// Website signup for ArrivalFiller update emails. Stores only the email address.
import { addSubscriber } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }
  const email = (req.body && req.body.email ? String(req.body.email) : "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: "invalid email" });
  }
  try {
    await addSubscriber(email, "site");
  } catch (err) {
    console.error("subscribe failed:", err.message);
    return res.status(500).json({ error: "could not save, try again" });
  }
  return res.status(204).end();
}
