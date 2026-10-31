# Chrome Web Store listing — IndoArrival 1.0.0

Everything to paste into the Chrome Web Store developer dashboard
(https://chrome.google.com/webstore/devconsole). Files are in this folder.

## Package

- Upload: `store/indoarrival-1.0.0.zip` (rebuild: `cd extension && npm run build`,
  then `cd dist && zip -qr -X ../../store/indoarrival-1.0.0.zip . -x '.*'`).

## Store listing tab

- **Name** (from manifest): IndoArrival — Indonesia arrival card autofill
- **Summary** (from manifest): Fills Indonesia's All Indonesia arrival card from
  answers you gave once. You check every field and submit. Unofficial.
- **Category:** Productivity → Tools (or "Travel" if offered)
- **Language:** English
- **Description:**

```
Travelling to Indonesia? The All Indonesia arrival card (allindonesia.imigrasi.go.id) asks the same questions every trip. IndoArrival fills them for you.

How it works
1. Name the traveller (for example yourself, a partner, a child).
2. Fill the arrival card once, as usual. IndoArrival remembers that traveller's answers.
3. Next trip: open the form, pick who's travelling, and press Fill on each page. Check everything, then press Next and Submit yourself.

What it fills
• Passport details, name, date of birth, nationality and country of birth
• Gender and yes/no questions
• Phone code, phone number and email
• Visa or stay-permit number, last flight, port of entry and accommodation (when you taught them)
• Your usual declaration answers (health, countries visited, quarantine, goods, phones/IMEI), if you taught them
• Arrival date defaults to today, departure to 14 days later — change either any time

What it never does
• It never presses Next or Submit. You stay in control and responsible for your declaration.
• Declaration answers come back too, so check each one is still true for this trip before you submit.
• It never sends your data anywhere. Everything stays in your browser. No account, no server, no analytics.

Several travellers
Keep a separate set of answers for each person and switch between them in one click.

Privacy
Your answers are stored only in this browser's extension storage. Delete one traveller, or press "Erase all data", or uninstall to remove everything. Full policy: https://indoarrival.vercel.app/privacy.html

IndoArrival is an independent tool. It is not affiliated with, endorsed by, or operated for the Government of Indonesia or the Directorate General of Immigration. The extension shows one advertisement for Rumah123, a property website; Rumah123 receives no data from IndoArrival.
```

- **Store icon (128×128):** `store/icon-128.png`
- **Screenshots (1280×800):** `screenshot-1-fill.png`, `screenshot-2-how.png`,
  `screenshot-3-form.png` (made-up test person "Alex Tan", not real data)
- **Small promo tile (440×280):** `promo-small-440x280.png`
- **Homepage URL:** https://indoarrival.vercel.app
- **Support URL:** https://indoarrival.vercel.app (contact email is on the page)

## Privacy practices tab

- **Single purpose:**
  `Fill the official Indonesia arrival card (allindonesia.imigrasi.go.id) with answers the user entered on that form before, so the user can review and submit it.`
- **Permission justifications:**
  - `storage`: Saves each traveller's arrival-card answers locally in the browser so they can be filled again on the next trip.
  - Host `https://allindonesia.imigrasi.go.id/*`: The arrival card form itself; the extension reads and fills its fields only on this site.
- **Remote code:** No, I am not using remote code.
- **Data usage — what is collected:** tick **Personally identifiable information**
  (name, email, phone, passport number, date of birth) and **Location** only if the
  form asks for accommodation address (it does: tick it). Nothing else.
- **Certify all three:** not sold to third parties; not used for unrelated purposes;
  not used for creditworthiness/lending.
- **Privacy policy URL:** https://indoarrival.vercel.app/privacy.html

## Distribution tab

- **Visibility:** Public
- **Regions:** All regions
- **Pricing:** Free

## Account tab (one-time)

- Developer email: darius.cheung@gmail.com (verify it when asked).
- Trader / non-trader: choose **Non-trader** (free, personal project, no revenue
  from users). If you count the Rumah123 ad as business income, choose Trader —
  that publishes your address and phone on the listing.

## After submitting

Review usually takes a few days. Google emails the developer address with the result.
Future updates: bump `version` in `extension/manifest.json`, rebuild, re-zip,
upload in the same item → Submit for review.
