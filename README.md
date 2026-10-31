# IndoArrival

A free Chrome extension that fills Indonesia's **All Indonesia** arrival card
(`allindonesia.imigrasi.go.id`) from answers you gave once.

Fill the card once as usual and IndoArrival remembers each traveller's answers.
Next trip, pick who is travelling, press **Fill** on each page, check every
answer, then press Next and Submit yourself.

Website: https://indoarrival.vercel.app

## Privacy

- Everything the extension saves stays in your browser (`chrome.storage.local`).
- The extension makes no network requests: no server, no account, no analytics.
- It only runs on `allindonesia.imigrasi.go.id`; its only permission is `storage`.
- Delete one traveller, press **Erase all data**, or uninstall to remove everything.

The only thing ever collected is an email address, and only if you choose to sign
up for update emails on the website. Full policy:
https://indoarrival.vercel.app/privacy.html

## What it fills

- Passport details, name, date of birth, nationality, country of birth, gender
- Phone code, phone number and email
- Visa or stay-permit number, last flight, port of entry and accommodation
- Your usual declaration answers (health, countries visited, quarantine, goods,
  phones/IMEI) and the certification tick
- Trip dates as rules: arrival counts from the day you fill the form, departure
  from arrival (14 days unless you taught otherwise)

It never presses Next or Submit. A customs and immigration declaration is a legal
statement: check every answer is true for this trip.

## Build and run from source

```bash
cd extension
npm install
npm run build      # output in extension/dist
npm test           # unit tests
```

Open `chrome://extensions` (or `brave://extensions`), turn on **Developer mode**,
press **Load unpacked** and pick `extension/dist`. After every rebuild, press
**Reload** on IndoArrival and refresh open form tabs: a rebuild renames the bundled
files, so an extension that was not reloaded stops working.

## How it works

- `extension/src/content/recorder.ts` watches the form while you teach a traveller
  and records each field you touch (only real user events).
- `extension/src/content/formFill.ts` fills a page from those answers, field by
  field, using the page's own controls (text, dropdowns, yes/no groups, ticks).
- `extension/src/content/formFields.ts` finds fields. The government form adds a
  changing number to its ids, so fields are matched by id prefix
  (`[id^="spi_full_name_"]`); the declaration page has no ids, so its questions are
  matched by their text (`@q:<question>`).
- `extension/src/background/travellers.ts` is the only writer of saved answers,
  one traveller at a time.
- `scripts/check-field-map.mjs` (needs Playwright) checks the live form still has
  the mapped step-1 fields.

## Layout

```
extension/   Chrome MV3 extension (TypeScript, React popup, Vite)
config/      field map for the arrival card
site/        website (indoarrival.vercel.app) and its update-email signup
store/       Chrome Web Store listing, images and upload script
legal/       privacy policy notes
```

## Not official

IndoArrival is an independent open-source tool. It is not affiliated with,
endorsed by, or operated for the Government of Indonesia or the Directorate
General of Immigration. The extension shows one advertisement for Rumah123, a
property website; Rumah123 receives no data from IndoArrival.

## License

MIT, see [LICENSE](LICENSE).
