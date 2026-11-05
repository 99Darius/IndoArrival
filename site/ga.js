// Website visits only. The extension has no analytics, and this file is never part of it.
// No advertising cookies anywhere. In the EEA, UK and Switzerland, no analytics cookies either.
(function () {
  var ID = "G-R9XLSHFGQW";
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
  gtag("consent", "default", {
    analytics_storage: "denied",
    region: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH"],
  });
  gtag("js", new Date());
  gtag("config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false });

  // The one number that matters: who goes on to the store, and from which page.
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href*="chromewebstore.google.com"]');
    if (link) gtag("event", "store_click", { page_path: location.pathname, transport_type: "beacon" });
  });

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);
})();
