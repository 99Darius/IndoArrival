// The guides. Written by hand, one at a time. Every claim traces to a source below, and
// messages in quotes are copied from the forms' own public code, never made up.
// `updated` is a real content date: change it only when the page's content changes.

const S = {
  thEmbassy: { label: "Royal Thai Embassy, Buenos Aires: How to submit the TDAC", url: "https://buenos-aires.thaiembassy.org/en/content/how-to-submit-the-thailand-digital-arrival-card-td", note: "official, updated 26 Feb 2026" },
  thCode: { label: "TDAC site's public code and English text", url: "https://tdac.immigration.go.th/", note: "official site, version 2026.10.00-0547, read by us on 3 Nov 2026" },
  thPattaya: { label: "Pattaya Mail: TDAC risks some teething issues", url: "https://www.pattayamail.com/latestnews/news/thailands-digital-arrival-card-tdac-risks-some-teething-issues-498168", note: "newspaper, 21 Apr 2025" },
  thWiki: { label: "Wikipedia: Thailand Digital Arrival Card", url: "https://en.wikipedia.org/wiki/Thailand_Digital_Arrival_Card", note: "cites Bangkok Post and Pattaya Mail, 2025" },
  thThaiger: { label: "The Thaiger: TDAC scams and how to protect yourself", url: "https://thethaiger.com/guides/visa-information/thailand-digital-arrival-card-tdac-scams-and-how-to-protect-yourself", note: "11 Nov 2025; content supplied by a company selling related services, so one party's account" },
  thFreeze: { label: "ASQ forum: TDAC freezes when selecting accommodation", url: "https://asq.in.th/question/what-can-i-do-if-my-application-for-the-thailand-digital-arrival-card-freezes-when-selecting-accommodation", note: "traveller reports, unofficial" },
  thAddress: { label: "ASQ forum: why can't I fill out the address section", url: "https://asq.in.th/question/why-cant-i-fill-out-the-address-section-of-the-thailand-electronic-arrival-card", note: "traveller reports, unofficial" },
  idCode: { label: "All Indonesia site's public code and English text", url: "https://allindonesia.imigrasi.go.id/", note: "official site, read by us on 5 Nov 2026" },
  idGuide: { label: "WOAH Asia-Pacific: All Indonesia Arrival Card guide", url: "https://rr-asia.woah.org/app/uploads/2025/09/2025-09-All-Indonesia-Arrival-Card-Guide.pdf", note: "intergovernmental body's travel guide, Sep 2025" },
  idScam: { label: "Newcastle Herald: Bali tourists targeted by arrival card scam websites", url: "https://www.newcastleherald.com.au/story/9243512/bali-tourists-targeted-by-arrival-card-scam-websites/", note: "newspaper quoting Australia's Smartraveller, 12 May 2026" },
  idKids: { label: "The West Australian: families get shambolic start to Bali holiday", url: "https://www.harveyreporter.com.au/travel/families-get-shambolic-start-to-bali-holiday-c-20102620", note: "newspaper, unnamed source, 24 Sep 2025" },
  idBlog: { label: "Wet Frog Divers: All Indonesia Arrival card, reader comments", url: "https://www.wetfrogdivers.com/all-indonesia-arrival-card/", note: "traveller reports, unofficial" },
};

