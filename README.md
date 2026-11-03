# ArrivalFiller

A free Chrome extension that fills official arrival cards from answers you gave
once. It was called IndoArrival before version 1.1.

| Country | Form | Site |
| --- | --- | --- |
| Indonesia | All Indonesia arrival card | `allindonesia.imigrasi.go.id` |
| Thailand | Thailand Digital Arrival Card (TDAC) | `tdac.immigration.go.th` |

Pick the country, fill the card once as usual and ArrivalFiller remembers each
traveller's answers. Next trip, pick who is travelling, press **Fill**, check every
answer, then move on and press Submit yourself.

Install: https://chromewebstore.google.com/detail/emdkbckehgnfnjggcfndccmjahncjkmc

Website: https://arrivalfiller.vercel.app

## Privacy

- Everything the extension saves stays in your browser (`chrome.storage.local`).
- The extension makes no network requests: no server, no account, no analytics.
- It runs only on `allindonesia.imigrasi.go.id` and `tdac.immigration.go.th`. Its only
  other permission is `storage`.
- Delete one traveller, press **Erase all data**, or uninstall to remove everything.

The only thing ever collected is an email address, and only if you choose to sign
up for update emails on the website. Full policy:
https://arrivalfiller.vercel.app/privacy.html

## What it fills

- Passport details, name, date of birth, nationality, gender, phone and email
- Flights, accommodation and visa number, and on Indonesia's card, port of entry
- Indonesia: your usual declaration answers (health, countries visited, quarantine,
  goods, phones/IMEI) and the certification tick
- Thailand: occupation, residence, purpose of travel, and the health step (countries
  visited, yellow fever vaccination and date, symptoms), and the last page's email, but
  never a certificate file. If you agreed to the terms, Fill opens them for you: pressing
  Agree stays yours
- Trip dates as rules: arrival counts from the day you fill the form, departure
  from arrival

**Doesn't ask twice.** While you teach one country's form, the on-page panel offers
common details saved for travellers on the other: passport number, date of birth and
phone number, plus gender from Indonesia to Thailand and name from Thailand to
Indonesia. You see whose they are and the values first, only blank fields are filled,
and nothing is saved until you press Done. See
`extension/src/lib/commonAnswers.ts`.

It never presses Next, Continue or Submit. An arrival card is a legal statement:
check every answer is true for this trip.

## Build and run from source

```bash
cd extension
npm install
npm run build      # output in extension/dist
npm test           # unit tests
```

Open `chrome://extensions` (or `brave://extensions`), turn on **Developer mode**,
press **Load unpacked** and pick `extension/dist`. After every rebuild, press
**Reload** on ArrivalFiller and refresh open form tabs: a rebuild renames the bundled
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

Thailand lives in `extension/src/content/th/` and `extension/src/background/th/`,
with its own answers under separate storage keys (`lib/keysTh.ts`).

Every country works on install, with nothing to allow. Adding one means a host
permission and a content script in `manifest.json`, plus an entry in
`popup/countries.ts`; `popup/countries.test.ts` fails if one is missing. Chrome
switches the extension off for existing users until they accept each new site.

Thailand's form sits behind a Cloudflare check: the user clicks through it, and the
extension never touches it.

## Layout

```
extension/   Chrome MV3 extension (TypeScript, React popup, Vite)
config/      field map for Indonesia's arrival card
site/        website (arrivalfiller.vercel.app) and its update-email signup
store/       Chrome Web Store listing, images and upload script
legal/       privacy policy notes
```

## Not official

ArrivalFiller is an independent open-source tool. It is not affiliated with, endorsed
by, or operated for the governments of Indonesia or Thailand or their immigration
authorities. The extension shows one advertisement at a time, for theAsianparent, a
parenting app, or, on Indonesia's card only, Rumah123, a property website; neither
receives any data from ArrivalFiller.

## License

MIT, see [LICENSE](LICENSE).
