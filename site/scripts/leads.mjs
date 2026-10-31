// Print the update-email list as CSV. Run from site/: `npm run leads`
// (pulls BLOB_READ_WRITE_TOKEN and LEADS_ENC_KEY into the gitignored .env.local).
import { readSubscribers } from "../lib/store.js";

const subscribers = await readSubscribers();
console.log("email,signed_up,source");
for (const s of subscribers) console.log(`${s.email},${s.ts},${s.source}`);
console.error(`${subscribers.length} subscriber(s)`);