export const PAGES = [
  // ---------------------------------------------------------------- cross-country
  {
    path: "/arrival-card-problems",
    country: null,
    updated: "2026-11-05",
    title: "Arrival card form not working? What to check first",
    description: "Thailand's TDAC or Indonesia's All Indonesia card won't submit, date rejected, or no QR code? Find the likely cause and the fix, using the forms' real messages.",
    h1: "Arrival card form not working? Start here",
    answer: "Most arrival card failures come down to one of five things: the wrong website, a date outside the three-day window, a character the field rejects, a session that timed out, or an email that went to spam. Check them in that order. If the form still fails, you can usually finish at the airport: Thailand has kiosks at five airports, and its embassy says the card can be completed until you reach immigration.",
    body: `
<h2>Check these five things, in this order</h2>
<ol>
  <li><b>Are you on the government's site?</b> Look at the address bar. Thailand's card is on <code>tdac.immigration.go.th</code> and Indonesia's is on <code>allindonesia.imigrasi.go.id</code>. If a site is asking for a card payment for the arrival card itself, you are probably on a copy. See the guides for <a href="/thailand/tdac-fake-websites">Thailand</a> and <a href="/indonesia/all-indonesia-fake-websites">Indonesia</a>.</li>
  <li><b>Is your arrival date in the window?</b> Both countries work to about 72 hours before you land. On Thailand's form, a date further out simply can't be picked. See <a href="/thailand/tdac-date-error">the TDAC date guide</a>.</li>
  <li><b>Did a field reject what you typed?</b> Forms like these check strict patterns. On the TDAC, an apostrophe in a surname or Thai script in a hotel address will fail. See <a href="/thailand/tdac-name-passport-phone-errors">the field rules</a>.</li>
  <li><b>Did the session expire?</b> If you left the page open while hunting for your hotel's address, you may have to start again. Have the details ready first.</li>
  <li><b>Did it work after all?</b> A missing email doesn't always mean a failed submission. Thailand's <a href="/thailand/tdac-email-not-received">confirmation</a> and Indonesia's <a href="/indonesia/all-indonesia-qr-code-not-received">QR code</a> each have a recovery route.</li>
</ol>

<h2>How the two cards differ</h2>
<div class="table"><table>
  <tr><th></th><th>Thailand (TDAC)</th><th>Indonesia (All Indonesia)</th></tr>
  <tr><td>Official site</td><td><code>tdac.immigration.go.th</code></td><td><code>allindonesia.imigrasi.go.id</code></td></tr>
  <tr><td>Window</td><td>Up to 72 hours before entry</td><td>Within 72 hours of arrival</td></tr>
  <tr><td>Fee</td><td>Free</td><td>Free for the arrival card (a visa on arrival is a separate, paid thing)</td></tr>
  <tr><td>What you show</td><td>A QR code by email, or the downloaded copy</td><td>A QR code by email, plus your passport</td></tr>
  <tr><td>Children</td><td>Every traveller, added one at a time</td><td>Every traveller has their own card; group filing is capped at 10</td></tr>
  <tr><td>Fixing a mistake</td><td>Update some details; name and passport need a new submission</td><td>The site offers an update option before you travel</td></tr>
</table></div>

<h2>Who actually runs these forms</h2>
<p>Each form belongs to that country's immigration authority, and only they can fix a fault on their site or accept your card. No app, agent or browser extension can get a form accepted when the government's system is down. A paid "urgent" service can't make it faster either, because free submissions go through the same system.</p>
<p>So when a site is truly down, your job is to keep your details handy and try again later, then fall back on the airport. Indonesia's own terms say the government "does not guarantee uninterrupted access to the application", which is a fair warning not to leave it until you're in the taxi to the airport.</p>

<h2>Leave yourself a margin</h2>
<p>Do it the day before you fly rather than in the departure queue. Have your passport, flight number and hotel address open before you start, and note that the address needs to be in English letters. If several people are travelling, allow time for each of them, because both forms ask for every traveller's details, including babies.</p>
`,
    faq: [
      { q: "Will I be refused entry if the form fails?", a: "We can't promise anything for your trip, and officers decide at the border. Thailand's embassy says the TDAC can be completed until you reach immigration, and lists kiosks at BKK, DMK, HKT, CNX and HDY. For Indonesia, carry your details and ask staff on arrival if you truly couldn't submit." },
      { q: "Does the arrival card replace a visa?", a: "No. Both countries say so. Whether you need a visa depends on your nationality and your trip, and is a separate check." },
      { q: "Can ArrivalFiller fix these errors?", a: "It can't fix a fault on the government's site. It helps with the retyping: it remembers your answers from the first time you fill the card, then fills them in on your next trip so you can check them and submit yourself." },
    ],
    sources: [S.thEmbassy, S.thCode, S.idCode, S.idGuide],
    bridge: "Going through this more than once a year? ArrivalFiller remembers each traveller's answers in your browser, so your next card takes a check rather than a retype.",
  },

  // ---------------------------------------------------------------- Thailand
  {
    path: "/thailand",
    country: "th",
    updated: "2026-11-05",
    title: "Thailand Digital Arrival Card (TDAC): what to have ready",
    description: "A plain guide to Thailand's TDAC: who needs it, when to file, every field it asks for by step, and what to do when it goes wrong. Independent, not a government site.",
    h1: "Thailand Digital Arrival Card (TDAC) guide",
    answer: "The TDAC is Thailand's free online arrival card. Non-Thai nationals entering by air, land or sea have needed one since 1 May 2025. File it at tdac.immigration.go.th up to 72 hours before you arrive. It takes four steps, and you get a QR code by email to show at immigration. It isn't a visa, and you need a new one for every entry.",
    body: `
<h2>Who needs one</h2>
<p>Thailand's embassy says every non-Thai national entering by land, sea or air must submit one, including children and infants. Parents or guardians fill it in for minors. Thai nationals don't need one, and nor do transit passengers who stay airside and don't pass immigration.</p>

<h2>What each step asks for</h2>
<p>We read the form's fields directly from the site. Getting these ready before you start is the easiest way to avoid a timed-out session.</p>
<h3>1. Personal details</h3>
<p>Family name, first name, middle name, passport number, nationality, date of birth, occupation, gender, visa number if you have one, country and city of residence, and phone number with its code. The form also offers to read your passport from a photo; the photo has to be a JPG, JPEG, PNG or BMP of up to 5MB, and the code strip at the bottom of the passport page has to line up with the scanning area.</p>
<h3>2. Trip details</h3>
<p>Arrival date, the country you boarded in, purpose of travel, how you're arriving, flight or vehicle number, then your departure date and transport. Then your stay: accommodation type, province, district, sub-district, post code and address. There's a tick box if you're a transit passenger who won't stay in Thailand, and another for day trips.</p>
<h3>3. Health</h3>
<p>The embassy says this step applies to certain nationalities or to travellers who visited high-risk areas in the previous 14 days. It lists the countries you stayed in during the two weeks before arrival and any symptoms. Some answers ask for a yellow fever vaccination date and a certificate (JPG, JPEG, PNG or PDF, up to 5MB). The form may tell you: "Please proceed to the Department of Disease Control counter before entering the immigration checkpoint."</p>
<h3>4. Review and submit</h3>
<p>Check every traveller's entry, enter an email address, tick to accept the declaration and terms, and press Submit. The next page gives you a copy to download, and the same acknowledgement goes to your email.</p>

<h2>When something goes wrong</h2>
<ul>
  <li><a href="/thailand/tdac-not-working">The site won't load or shows an error message</a></li>
  <li><a href="/thailand/tdac-date-error">You can't pick your arrival date</a></li>
  <li><a href="/thailand/tdac-name-passport-phone-errors">A name, passport or phone field is rejected</a></li>
  <li><a href="/thailand/tdac-accommodation-address-error">The accommodation or address step is stuck</a></li>
  <li><a href="/thailand/tdac-email-not-received">Your confirmation email didn't arrive</a></li>
  <li><a href="/thailand/tdac-change-after-submit">You made a mistake, or your flight changed</a></li>
  <li><a href="/thailand/tdac-fake-websites">You think you used or paid a fake site</a></li>
</ul>

<h2>Filing for a family</h2>
<p>You add each traveller in turn with the Add button, one at a time, on the same submission. Each person needs their own details, and the health answers can differ between them. Children count, even babies, and their passport details go in like anyone else's.</p>
`,
    faq: [
      { q: "How much does the TDAC cost?", a: "Nothing. The embassy says it is free, and warns against websites that charge administrative fees." },
      { q: "How long is a TDAC good for?", a: "It is for one entry. If you leave and come back, you file a new one." },
      { q: "Do I need one for a land border crossing?", a: "Yes. The embassy says it applies whatever your mode of transport, including land and sea." },
    ],
    sources: [S.thEmbassy, S.thCode, S.thWiki],
    bridge: "Back in Thailand every few months? ArrivalFiller saves these answers in your browser after the first time and fills the form for you to check.",
  },
  {
    path: "/thailand/tdac-not-working",
    country: "th",
    updated: "2026-11-05",
    title: "TDAC not working? What each error message means",
    description: "What \"We couldn't verify your request\", \"Your session has timed out\" and \"The system is busy\" mean on Thailand's TDAC form, and what to do about each.",
    h1: "TDAC not working: what each error message means",
    answer: "The TDAC site has four general error messages. \"We couldn't verify your request\" means wait and retry. \"Your session has timed out\" means start again. \"The system is busy\" means the server is struggling, so try later. If nothing works, you can still finish at the airport: the embassy says the TDAC can be completed until you reach immigration, and five airports have kiosks.",
    body: `
<h2>The site's own messages</h2>
<p>These are copied from the English text the TDAC site ships to your browser. The site maps each one to a type of failed request, so the wording tells you more than it seems to.</p>
<div class="table"><table>
  <tr><th>What you see</th><th>What it points to</th><th>What to do</th></tr>
  <tr><td>"We couldn't verify your request. Please wait a moment and try again."</td><td>The server rejected the request as invalid (HTTP 400). It is the only message that says "verify", so it may relate to the site's security check, though we can't confirm that from the outside.</td><td>Wait a minute and retry. Reload the page and complete any "are you human" check yourself. Try turning off a VPN if you use one.</td></tr>
  <tr><td>"Your session has timed out. Please start again."</td><td>Your session expired (HTTP 401), usually from leaving the page open too long.</td><td>Start again, with your passport, flight and hotel details open beforehand.</td></tr>
  <tr><td>"The system is busy right now. Please try again in a moment."</td><td>A server fault on their side (HTTP 500). Your entries are probably not the problem.</td><td>Try later. Changing browsers won't help a server fault.</td></tr>
  <tr><td>"The requested resource could not be found."</td><td>A missing page (HTTP 404), often from an old link or a bookmark partway through the form.</td><td>Go back to the site's home page and start from "Arrival Card".</td></tr>
  <tr><td>"An error has occurred. Please try again."</td><td>The catch-all for anything else.</td><td>Retry once, then try a different browser or device.</td></tr>
</table></div>

<h2>When the page itself is the problem</h2>
<p><b>A security check that keeps looping.</b> The site sits behind a browser check. VPNs, strict privacy extensions and shared office networks can all make it harder to pass. Complete it by hand, and try a normal window with your phone's data connection if it keeps coming back. Don't use a tool that claims to skip it.</p>
<p><b>A button that does nothing.</b> The form checks each field when you leave it, so a rejected value may be why Continue doesn't move on. Scroll up and look for a field marked in red. The <a href="/thailand/tdac-name-passport-phone-errors">field rules</a> list what each one accepts.</p>
<p><b>Freezing on the accommodation step.</b> Travellers report this one often, so it has <a href="/thailand/tdac-accommodation-address-error">its own guide</a>.</p>
<p><b>Slow at busy times.</b> Pattaya Mail warned before launch that systems like this can slow down under heavy traffic. If it crawls, come back at a quieter hour instead of pressing Submit repeatedly.</p>

<h2>If you run out of time</h2>
<p>The Royal Thai Embassy says submission is mandatory before arrival but can be completed until you reach immigration. Some airports offer WiFi for this, and it lists kiosks at Suvarnabhumi (BKK), Don Mueang (DMK), Phuket (HKT), Chiang Mai (CNX) and Hat Yai (HDY). Expect this to take longer than doing it beforehand. If you've got no other way, ask the staff there.</p>
<p>What not to do: don't search for a "TDAC help" service and pay it. The official route is free, and many of the top search results and ads are from <a href="/thailand/tdac-fake-websites">other parties</a>.</p>
`,
    faq: [
      { q: "Which browser works best for the TDAC?", a: "We have no official answer. Forum reports mention more success on laptops and desktop browsers than on phones, but others filed fine on Android. If one fails, trying another is cheap." },
      { q: "Is the TDAC site down right now?", a: "We don't monitor it, so we can't say. If you get the \"system is busy\" message on two different devices and networks, the fault is probably on the site's side." },
      { q: "Do I lose what I typed if the session times out?", a: "Plan on it. The message says to start again, so keep your details in front of you." },
    ],
    sources: [S.thCode, S.thEmbassy, S.thPattaya],
    bridge: "A timed-out session is painful because you retype everything. ArrivalFiller holds your answers in your browser, so starting again is one press and a check.",
  },
  {
    path: "/thailand/tdac-date-error",
    country: "th",
    updated: "2026-11-05",
    title: "TDAC date error: why you can't select your arrival date",
    description: "TDAC won't let you pick your arrival date? The form's calendar only runs from today to three days ahead. Here's how the window works, and when to file.",
    h1: "TDAC date error: why you can't select your arrival date",
    answer: "The TDAC calendar only offers today and the next three days, counted from the date the site's server sends. If your arrival is further away, the date can't be selected and no setting changes that. Come back once it's inside the window. If you're arriving today, you can still file.",
    body: `
<h2>What the form actually does</h2>
<p>We read the form's code. When the page loads, the server tells it today's date, and the arrival date picker is limited to that date through to three days later. So on 10 March you can choose 10, 11, 12 or 13 March, and nothing after. The same limit appears in the form used to update a card.</p>
<p>The departure date has no such squeeze. Its limit is many years ahead, so a return flight weeks away is fine.</p>

<h2>Why the rule confuses people</h2>
<p>The site's own notice reads: "Foreigners are required to submit their arrival card information 3 days in advance of their arrival date in Thailand." That can read as if you must file at least three days before. In practice it means no earlier than three days out. The embassy describes it as "up to 72 hours before entry", and says you can still complete it until you reach immigration.</p>

<h2>The mistakes that look like a broken calendar</h2>
<ul>
  <li><b>Filing too early.</b> The most common cause. You're organised, your trip is in a week, and the date is greyed out. Set a reminder for three days before you land.</li>
  <li><b>Using your departure date.</b> On an overnight flight, the date you need is the day you land in Thailand, which may be the day after you leave home.</li>
  <li><b>Your phone's date isn't Thailand's.</b> The window counts from the server's date rather than your phone's. If you're far behind or ahead of Thailand, the picker may start or end a day away from what you expect. We assume the server uses Thai time, though the code doesn't say.</li>
  <li><b>A long connection.</b> If you stop over for a few days in another country, your arrival date is your actual entry to Thailand, and the "country boarded" is the last one you flew from.</li>
  <li><b>A page left open overnight.</b> The date range is set when the page loads, so reload the page if you started it the day before.</li>
</ul>

<h2>If your plans change after filing</h2>
<p>You can change some details through the site's <a href="/thailand/tdac-change-after-submit">update option</a>. The update form uses the same three-day limit in its code, so moving your trip a week later means waiting for the new date to come into range.</p>

<h2>The message "Invalid days"</h2>
<p>The site's English text includes the phrase "Invalid days." We can't tell from the outside exactly when it's shown. If you see it, re-select both dates from the calendar rather than typing them, and check your departure comes after your arrival. If you've seen it and worked out the cause, <a href="mailto:darius.cheung@gmail.com">let us know</a> and we'll add it here.</p>
`,
    faq: [
      { q: "Can I file the TDAC on the day I arrive?", a: "Yes. Today is the first date in the calendar, and the embassy says it can be completed until you reach immigration. Doing it earlier is calmer." },
      { q: "Is it exactly 72 hours?", a: "The embassy says 72 hours. The calendar works in whole dates (today plus three), so what you see is a date range rather than a countdown." },
      { q: "Can I file a week early for peace of mind?", a: "Not on the official site, since the date can't be selected. Any service offering to file earlier is not the official route, so treat it with care." },
    ],
    sources: [S.thCode, S.thEmbassy],
    bridge: "ArrivalFiller saves trip dates as a pattern, such as \"arrive tomorrow, leave 14 days later\", so they land inside the window when you fill. You can change either date.",
  },
  {
    path: "/thailand/tdac-name-passport-phone-errors",
    country: "th",
    updated: "2026-11-05",
    title: "TDAC rejects my name or passport number: the exact rules",
    description: "Apostrophe or hyphen in your name? Phone with a plus sign? The exact characters each TDAC field accepts, read from the form's own code, with what to type instead.",
    h1: "TDAC rejects my name, passport or phone: the exact rules",
    answer: "TDAC fields accept narrow sets of characters. First and middle names take English letters and spaces only, and family names add one exception: a lone dash. So an apostrophe or hyphen fails. Passport numbers take letters and digits with no spaces, and phone numbers take digits only. Type names the way the machine-readable lines at the bottom of your passport print them, without the punctuation.",
    body: `
<h2>What each field accepts</h2>
<p>These rules come from the validation code in the form itself. If a field is marked in red, compare what you typed with this table.</p>
<div class="table"><table>
  <tr><th>Field</th><th>Accepts</th><th>Max</th><th>Fails on</th></tr>
  <tr><td>Family name</td><td>English letters and spaces, or a single <code>-</code></td><td>60</td><td><code>O'BRIEN</code>, <code>SMITH-JONES</code>, <code>MÜLLER</code></td></tr>
  <tr><td>First name</td><td>English letters and spaces</td><td>60</td><td><code>JEAN-LUC</code>, <code>JOSÉ</code>, a lone <code>-</code></td></tr>
  <tr><td>Middle name</td><td>English letters and spaces (optional)</td><td>60</td><td><code>J.</code></td></tr>
  <tr><td>Passport number</td><td>Letters and digits</td><td>20</td><td>Spaces or dashes</td></tr>
  <tr><td>Phone number</td><td>Digits only (the code is a separate box)</td><td>25</td><td><code>+65 9123</code>, brackets, dashes</td></tr>
  <tr><td>Visa number</td><td>Letters, digits, spaces, <code>/</code>, <code>-</code> (optional)</td><td>20</td><td>A first character of <code>= + @ -</code></td></tr>
  <tr><td>Occupation</td><td>English letters, symbols, spaces</td><td>100</td><td>Digits, non-English script, or a first character of <code>= + @ -</code></td></tr>
  <tr><td>City of residence</td><td>Letters and common punctuation</td><td>100</td><td>Emoji, or a first character of <code>= + @ -</code></td></tr>
  <tr><td>Flight or vehicle number</td><td>English letters, digits, symbols, spaces</td><td>20</td><td>Non-English script, or a first character of <code>= + @ -</code></td></tr>
  <tr><td>Email</td><td>One normal address</td><td>50</td><td>Two addresses, or one over 50 characters</td></tr>
</table></div>

<h2>If your name has an apostrophe, hyphen or accent</h2>
<p>Look at the two machine-readable lines at the bottom of your passport's photo page. International passport standards remove apostrophes, replace hyphens with a filler, and convert accents into plain letters, so those lines already show a form of your name the system can handle. For example:</p>
<ul>
  <li><code>O'BRIEN</code> prints as <code>OBRIEN</code>, so type <code>OBRIEN</code>.</li>
  <li><code>SMITH-JONES</code> prints as <code>SMITH&lt;JONES</code>, so type <code>SMITH JONES</code>.</li>
  <li>An accented <code>MÜLLER</code> may print as <code>MUELLER</code> or <code>MULLER</code>. Use what your passport's lines show.</li>
</ul>
<p>This is our reading of the standard and the form's rules. It isn't official advice from Thai immigration, who have the last word at the border.</p>

<h2>If you have no family name</h2>
<p>Some passports show only one name. The family name pattern allows exactly one dash and nothing else, which suggests <code>-</code> is the intended entry. The form requires this box, so an empty one fails. First name has no such exception.</p>

<h2>Things that catch people out</h2>
<ul>
  <li><b>Letter O and number 0.</b> The most common passport typo. The form can't spot it, because both are valid characters.</li>
  <li><b>Pasted spaces.</b> Copying from a booking email can bring a space with it, which fails on the passport number.</li>
  <li><b>You won't see the error until you leave the field.</b> The form checks a value when you click away from it, so it can look fine while you're typing.</li>
  <li><b>You can't update a name later.</b> The site says full name can't be updated after submission, so <a href="/thailand/tdac-change-after-submit">a typo there means a new submission</a>.</li>
</ul>
<p>Uploads have rules too: a passport image must be JPG, JPEG, PNG or BMP up to 5MB, and a vaccination certificate must be JPG, JPEG, PNG or PDF up to 5MB with a file name under 250 characters.</p>
`,
    faq: [
      { q: "Does the TDAC have to match my passport exactly?", a: "The form says full name in passport. Since it can't accept punctuation, use the plain-letter form shown in your passport's machine-readable lines." },
      { q: "Do I type my phone's country code twice?", a: "No. The code goes in its own box and the number field takes digits only. Leave out the plus sign." },
      { q: "Can I write my hotel in Thai?", a: "No. The address field rejects Thai script. See the accommodation guide for what to type." },
    ],
    sources: [S.thCode, S.thEmbassy],
    bridge: "Once your name and passport are accepted, you shouldn't have to work it out again. ArrivalFiller replays what you typed the first time, ready to check.",
  },
  {
    path: "/thailand/tdac-accommodation-address-error",
    country: "th",
    updated: "2026-11-05",
    title: "TDAC accommodation or address stuck? How that step works",
    description: "TDAC freezing on accommodation, or district greyed out? Why province, district and sub-district open in order, and what the address box accepts.",
    h1: "TDAC accommodation or address step stuck: how it works",
    answer: "The address boxes open in order: accommodation type, then province, then district, then sub-district. Each one stays locked until the one before it has a value picked from its list, and typing without picking doesn't count. The address box takes English characters only, up to 215 characters and five lines, so an address in Thai will fail. If you won't stay in Thailand, tick the transit box instead.",
    body: `
<h2>Why a box won't open or won't accept your entry</h2>
<p>From the form's code, each location box stores two things: the words you see, and a hidden ID for that place. Both are required. That has a practical consequence: <b>typing "Bangkok" and moving on leaves the ID empty</b>. Type a few letters, wait for the suggestions, and click one.</p>
<p>Work from the top down. Changing the province clears what's below it, so if you go back and change it, redo the district and sub-district too.</p>

<h2>Finding your district and sub-district</h2>
<p>The form uses Thailand's own address structure, and a hotel's booking page may not spell it out. Some ways to find it:</p>
<ul>
  <li>Look for the hotel's postal address. In Bangkok, "Khet" is the district and "Khwaeng" the sub-district. Elsewhere, "Amphoe" is the district and "Tambon" the sub-district.</li>
  <li>Spellings vary when Thai is written in English: Khlong Toei and Klong Toey are the same place. If your spelling finds nothing, try fewer letters.</li>
  <li>Look up the post code. It's five digits and helps confirm the area. The box accepts digits only, and exactly five of them.</li>
  <li>If you're staying with friends, ask them for the address before you start the form.</li>
</ul>

<h2>What the address box accepts</h2>
<p>English letters, digits and common symbols, up to 215 characters and no more than five lines. It can't begin with <code>=</code>, <code>+</code>, <code>@</code> or <code>-</code>. Thai script fails, which catches anyone who copied the address from a Thai confirmation. Ask the hotel for the English version, or use the name and street from its English website.</p>

<h2>Reports of freezing on "type of accommodation"</h2>
<p>Travellers on forums report the form hanging at this step, and others report being unable to fill in the address at all. We can't reproduce every case from here. Things worth trying, in order:</p>
<ol>
  <li>Wait a moment. The lists load from the server, so a slow connection can look like a freeze.</li>
  <li>Check the arrival date first. Reports say the address section may not work until your date is within three days, and a date issue may be what's holding it back. See <a href="/thailand/tdac-date-error">the date guide</a>.</li>
  <li>Turn off translation in your browser. A translated page can change the labels the form relies on. That's our suggestion rather than a confirmed cause.</li>
  <li>Reload and try another browser or device. If the session times out, you'll need <a href="/thailand/tdac-not-working">to start again</a>.</li>
</ol>

<h2>Transit passengers and day trips</h2>
<p>The form has a tick box reading "I am a transit passenger, I don't stay in Thailand", and a separate question about day trips. If one applies, the accommodation fields may no longer be needed. Don't invent a hotel just to get past the step. If you're staying airside and not passing immigration, the embassy says you don't need a TDAC at all.</p>
`,
    faq: [
      { q: "What if I don't have a hotel booked yet?", a: "The form asks where you'll stay, so decide on your first night's address before you start. We can't advise on what immigration accepts beyond that." },
      { q: "Why is district greyed out?", a: "It stays locked until a province has been picked from the list. Picking, rather than typing, is what unlocks it." },
      { q: "Can I use an Airbnb address?", a: "The form has several accommodation types and an \"other\" option. Choose the closest type, and use the property's address in English." },
    ],
    sources: [S.thCode, S.thEmbassy, S.thFreeze, S.thAddress],
    bridge: "Staying in the same place again? ArrivalFiller remembers your province, district and address, so you won't be hunting for them next time.",
  },
  {
    path: "/thailand/tdac-email-not-received",
    country: "th",
    updated: "2026-11-05",
    title: "TDAC confirmation email not received? What to do",
    description: "No TDAC email or QR code after submitting? Check spam, look for a typo, use the download on the submitted page, and know what the embassy says to do at the airport.",
    h1: "TDAC confirmation email not received: what to do",
    answer: "Check your spam folder first, and look for a typo in the address you entered. The email is only a second copy: the submitted page also offers a download, so save that if it's still open. If you have neither at the airport, the Royal Thai Embassy says to tell the immigration officer at the checkpoint.",
    body: `
<h2>First, did the submission go through?</h2>
<p>A finished TDAC ends on a page marked "Submitted" with a "TH Digital Arrival Card No." It also says: "This acknowledgement message will also be sent to the email address you have provided. You may choose to download or print a copy of this for the duration of your stay in Thailand."</p>
<p>If you saw that page, your card was filed and the problem is only the email. If the page ended on an error or never moved on, you may not have a card at all. Go to <a href="/thailand/tdac-not-working">the error guide</a>.</p>

<h2>Finding the email</h2>
<ol>
  <li><b>Search your spam and promotions folders</b> for "arrival card" and "immigration".</li>
  <li><b>Check how you typed the address.</b> One typo sends it elsewhere. If the page with your entries is still open, look at it there.</li>
  <li><b>Give it a little while,</b> especially if the system was busy when you filed.</li>
  <li><b>Check it wasn't a long address.</b> The email box takes up to 50 characters and only one address. The form should catch these, but it's quick to rule out.</li>
</ol>

<h2>If the submitted page is still open</h2>
<p>Download the card now. The site asks whether to download the document or open it in a new tab. Save it on your phone and take a screenshot too, in case you land without data. The embassy says the PDF can be printed or shown on a smart device at immigration.</p>

<h2>If you closed the page and have no email</h2>
<p>The site has an update section, reached from its home page, that searches for an existing card. Its code includes a route for searching by email, and the normal search asks for your card number. We haven't run this on a real card, because we don't submit test data to government forms, so we can't say how well it works for a lost confirmation.</p>
<p>Filing again is also possible, as long as you're in the three-day window and your details are correct. It's free on the official site, though we don't know how immigration treats two cards for one trip, so keep the latest one and be ready to explain. <b>Don't pay anyone</b> to retrieve it.</p>

<h2>At the airport</h2>
<p>The embassy's answer is straightforward: if you do not receive the email or QR code, notify the immigration officer at the checkpoint. Keep your flight and hotel details handy. There are also kiosks at BKK, DMK, HKT, CNX and HDY if you have to file there.</p>

<h2>For next time</h2>
<p>Use an email you can open on your phone abroad, rather than a work account that needs a VPN. If you're filing for a family, every traveller is on one submission, so one good address is enough.</p>
`,
    faq: [
      { q: "How long does the TDAC email take?", a: "Often a few minutes, according to travellers and guides. We have no official figure. A busy system could take longer." },
      { q: "Do I have to print the TDAC?", a: "The embassy says the PDF can be printed or shown on a smart device, so a phone copy is accepted." },
      { q: "Is the email from a real government address?", a: "We can't list the sender here with confidence, so check the link you used was tdac.immigration.go.th. Be wary of an email asking you to pay or log in." },
    ],
    sources: [S.thEmbassy, S.thCode],
    bridge: "ArrivalFiller remembers the email you used for each traveller and fills it on the last page, which removes one chance of a typo sending your card elsewhere.",
  },
  {
    path: "/thailand/tdac-change-after-submit",
    country: "th",
    updated: "2026-11-05",
    title: "Made a mistake on your TDAC? How to change it after submit",
    description: "You can update a TDAC after submitting, but not your name or passport. What can change, what needs a new submission, and what to do when your flight moves.",
    h1: "Made a mistake on your TDAC? How to change it after submitting",
    answer: "You can update a submitted TDAC through the site's update option, using your TH Digital Arrival Card number. You can't update your full name in passport or other locked identity details: the site says to make a new submission instead. A changed flight or a changed hotel generally goes through update, provided your arrival date is inside the three-day window.",
    body: `
<h2>What the site says</h2>
<p>The confirmation page reads: "If need be, you can update the submitted information prior to the trip." The update screen then adds: "Please note that you will not be able to update the following information", followed by a list that includes "Full Name (In Passport)", and ends: "If you wish to update any of the fields above, please make a new submission."</p>
<p>Pattaya Mail reported before launch that passport number, name, nationality and date of birth can't be changed once submitted. That matches the update screen's locked fields as far as we can read them from the code.</p>

<h2>Which fix do you need?</h2>
<div class="table"><table>
  <tr><th>What went wrong</th><th>What to do</th></tr>
  <tr><td>Typo in your name</td><td>New submission</td></tr>
  <tr><td>Typo in your passport number</td><td>New submission. Don't let this one slide, because the number is what identifies you at the border.</td></tr>
  <tr><td>Wrong nationality or birth date</td><td>New submission</td></tr>
  <tr><td>Flight number changed, same day</td><td>Update</td></tr>
  <tr><td>Hotel changed</td><td>Update</td></tr>
  <tr><td>Arrival moved by a day or two</td><td>Update, if the new date is in the calendar</td></tr>
  <tr><td>Trip moved by a week or more</td><td>The new date can't be picked yet. Wait until you're within three days of it, then update or file again.</td></tr>
  <tr><td>Trip cancelled</td><td>We found no official way to cancel. A card is tied to its one entry, so there's nothing to use if you don't travel.</td></tr>
</table></div>

<h2>How to update</h2>
<ol>
  <li>Go to <code>tdac.immigration.go.th</code> and find the update option for your arrival card.</li>
  <li>Search for your card. You'll need your TH Digital Arrival Card number (at least seven letters and digits), which is in your confirmation, along with your passport details.</li>
  <li>Change what's needed and review it. The form warns: "Please ensure all information is accurate before submitting the form."</li>
  <li>Submit. A successful update shows "Your Thailand Digital Arrival Card submission is update!" (their wording).</li>
</ol>
<p>We've read these steps from the site's text and code, but we haven't run them, because we don't submit test data to government forms. Labels may differ a little on screen.</p>

<h2>Before you submit, you can still edit freely</h2>
<p>The review page is the cheap place to catch errors. It says: "Use 'Edit' to modify information, 'Delete' to remove entries, and select 'Submit' when all information is complete and correct." Check names and passport numbers there against the passport itself, and watch for the letter O and the number 0.</p>

<h2>Filing a new one</h2>
<p>A new submission is free on the official site. Each TDAC is for one entry, so show officers the most recent one if asked. We couldn't find an official statement on whether the earlier one needs cancelling, so if you're worried, mention it to the officer rather than guessing.</p>
`,
    faq: [
      { q: "Is a small name typo a problem at immigration?", a: "We can't say how an officer will treat it. Since the fix is free, filing again is the safer choice if you're inside the window." },
      { q: "Do I need a new TDAC for a delayed flight?", a: "If you land on the same day with a different flight, update the flight. If the date moves too, update the date. The embassy doesn't describe every case, so an officer has the last word." },
      { q: "Can someone else update it for me?", a: "The search needs your card and passport details, so anyone with those could enter them. Only give them to people you trust, and never to a paid site you found through an ad." },
    ],
    sources: [S.thCode, S.thPattaya, S.thEmbassy],
    bridge: "A wrong passport digit means a whole new card. ArrivalFiller reuses what you entered and got right, and you check it before you press Submit.",
  },
  {
    path: "/thailand/tdac-fake-websites",
    country: "th",
    updated: "2026-11-05",
    title: "Fake TDAC websites: how to spot one, and what to do if paid",
    description: "The real TDAC is free and only on tdac.immigration.go.th. How to recognise a copy, and what to do if you paid or typed in your passport details.",
    h1: "Fake TDAC websites: how to spot one, and what to do if you paid",
    answer: "The official TDAC is free and lives at tdac.immigration.go.th. Any other address, or any request for a card payment to submit the form, means you aren't on the official site. If you paid one, you may not have a valid card: file again on the official site, ask your bank about the charge, and watch out for messages using the details you gave them.",
    body: `
<h2>How to check in ten seconds</h2>
<ul>
  <li><b>Read the address from the right.</b> What matters is the part right before the first slash. It must end in <code>immigration.go.th</code>. A name such as <code>tdac-thailand.example.com</code> isn't official, even if the page shows a Thai crest.</li>
  <li><b>Look for a price.</b> The embassy says the card is free and warns against websites charging administrative fees.</li>
  <li><b>Be wary of "urgent" or "fast approval".</b> The card isn't an approval, and it can't be sped up by paying.</li>
  <li><b>Don't arrive by ad.</b> Type the address, or use a link from a Thai government or embassy site.</li>
</ul>

<h2>How common is this?</h2>
<p>Thai immigration police warned about fake TDAC sites on the day the system launched, 1 May 2025, and said they look official, charge fees and collect sensitive data. In June 2025, immigration, the Tourist Police and embassies ran a campaign urging travellers to use only the official address, attributing part of the problem to scammers manipulating search results.</p>
<p>One account in The Thaiger describes a family of three who paid US$120 each for an "urgent service" and waited hours with no card. Note that article's content comes from a company selling related services, so treat it as one side's story.</p>
<p>Being independent ourselves, we should say this plainly: this site isn't a government site either. We don't file cards, we don't take payment, and we don't see your data. The form you fill in with our extension is still the official one, on the official address.</p>

<h2>If you paid or typed your details into a copy</h2>
<ol>
  <li><b>Assume you don't have a valid card.</b> Go to the official site and file. It's free. If you have a card from the other site, compare it, but don't rely on it.</li>
  <li><b>Call your bank</b> about the charge and ask what they can do. Have the date, amount and site address ready, and take screenshots if the page is still up.</li>
  <li><b>Treat your passport details as exposed.</b> Expect convincing emails. Don't open links in messages about your "application", and don't give more details to anyone who contacts you.</li>
  <li><b>Check what's stored.</b> If you created an account with a password you use elsewhere, change it there.</li>
  <li><b>Report it.</b> Thailand's Tourist Police took part in the 2025 campaign, so they are a sensible place to report it.</li>
</ol>

<h2>Are all third-party services scams?</h2>
<p>No. An agent can legitimately help a traveller who needs it, and some sell related services openly. The line we'd use: anyone charging for the free 72-hour submission should tell you clearly that it's free on the official site. Many don't. You can do it yourself in a few minutes, and if you're stuck, the <a href="/thailand">step-by-step guide</a> and <a href="/thailand/tdac-not-working">error guide</a> are free too.</p>
`,
    faq: [
      { q: "Is there a TDAC app I should use?", a: "The embassy's instructions point to the website and its QR code. Be careful with apps from search results, and check who publishes them." },
      { q: "Is tdac.immigration.go.th safe?", a: "That's the address the Thai embassy gives. As ever, check the spelling carefully, since copies often differ by a word." },
      { q: "Is ArrivalFiller an official service?", a: "No. It's an independent, free browser extension that fills the official form from answers saved in your own browser. You still submit on the government's site." },
    ],
    sources: [S.thEmbassy, S.thWiki, S.thThaiger],
    bridge: "ArrivalFiller only runs on the official address. It has no payment step and nothing goes to us, and it won't activate on a copy of the form.",
  },

  // ---------------------------------------------------------------- Indonesia
  {
    path: "/indonesia",
    country: "id",
    updated: "2026-11-05",
    title: "All Indonesia Arrival Card: what to have ready",
    description: "Indonesia's All Indonesia arrival card in plain words: who needs it, the 72-hour rule, what it asks, and what to do when it fails. Not a government site.",
    h1: "All Indonesia Arrival Card guide",
    answer: "The All Indonesia Arrival Card is a free online form that combines immigration, customs and health declarations. Everyone arriving needs their own, children and infants included. File it at allindonesia.imigrasi.go.id within 72 hours before you land. You get a QR code by email, which you show with your passport. It isn't a visa, and you don't need an account: there's a guest option.",
    body: `
<h2>What it replaced</h2>
<p>It folds together what used to be separate: the immigration arrival card, the SATUSEHAT health declaration and the e-CD customs declaration. If an old guide tells you to do those individually, it's out of date.</p>

<h2>Who needs one</h2>
<p>All international travellers arriving in Indonesia, including tourists and business travellers. Indonesian citizens returning home do too, using a separate form on the same site. The site checks this: if your passport doesn't match the form, you may see "The passport submitted does not indicate Indonesian citizenship. Please ensure you are using the correct application form for foreign visitor."</p>

<h2>What to have ready</h2>
<ul>
  <li><b>Passport:</b> number, nationality, issue and expiry dates, name, birth date. An expired one stops you: "This passport has expired. Please use a passport that is still valid to continue."</li>
  <li><b>Contact:</b> an email you can open abroad, because the QR code goes there, and a phone number. The form reminds you: "Please make sure your email address is correct".</li>
  <li><b>Trip:</b> arrival and departure dates, visa or stay permit number if you have one, flight or ship details and port of entry.</li>
  <li><b>Stay:</b> hotel name and address.</li>
  <li><b>Declarations:</b> recent countries visited, symptoms, goods to declare (including cash, animals and certain foods) and number of bags. Phones may need their IMEI registered.</li>
</ul>

<h2>How the form runs</h2>
<ol>
  <li>Go to the official site, switch to English if needed, and choose Foreign Visitor.</li>
  <li>Choose to submit as a guest, or log in. The guest route needs no account.</li>
  <li>Enter passport, trip, transport and address details, then the health, customs and quarantine questions.</li>
  <li>Review the summary. The site asks you to confirm before you submit.</li>
  <li>Save the QR code on screen and check for the email.</li>
</ol>

<h2>When something goes wrong</h2>
<ul>
  <li><a href="/indonesia/all-indonesia-not-working">The form won't submit or shows an error</a></li>
  <li><a href="/indonesia/all-indonesia-qr-code-not-received">The QR code never arrived, or you lost it</a></li>
  <li><a href="/indonesia/all-indonesia-update-after-submit">You made a mistake, or your plans changed</a></li>
  <li><a href="/indonesia/all-indonesia-family-group">You're travelling as a family or group</a></li>
  <li><a href="/indonesia/all-indonesia-fake-websites">You may have paid a copy of the form</a></li>
</ul>

<h2>Other requirements still apply</h2>
<p>The card doesn't replace a visa. Your passport generally needs six months' validity, and you may be asked for an onward ticket. Those are separate from the form, and the guide linked below lists them. Check the rules for your nationality before you fly.</p>
`,
    faq: [
      { q: "Is the All Indonesia card free?", a: "Yes. Australia's Smartraveller says it should be free and warns about fake sites charging a fee. A visa on arrival, if you need one, is a separate paid item." },
      { q: "Do I need an account?", a: "No. The site offers \"Submission of Arrival Card as Guest\". An account lets you save profiles and see your history from the last 90 days." },
      { q: "Is there an app?", a: "Yes, an official All Indonesia app also exists, according to third-party guides. We only cover the website here, since that's where our extension works." },
    ],
    sources: [S.idGuide, S.idCode, S.idScam],
    bridge: "Same passport, same hotel, same answers? ArrivalFiller remembers each traveller after the first card and fills the next one for you to check.",
  },
  {
    path: "/indonesia/all-indonesia-not-working",
    country: "id",
    updated: "2026-11-05",
    title: "All Indonesia arrival card not working? Common causes",
    description: "All Indonesia form won't submit, passport rejected or a SCRAM-SHA-256 error? The messages the form shows, what they mean, and your fallback if the site is down.",
    h1: "All Indonesia arrival card not working: causes and fixes",
    answer: "If the form rejects you with a clear message, it's usually the passport type, an expired passport or a blank required field. If it fails with a technical message, such as an authentication error, the fault is on the server: your entries aren't the cause, so try again later rather than changing them. Allow time before your flight, as the government says it doesn't guarantee uninterrupted access.",
    body: `
<h2>Messages the form can show</h2>
<p>These come from the site's own code. We can't always tell exactly when each appears, but the wording usually points to the fix.</p>
<div class="table"><table>
  <tr><th>Message</th><th>What to do</th></tr>
  <tr><td>"This passport has expired. Please use a passport that is still valid to continue."</td><td>Check the expiry date you typed. If it's truly expired, you need a new passport before you can file or travel.</td></tr>
  <tr><td>"The passport submitted does not indicate Indonesian citizenship. Please ensure you are using the correct application form for foreign visitor."</td><td>Go back and choose Foreign Visitor.</td></tr>
  <tr><td>"The submitted passport shows Indonesian citizenship. Make sure you use the correct application form for Indonesian citizens."</td><td>The reverse. Use the citizens' form, or check the nationality you selected.</td></tr>
  <tr><td>"Please confirm your visa first to proceed with the next process."</td><td>Complete the visa step. In a group, each member's visa needs confirming.</td></tr>
  <tr><td>"The limit for group arrival applications is only 10 travellers."</td><td>Split a large party. See <a href="/indonesia/all-indonesia-family-group">the group guide</a>.</td></tr>
  <tr><td>"Please review your form again."</td><td>A field is incomplete or wrong. Scroll back through each section.</td></tr>
  <tr><td>"Make sure that the passport photo is in landscape format."</td><td>Rotate or retake the picture. The site mentions a 2 MB file limit on uploads.</td></tr>
  <tr><td>"Request failed with status code ..."</td><td>A failed connection to the server. Retry later.</td></tr>
</table></div>

<h2>The authentication error people report</h2>
<p>Reader comments on one travel blog describe the form stopping at submission with an authentication failure mentioning SCRAM-SHA-256. That's a database login term, so it points to a fault on the server's side, not with your browser or your answers. Commenters guessed the same. We found no official statement about it.</p>
<p>If you see something like this, changing browsers probably won't help. Wait and try again later, and save your details somewhere handy so a retry doesn't mean searching for them again.</p>

<h2>Things to try for an ordinary failure</h2>
<ol>
  <li>Make sure you're on <code>allindonesia.imigrasi.go.id</code>. A different address <a href="/indonesia/all-indonesia-fake-websites">may be a copy</a>.</li>
  <li>Check you're within 72 hours of arrival. One guide reports that a card submitted too early means completing a new one in the window.</li>
  <li>Fill every required field. Guides report blank fields such as flight number, Indonesian address or the declarations blocking submission.</li>
  <li>Reload, or use a different browser or device. Avoid page translation while filling the form, as it can make a page behave oddly.</li>
</ol>

<h2>"My card was charged but the site says failed"</h2>
<p>A traveller on the same blog reported this. Note that the arrival card itself is free, so a payment page for it is a warning sign about which site you're on. A visa on arrival is different: it is paid, and the official site handles that too, so check which one you were paying for. Either way, contact your bank with the details.</p>

<h2>If it still won't work</h2>
<p>Sources differ on this. Some say travellers who haven't completed the card can still enter, and others stress that you'll be asked for proof. Plan to have your QR code, and if the system truly fails, keep a screenshot of the error and ask staff on arrival. The site points to a call centre for help without listing a number we can verify, so check its help page.</p>
`,
    faq: [
      { q: "Can I fill in the All Indonesia form at the airport?", a: "Travellers have asked this and reports differ. Treat it as a fallback rather than a plan, and expect queues." },
      { q: "Why does the form reject a passport I've used before?", a: "Check the expiry date you typed and which form you're on. The site also says to use the same passport as for other immigration applications, which matters if you've renewed since applying for a visa." },
      { q: "Is the site down right now?", a: "We don't monitor it. If the same technical error appears on two networks and devices, assume the server is at fault and try later." },
    ],
    sources: [S.idCode, S.idGuide, S.idBlog],
    bridge: "When a form fails at the last step, retyping is the worst part. ArrivalFiller keeps your answers in your browser, so a retry is a few presses of Fill.",
  },
  {
    path: "/indonesia/all-indonesia-qr-code-not-received",
    country: "id",
    updated: "2026-11-05",
    title: "All Indonesia QR code not received? How to get it back",
    description: "No QR code after submitting Indonesia's arrival card? Check spam, then use the site's retrieve page to search and re-download your proof of submission.",
    h1: "All Indonesia QR code not received: how to get it back",
    answer: "Check your spam folder, then use the official site's retrieve option. The site says travellers \"may look up and re-download proof of their submission\", so a missing email isn't the end. Enter your details exactly as you submitted them. Once you have the code, save it to your phone and take a screenshot, in case you land without data.",
    body: `
<h2>Step by step</h2>
<ol>
  <li><b>Search your email,</b> including spam and promotions, for "arrival card", "imigrasi" and "All Indonesia".</li>
  <li><b>Look for a typo.</b> The QR code goes to the address on your form, and a typo sends it to someone else. That also means a stranger could receive your code, so fix it promptly.</li>
  <li><b>Use the retrieve option</b> on <code>allindonesia.imigrasi.go.id</code>. The site describes it as "Search for and retrieve your arrival card", and asks you to "Please enter accurate information to retrieve your arrival card."</li>
  <li><b>Save it in two places:</b> a screenshot in your photos and a copy of the file. A printed copy is a sensible backup.</li>
</ol>

<h2>If the retrieve search finds nothing</h2>
<p>That may mean your submission didn't go through. Review what happened: did you reach a summary page and press Submit, and were you shown a code? If the form stopped with an error, see <a href="/indonesia/all-indonesia-not-working">the error guide</a>.</p>
<p>Re-check the details you searched with, especially the passport number. Letter O and number 0 are the usual culprits, and if you typed one wrongly when filing, you'll have to search with that same wrong value, or file again.</p>
<p>If you registered an account, you can also look there: the site says "Displaying your history within the last 90 days". As a guest you won't have that, so the retrieve search is your route.</p>

<h2>"Arrival Card QR Code can no longer be used"</h2>
<p>That message exists in the site's code. We can't see from outside exactly what triggers it, but it plausibly means the code has already been used or is out of date, for example from an earlier trip, or a card replaced by a later one. Make sure you're holding the code for this trip, then retrieve the latest one. If you can't get a working code, file a new card if you're within the window.</p>

<h2>Is the code the only thing I need?</h2>
<p>You present the QR code with your passport at the entry point. You may also be asked for your visa or visa exemption and an onward ticket. Guides say an officer at a manual counter may ask to scan the code, so keep the screen brightness up and the picture large.</p>

<h2>Families: which code goes with whom?</h2>
<p>Each person has their own card. If you filed for a group, the site treats the group as one submission with several people, so check you've got a code for everyone, children included, before you leave for the airport. See <a href="/indonesia/all-indonesia-family-group">filing for a family</a>.</p>

<h2>Why it might have gone astray</h2>
<p>Work email systems often filter automated government mail, and some block foreign senders outright. A personal address you can open on your phone abroad is the safer choice next time. Enter it slowly, because the form cannot tell a typo from a real address.</p>
`,
    faq: [
      { q: "How long does the All Indonesia QR code take to arrive?", a: "There's no official figure we can cite. If it hasn't come after you've checked spam, use the retrieve option rather than waiting." },
      { q: "Do I need to print the QR code?", a: "A phone copy is the normal way to show it. Guides suggest carrying a printed copy too, as a backup." },
      { q: "Can I use last trip's QR code?", a: "No. You file a new card for each arrival, so use the one for this trip." },
    ],
    sources: [S.idCode, S.idGuide],
    bridge: "ArrivalFiller fills your saved email in with the rest of your answers, so there's one less place for a typo to send your QR code astray.",
  },
  {
    path: "/indonesia/all-indonesia-update-after-submit",
    country: "id",
    updated: "2026-11-05",
    title: "Mistake on your All Indonesia card? How to update it",
    description: "Wrong detail on Indonesia's arrival card, or plans changed? The site lets you update before you travel, and says you must. How to do it, and when to refile.",
    h1: "Mistake on your All Indonesia card? How to update it",
    answer: "The site says \"you can update the submitted information prior to the trip\", and goes further: \"You must immediately update your information if there is a change.\" So a changed flight or hotel, or a wrong detail, should be fixed through the update option before you travel. If that isn't possible, a new submission is the fallback, and you should use the latest QR code.",
    body: `
<h2>What the site says</h2>
<p>Three lines in the form's own text set this out:</p>
<ul>
  <li>"If need be, you can update the submitted information prior to the trip."</li>
  <li>"You must immediately update your information if there is a change."</li>
  <li>"Are you sure you want to update the application data?" (the confirmation you'll see)</li>
</ul>
<p>That second line matters more than most guides let on. It isn't optional tidying. If your flight changes, the card should say so.</p>

<h2>How to update</h2>
<ol>
  <li>Go to <code>allindonesia.imigrasi.go.id</code> and open the option to retrieve your arrival card.</li>
  <li>Enter your details as you submitted them. If you registered an account, your history is there as well.</li>
  <li>Open the submission and choose to change the data.</li>
  <li>Check the summary and confirm. Then save the QR code again, in case a new one is issued.</li>
</ol>
<p>We read this flow from the site's code and text, and haven't run it, because we don't submit test data to government forms. The screens may differ a little.</p>

<h2>What if the fix is to your passport details?</h2>
<p>The site tells you: "Make sure your information matches the one on your passport. Please feel free to edit any wrong details." That applies during filing, when it's easy. After submission, we can't say from the outside which fields stay editable. If the update screen won't let you change a passport detail, filing a new card is the fallback. Third-party guides say to keep the latest QR code, and one suggests changes are possible until the code has been scanned at immigration.</p>

<h2>Common situations</h2>
<div class="table"><table>
  <tr><th>What changed</th><th>What to do</th></tr>
  <tr><td>Flight number or time</td><td>Update the card.</td></tr>
  <tr><td>Hotel or address</td><td>Update the card.</td></tr>
  <tr><td>Arrival date, still within 72 hours</td><td>Update the card.</td></tr>
  <tr><td>Arrival date moved days later</td><td>You may need to wait until the new date is within the 72-hour window, then update or file again.</td></tr>
  <tr><td>Wrong email, so no QR code</td><td>Use retrieve to get the code, then correct the address. See <a href="/indonesia/all-indonesia-qr-code-not-received">the QR code guide</a>.</td></tr>
  <tr><td>New passport since you filed</td><td>File a new card with the new passport.</td></tr>
  <tr><td>Goods or health answers changed</td><td>Update the declaration. These answers need to be true on the day you arrive.</td></tr>
</table></div>

<h2>Check before you press Submit</h2>
<p>The form says: "Please review the answers you have provided for each section below before submission." It's worth doing. Declaration answers carry real consequences: the site warns that items exceeding allowances may be confiscated and destroyed by officers, and that false information can break the rules.</p>
`,
    faq: [
      { q: "Can I change my All Indonesia card after submitting?", a: "Yes, the site says you can update it before the trip, and that you must if something changes." },
      { q: "Should I file a second card if I made a mistake?", a: "Try updating first. If the screen won't allow the change, file a new one, and show the latest QR code." },
      { q: "What if my flight is delayed after I've left for the airport?", a: "If you can get online, update it. If you can't, explain to the officer on arrival. We can't speak for how they'll treat it." },
    ],
    sources: [S.idCode, S.idGuide],
    bridge: "Declaration answers don't change much between trips, but they have to be true this time. ArrivalFiller brings them back for you to check one by one.",
  },
  {
    path: "/indonesia/all-indonesia-family-group",
    country: "id",
    updated: "2026-11-05",
    title: "All Indonesia card for families, kids and groups",
    description: "Every traveller needs their own All Indonesia card, including babies. How group filing works, the limit of 10, and why children under 7 may mean a manual queue.",
    h1: "All Indonesia card for families, kids and groups",
    answer: "Every traveller needs their own card, including children and infants. The site also has a group option, capped at 10 travellers, and each member's visa has to be confirmed. Families with young children should allow extra time on arrival: a September 2025 report said children under seven can't use the automatic gates, so the whole family queues for manual processing.",
    body: `
<h2>Each person has a card</h2>
<p>Travel guides agree that children and infants need a card of their own. A baby's passport details go in just like an adult's, and the health and customs questions are answered on their behalf. That makes it the form's most time-consuming scenario: a family of four is four sets of passport details.</p>

<h2>Using the group option</h2>
<p>The site has a route for group applications, with its own summary and retrieve pages. What its text tells us:</p>
<ul>
  <li>"The limit for group arrival applications is only 10 travellers." A larger party needs to split into several groups.</li>
  <li>"You have to select multiple traveller" appears if you try to file a group of one.</li>
  <li>"Please confirm your visa first to proceed with the next process." Each member has a visa confirmation step, under "Group Member Visa Confirmation".</li>
</ul>
<p>If you register an account, you can save profiles: "Your profile data will be saved, and can be used for submission." That's handy for frequent travellers, but it does mean creating an account with a verification code by email.</p>
<p>We read these from the site's code and haven't filed a real group, since we don't submit test data to government forms. So we can't tell you whether group filing produces one code or several. Check that everyone is covered before you travel, and <a href="/indonesia/all-indonesia-qr-code-not-received">use the retrieve page</a> if you're unsure.</p>

<h2>Kids and the automatic gates</h2>
<p>The West Australian reported in September 2025 that the QR process doesn't let children under seven through the automatic gates at Denpasar, so the whole family has to queue for manual processing, and that the separate facility had only two or three booths for hundreds of families. This comes from one unnamed source, it's over a year old, and the arrangement may have changed since. Still, it's worth building some time into your plans. Bring snacks.</p>

<h2>Practical tips for filling it in for a family</h2>
<ul>
  <li><b>Lay out every passport first.</b> Mixed-up numbers between family members are easy to make and hard to spot.</li>
  <li><b>Use one email you control.</b> Children may not have one, and the QR code needs to reach you.</li>
  <li><b>Answer goods questions for what each person carries.</b> Allowances are per passenger. The site notes that items exceeding "Maximum Allowance per Passenger" may be confiscated.</li>
  <li><b>Watch the health questions.</b> They ask about symptoms and contacts, and each person's answers can differ.</li>
  <li><b>Check each child's passport expiry.</b> Children's passports often run for less time than adults', and the form refuses an expired one.</li>
  <li><b>Do it within 72 hours, but not at the last minute.</b> Four or more cards can take a while, especially if the site is slow.</li>
</ul>
`,
    faq: [
      { q: "Do babies need an All Indonesia arrival card?", a: "Yes. Guides say each person needs their own card, including children and infants." },
      { q: "Can one parent fill in all the cards?", a: "Yes, one person can enter everyone's details, using one email if they wish. Make sure the codes reach them." },
      { q: "How many people can be on a group application?", a: "The site says the limit is 10 travellers." },
    ],
    sources: [S.idCode, S.idGuide, S.idKids],
    bridge: "This is what ArrivalFiller was built for. Save a set of answers for each family member once, then switch between them in one click and press Fill.",
  },
  {
    path: "/indonesia/all-indonesia-fake-websites",
    country: "id",
    updated: "2026-11-05",
    title: "Fake All Indonesia websites: spot one, and what to do if paid",
    description: "The All Indonesia arrival card is free, on a go.id address. How to recognise a copy charging a fee, and what to do if you paid or typed in your passport details.",
    h1: "Fake All Indonesia websites: spot one, and what to do if paid",
    answer: "The arrival card is free, at allindonesia.imigrasi.go.id. Australia's Smartraveller warns of fake websites charging a fee, and says official sites include \"go.id\" in the address. If you paid for the card elsewhere, assume you may not hold a valid one: check by retrieving it on the official site, file there if not, and contact your bank.",
    body: `
<h2>Spotting a copy</h2>
<ul>
  <li><b>Look at the end of the address.</b> Indonesian government sites end in <code>go.id</code>. <code>allindonesia.imigrasi.go.id</code> is right. A name containing "indonesia" and "arrival card" that ends in something else isn't.</li>
  <li><b>Is it asking for a "processing fee"?</b> The arrival card is free. One Reddit traveller, quoted in Australian newspapers in May 2026, paid $148 to a scam site.</li>
  <li><b>Are you there from an ad?</b> Paid ads can sit above the real result. Type the address yourself.</li>
</ul>

<h2>One real source of confusion: e-VOA</h2>
<p>The official immigration service also runs paid items: a visa on arrival is a real, paid product, sold through government addresses such as <code>evisa.imigrasi.go.id</code>. So a payment on a <code>go.id</code> address isn't automatically a scam. The test is what you're paying for:</p>
<div class="table"><table>
  <tr><th>Item</th><th>Cost</th><th>Where</th></tr>
  <tr><td>Arrival card (customs, health, immigration)</td><td>Free</td><td><code>allindonesia.imigrasi.go.id</code></td></tr>
  <tr><td>e-Visa on arrival, if your nationality needs one</td><td>Paid</td><td>Official <code>go.id</code> address only</td></tr>
  <tr><td>"Arrival card processing" on any other site</td><td>Not a real fee</td><td>Avoid</td></tr>
</table></div>
<p>The official site also has "Arrival Card" and visa confirmation steps in the same flow, which explains why some travellers think the card has a price. It doesn't.</p>

<h2>If you paid or typed your details into a copy</h2>
<ol>
  <li><b>Check whether you have a real card.</b> On the official site, use the retrieve option with your details. If nothing comes up, file there for free, as long as you're within 72 hours of arrival. Some copies may file for you, but you shouldn't rely on that.</li>
  <li><b>Call your bank</b> with the date, amount and web address, and ask about disputing the charge. Screenshots help.</li>
  <li><b>Treat your passport details as exposed.</b> Be careful with later emails about your "application" or "visa". Travellers have also been warned about <a href="https://bali.live/p/tourists-warned-about-scam-emails-after-applying-for-an-indonesian-e-visa" rel="noopener">fake emails after applying for an Indonesian e-visa</a>.</li>
  <li><b>Report it.</b> If you're Australian, Scamwatch takes reports. Your own country's equivalent is a good place elsewhere.</li>
</ol>

<h2>About this site</h2>
<p>We aren't the government either, and you should apply the same scepticism to us. Here's how to check: we don't file anything, don't take payment and never ask for your passport on this website. Our extension works only on the official form, on the official address, and it's <a href="https://github.com/99Darius/ArrivalFiller">open source</a>, so anyone can read exactly what it does. The form you see while using it is the government's own, in your own browser.</p>

<h2>Why these sites do well in search</h2>
<p>The official form's home page contains very little text for a search engine to read, and it has no explanatory guides of its own. That leaves room for lookalikes with long pages and paid ads to rank above it. A high position in a search result tells you nothing about who runs a site. Go by the address.</p>
`,
    faq: [
      { q: "Is allindonesia.imigrasi.go.id the real site?", a: "Yes. Newspapers quoting Smartraveller, and official guidance, name it as where to file." },
      { q: "Is there a fee to get the QR code faster?", a: "Not on the official site. The arrival card is free, and paying a third party doesn't change how Indonesia's system handles it." },
      { q: "Is the mobile app official?", a: "An official All Indonesia app is described by guides, so check the publisher in your app store before you enter passport details." },
    ],
    sources: [S.idScam, S.idCode, S.idGuide],
    bridge: "ArrivalFiller runs only on the official go.id address and has no payment step. If the form on your screen isn't the government's, it stays out of the way.",
  },
];
