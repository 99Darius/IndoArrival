// Site-wide settings. Changing SITE and rebuilding moves every canonical, sitemap and
// llms.txt address together (site/index.html and site/privacy.html hold it by hand too,
// and check-pages.mjs fails if they disagree).
export const SITE = "https://arrivalfiller.vercel.app";
export const CTA_URL = "https://chromewebstore.google.com/detail/emdkbckehgnfnjggcfndccmjahncjkmc";

// Real change dates, for the sitemap.
export const HOME_UPDATED = "2026-11-05";
export const PRIVACY_UPDATED = "2026-11-05";

export const plainText = html => html.replace(/<[^>]+>/g, "");

// Shown on the home page and in llms.txt. index.html repeats these by hand, and the checks
// fail if the page and this list drift apart.
export const HOME_FAQ = [
  { q: "What does ArrivalFiller do?", a: "It's a free Chrome extension for the official arrival cards of Indonesia and Thailand. Fill a card once as usual and it remembers that traveller's answers. Next trip, press Fill on each page, check everything, and submit yourself." },
  { q: "Is it an official government service?", a: "No. It's an independent tool, not affiliated with either government. It fills the official form on the official website, and you remain responsible for what you declare." },
  { q: "Does it submit the card for me?", a: "No. It never presses Next, Continue, Agree or Submit. You check each answer and press those yourself." },
  { q: "Where do my passport details go?", a: "Nowhere. The extension stores them only in your browser's extension storage. It has no account, no server and no analytics, and uninstalling it deletes everything." },
  { q: "Can it fix an error on the government's site?", a: "No. If the site is down or rejects a request, only the government can fix that. It does save you retyping when you have to start again." },
  { q: "Does it cost anything?", a: "No, and the arrival cards themselves are free too. Be careful of websites that charge a fee to submit them." },
];
