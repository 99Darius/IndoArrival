# Chrome Web Store listing — ArrivalFiller 1.1.0

Everything to paste into the Chrome Web Store developer dashboard, on the **existing
item** `emdkbckehgnfnjggcfndccmjahncjkmc` (same listing: users, reviews and ID carry
over). Files are in this folder.

## Package

- Upload: `store/arrivalfiller-1.1.0.zip` (rebuild: `store/cws build`).
- The name and summary come from the manifest, so they change with the upload.

## Store listing tab

- **Name** (from manifest): ArrivalFiller — arrival card autofill for Indonesia & Thailand
- **Summary** (from manifest): Fills Indonesia's and Thailand's arrival cards from
  answers you gave once. You check every field and submit. Unofficial.
- **Category:** Productivity → Tools (or "Travel" if offered)
- **Language:** English
- **Description:**

```
Travelling to Indonesia or Thailand? Their arrival cards ask the same questions every trip. ArrivalFiller fills them for you. It used to be called IndoArrival.

Works with
• Indonesia: All Indonesia arrival card (allindonesia.imigrasi.go.id)
• Thailand: Thailand Digital Arrival Card, TDAC (tdac.immigration.go.th)

How it works
1. Pick the country and name the traveller (for example yourself, a partner, a child).
2. Fill the arrival card once, as usual. ArrivalFiller remembers that traveller's answers.
3. Next trip: open the form, pick who's travelling, and press Fill on each page. Check everything, then move on and press Submit yourself.

What it fills
• Passport details, name, date of birth, nationality and gender
• Phone number and email
• Flights and accommodation
• Visa number
• Indonesia: country of birth, port of entry and your usual declaration answers (health, countries visited, quarantine, goods, phones/IMEI), if you taught them
• Thailand: occupation, country and city of residence, purpose of travel and your health step answers (countries visited, yellow fever vaccination, symptoms), if you taught them
• Trip dates follow your usual pattern (for example: arrive tomorrow, leave 14 days later). Change either any time.

Doesn't ask twice
Filled one country's card? While you teach the other, it offers common details saved for travellers in this browser (such as passport number, date of birth and phone number). It shows you whose they are and the values first, and uses them only if you say so.

What it never does
• It never presses Next, Continue, Agree or Submit. You stay in control and responsible for your declaration.
• On Thailand's last page it opens the terms and conditions for you. You read them and press Agree yourself.
• Your declaration and health answers do come back, so check each one is still true for this trip before you submit.
• It never saves a certificate file. Upload any vaccination certificate yourself.
• It never sends your data anywhere. Everything stays in your browser. No account, no server, no analytics.

Several travellers
Keep a separate set of answers for each person and switch between them in one click. Each country keeps its own travellers.

Privacy
Your answers are stored only in this browser's extension storage. Delete one traveller, or press "Erase all data", or uninstall to remove everything. Full policy: https://arrivalfiller.vercel.app/privacy.html

Open source
The code is public, so anyone can check what it does: https://github.com/99Darius/ArrivalFiller

ArrivalFiller is an independent tool. It is not affiliated with, endorsed by, or operated for the governments of Indonesia or Thailand or their immigration authorities. The extension shows one advertisement at a time, for theAsianparent, a parenting app, or, on Indonesia's card only, Rumah123, a property website; neither receives any data from ArrivalFiller.
```

- **Store icon (128×128):** `store/icon-128.png`
- **Screenshots (1280×800):** `screenshot-1-fill.png`, `screenshot-2-how.png`,
  `screenshot-3-form.png` (made-up test person "Alex Tan", not real data)
- **Small promo tile (440×280):** `promo-small-440x280.png`
- **Homepage URL:** https://arrivalfiller.vercel.app
- **Support URL:** https://arrivalfiller.vercel.app (contact email is on the page)

## Privacy practices tab

- **Single purpose:**
  `Fill official arrival card forms (Indonesia's All Indonesia card and Thailand's Digital Arrival Card) with answers the user entered on those forms before, so the user can review and submit them.`
- **Permission justifications:**
  - `storage`: Saves each traveller's arrival-card answers locally in the browser so they can be filled again on the next trip.
  - Host `https://allindonesia.imigrasi.go.id/*`: Indonesia's arrival card form; the extension reads and fills its fields only on this site.
  - Host `https://tdac.immigration.go.th/*`: Thailand's arrival card form; the extension reads and fills its fields only on this site.
- **Remote code:** No, I am not using remote code.
- **Data usage — what is collected:** **Personally identifiable information** (name,
  email, phone, passport number, date of birth), **Location** (accommodation address)
  and **Health information**: both countries' declaration and health answers are saved
  locally. Darius: the earlier listing may not have ticked Health information. It should
  be ticked, since those answers are saved.
- **Certify all three:** not sold to third parties; not used for unrelated purposes;
  not used for creditworthiness/lending. Darius ticks these himself.
- **Privacy policy URL:** https://arrivalfiller.vercel.app/privacy.html

## Distribution tab

Unchanged: Public, all regions, free.

## Before submitting

1. The new website and privacy policy must be live at https://arrivalfiller.vercel.app,
   because the listing and the package link to them.
2. If 1.0.1 is still in review, check the dashboard: wait for it to finish, or cancel
   that submission, before submitting 1.1.0.

## After submitting

Review usually takes a few days and can take up to a few weeks. Google emails the
developer address with the result.

Existing users update automatically, but the new Thailand site is a new permission:
Chrome switches the extension off for each of them until they accept it. They keep
their travellers and, once they accept, see a one-time notice about the new name.
Every new country's site does the same.

Future updates: bump `version` in `extension/manifest.json`, run `store/cws build`,
upload in the same item → Submit for review.
