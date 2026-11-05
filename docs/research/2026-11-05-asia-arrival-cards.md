# Asia online arrival cards: which ones could ArrivalFiller autofill?

Research date: 2026-11-05. Read-only desk research (WebSearch + WebFetch of public pages). No government form was opened, filled or submitted, and no bot check was approached.

Scope: Brunei, Cambodia, Laos, Malaysia, Myanmar, Philippines, Singapore, Vietnam, Timor-Leste, China (mainland), Japan, South Korea. Indonesia and Thailand are already built.

Labels used throughout:
- **[official]** government domain, embassy/consulate page, or government advisory.
- **[unofficial]** travel blog, visa agency, news site, forum. Useful but weaker.
- **unverified** could not confirm from a source I could read, or sources conflict.

Fetch limits: smartraveller.gov.au timed out on every try. Several official sites are JavaScript apps that return only a title to WebFetch (arrival.gov.kh, prearrival.immigration.gov.vn, services.digital.go.jp, eservices.ica.gov.sg, e-arrivalcard.go.kr), so I could not read their form fields. Field lists below come from guides, not from the forms themselves.

---

## 1. Summary table

| Country | Card name | Official URL | Web or app | Window | Login / OTP / captcha | Extension fit | One-line reason |
|---|---|---|---|---|---|---|---|
| Malaysia | MDAC (Malaysia Digital Arrival Card) | https://imigresen-online.imi.gov.my/mdac/main?registerMain | Web only (no app found) | Within 3 days incl. submission day (stated on the form page) | No login seen. "Drag To Verify" slider. PIN is emailed afterwards | **Good** | Plain web form, no account, all fields are passport/contact plus a trip block |
| Singapore | SG Arrival Card (SGAC) with Electronic Health Declaration | https://eservices.ica.gov.sg/sgarrivalcard/ | Web AND MyICA mobile app (app saves a profile) | Within 3 days incl. arrival day | No SingPass mentioned by ICA. Captcha unverified (page would not render to my fetcher) | **Good** (check captcha) | Mandatory for nearly everyone, free, web; but ICA's own app already remembers a profile |
| Philippines | eTravel | https://etravel.gov.ph/ | Web AND eGovPH app | Within 72 hours (3 days) before arrival | "Sign In" link on landing page; no OTP/captcha mentioned; QR code at the end | **Good / possible** | Web form, free, large repeat flow; sign-in behaviour needs checking |
| South Korea | e-Arrival Card (separate from K-ETA) | https://www.e-arrivalcard.go.kr | Web (mobile web) | From 72 hours before arrival until handing in the card | Unverified (page not readable) | **Possible** | Web, free; exempt if you hold a K-ETA, so only some travellers need it |
| China (mainland) | Online Arrival Card for foreigners (NIA) | https://s.nia.gov.cn/ArrivalCardFillingPC/ | Web (NIA site), NIA 12367 app, WeChat/Alipay mini programs | Official pages give no deadline; unofficial guides say 72 hours. Unverified | Unverified. Passport photo upload per Luxembourg consulate | **Possible** | Big market, web form; passport-image upload is hard to autofill and paper/on-arrival fallback exists |
| Cambodia | Cambodia e-Arrival | https://arrival.gov.kh/ | Web AND mobile app | Within 7 days before arrival | No login/OTP/captcha reported by guides; face photo and passport photo uploads | **Possible** | Web form, free, but needs two image uploads and is air-only |
| Vietnam | Pre-arrival information declaration (pilot) | https://prearrival.immigration.gov.vn/ | Web (app unverified) | Within 72 hours of arrival | Unverified | **Possible, later** | Brand new pilot, Tan Son Nhat (SGN) airport only as of the sources I found |
| Japan | Visit Japan Web (online Disembarkation Card + customs) | https://services.digital.go.jp/en/visit-japan-web/ (login at vjw.digital.go.jp, unofficial source) | Web (mobile-first) | Optional, no deadline found | Account with email verification | **Possible, low value** | Optional, and the site already stores passport details and trips in your account |
| Laos | Lao Digital Immigration Form (LDIF) | Official notice: https://www.immigration.gov.la/en/news-detail/submit-arrival-or-departure-digital-card (form URL unverified) | Web (guides); app unverified | Guides: up to 3 days before. Unverified | Uploads: passport copy and selfie (unofficial) | **Possible, later** | Only 4 checkpoints at launch, rollout status unknown |
| Brunei | E-Arrival Card (INRS portal) | https://www.imm.gov.bn/ ("E-Arrival Cards" under E-Services) | Web | Unverified (unofficial: 72 hours) | Portal has Login and Register links; whether the card needs them is unverified | **Possible** | Official but small market, account behaviour unknown |
| Myanmar | None verified | n/a | n/a | n/a | n/a | **No** | I found no official online arrival card, only paper cards and an e-Visa |
| Timor-Leste | None verified | n/a | n/a | n/a | n/a | **No** | Paper arrival form at Dili; no online card found. It is an ASEAN member (11th, 26 Oct 2025) |

---

## 2. Recommended build order

1. **Malaysia (MDAC).** Best fit: web only, no account, free, short form, and the form is almost entirely passport and contact data that repeats. Big flow (reported 42.2M arrivals in 2025, though that includes day-trippers). The "Drag To Verify" slider means the user must still do one human step, which is fine because the user reviews and submits anyway.
2. **Singapore (SGAC).** Mandatory for nearly all travellers, free, web, 16.9M arrivals. Risks: MyICA already saves a profile, so the pitch is "works in desktop browser, no app". Confirm captcha and field names first.
3. **Philippines (eTravel).** Web, free, mandatory-ish (sources disagree on strictness), 6.5M arrivals, lots of "QR code" search language. Check how the Sign In step behaves before building.
4. **South Korea (e-Arrival Card).** Web, free, 18.9M arrivals. A smaller audience of users than it looks, because holders of a K-ETA are exempt. Note the K-ETA waiver for 22 countries runs to 31 Dec 2026; whether it ends on 1 Jan 2027 is unconfirmed. If it ends, more people would need a K-ETA and would skip the e-Arrival Card.
5. **China.** Largest growth story (about 41M foreign entries in 2025, derived), and new since 20 Nov 2025 so people are confused. But the passport photo upload cannot be reliably autofilled, so the extension would fill text fields only. Do after the four above, once the form can be inspected by a human.
6. **Cambodia.** Two image uploads, air only, 5.57M arrivals and falling.
7. **Vietnam.** Revisit when the pilot spreads beyond SGN. 21.2M arrivals, so it could jump up this list.
8. **Brunei, Laos, Japan.** Low volume or already solved by the site's own saved profile.
9. **Skip Myanmar and Timor-Leste.** No online card found.

Reasoning in one line: rank by (mandatory + web + no account + free + repeat fields) first, then by traveller volume.

---

## 3. Per-country notes

### Malaysia: MDAC
- **Card and URL [official]:** Malaysia Digital Arrival Card. Form page: https://imigresen-online.imi.gov.my/mdac/main?registerMain (fetched; it is the Immigration Department's registration page). Menu items: Registration, Check Registration, Check Visit Pass, Check Egate Eligibility Status.
- **Who:** Foreign nationals arriving, requirement in force since 2024 (sources say 1 Jan 2024 [unofficial]). Exemptions reported but conflicting: Singaporeans reportedly exempt, permanent residents and long-term pass holders excluded [unofficial, Yahoo/other]. Unverified exactly who is exempt. The Malaysian mission page at https://www.kln.gov.my/web/aus_canberra/post/malaysia-digital-arrival-card-mdac--1 [official] would be the right source, but the fetch failed with a certificate error.
- **Web or app:** Web. I found no official app.
- **Window [official form page]:** "Please note that your trip must be within 3 days (including the date of submission)".
- **Fee:** Free on the official site. Scam MDAC sites exist [unofficial warnings].
- **Fields from the public form page [official]:** Name, passport no., date of birth, nationality, place of birth, sex, passport expiry, email (twice), country code and mobile; trip block: arrival and departure dates, flight/vessel number, mode of travel (air/land/sea), last port of embarkation, accommodation type, address, state, postcode, city. Roughly 11 repeating personal fields versus about 9 trip-specific fields.
- **Verification:** A "Drag To Verify" slider. No login or OTP seen on the page. A PIN is sent by email after submission and is used on "Check Registration" with passport number and nationality [unofficial, guides].
- **Common failures:** I could not find a quotable error message. Source-supported issues only: confirmation email lands in spam [unofficial guide]; submitting outside the 3-day window [official form text]; fake sites [unofficial]. One forum user wrote "Probably easier on a laptop but did mine on mobile - mostly due to over use (imho) of drop downs boxes" [unofficial, Australian Frequent Flyer thread, undated post; thread started 23 Jul 2023]: https://www.australianfrequentflyer.com.au/community/threads/malaysia-digital-arrival-card-and-autogates.110331/page-4 . Search language seen: "MDAC", "Malaysia digital arrival card", "MDAC PIN", "check registration".
- **Opportunity:** 42.2M international arrivals in 2025 (+11.2%), includes excursionists such as day-trippers from Singapore, so not comparable with overnight counts. [unofficial: Asia Lifestyle Magazine, 5 Oct 2026, https://www.asialifestylemagazine.com/asia-most-visited-countries-2025/] Approximate.

### Singapore: SG Arrival Card
- **Card and URL [official]:** SG Arrival Card (SGAC) with Electronic Health Declaration. ICA info page: https://www.ica.gov.sg/information-and-e-services/entry-and-departure/entering-singapore/sg-arrival-card-with-electronic-health-declaration . e-Service: https://eservices.ica.gov.sg/sgarrivalcard/ (given in ICA's media release).
- **Who [official]:** All travellers, except transit passengers who do not clear immigration, and residents (citizens, PRs, long-term pass holders) using Woodlands and Tuas checkpoints. Residents arriving by air or sea must submit the health declaration only. ICA media release dated 21 Dec 2022 (page shows later "last updated" in Oct 2026).
- **Web or app [official]:** Both the SGAC e-Service (web) and the MyICA Mobile app. ICA says the app "can save your profile to auto-populate information for future trips", which is the same job as ArrivalFiller.
- **Window [official]:** Within 3 days before arrival, counting arrival day (30 June arrival opens 28 June).
- **Fee [official]:** Free. ICA says it does not endorse commercial paid services.
- **Per person or group:** Not stated on the page I could read. One submission can cover up to 3 trips [official]. Group handling unverified.
- **Login/captcha:** ICA page does not mention SingPass or captcha. The e-Service page would not render for my fetcher, so unverified.
- **Fields:** Not visible to me. ICA says an email address is needed for the acknowledgement; passport is shown at the counter, not uploaded. Count of repeating vs trip fields unverified.
- **Common failures [official FAQ via search result, ask.gov.sg]:** ICA tells users who get an error on submission to send an enquiry with a screenshot and say whether they used web or MyICA. The official page also says late submitters "may be asked to submit at the checkpoint and rejoin the immigration queue" (media release). I did not quote any error text; a page at entrycardguide.pages.dev lists error strings but it is unofficial and contradicts ICA, so I ignored it. Search language: "SG Arrival Card", "SGAC", "SG arrival card QR", "SG arrival card 3 days".
- **Opportunity:** 16.9M visitor arrivals in 2025, about +2% [unofficial summary of STB figure: Asia Lifestyle Magazine; STB publishes the source figure]. Approximate.

### Philippines: eTravel
- **Card and URL [official]:** eTravel, https://etravel.gov.ph/ . Landing page says "eTravel is FREE", has a Sign In link, a cruise QR option, and the eGovPH app. Official FAQ (on a customs.etravel.gov.ph subdomain, possibly stale): https://customs.etravel.gov.ph/frequently-asked-questions says "the only official site is https://etravel.gov.ph/".
- **Who:** Official FAQ says "all incoming travelers to the Philippines are advised to use the eTravel registration system". Wording is "advised", so enforcement is unclear. Airlines have enforced it at departure airports per news items [unofficial]. One law-firm summary says foreigners are not required [unofficial, eiglaw.com], which contradicts most sources: unverified.
- **Window [official FAQ]:** "within 3 days (or 72 hours) prior to your arrival". Registering earlier is a stated problem.
- **Web or app:** Both.
- **Login:** Sign In link exists; FAQ mentions an "Edit Registration" tab and a profile lookup at etravel.gov.ph/search using reference number plus date of birth. Whether first-time registration requires an account is unverified.
- **Fields [official FAQ, partial]:** age, traveler classification, itinerary, arrival date, address, personal details. Full list unverified.
- **Common failures [official FAQ]:** lost QR code (retrievable via profile lookup within 72 hours before arrival); mistakes can be edited until the Bureau of Quarantine tags the arrival; presenting a different QR if you registered more than once may cause delays; a red QR code means manual verification. Unofficial: some passengers could not have the QR accessed in the BI system [Inquirer, BI warning, fetch blocked]; travellers denied boarding abroad for lacking the code [unofficial news]; a Singaporean commentator reported "more than five attempts" [unofficial, theindependent.sg]. Fake sites warned about by BI [unofficial news]. Search language: "eTravel QR code", "eTravel registration", "eTravel not working", "eTravel 72 hours".
- **Opportunity:** 6,484,060 arrivals in 2025 including 543,085 returning overseas Filipinos; BI counts 5,940,975 foreign visitors; DICT eTravel reports 5,865,319 [unofficial news citing DOT/BI, e.g. https://www.sunstar.com.ph/manila/ph-tourism-reports-648m-visitors-in-2025-generates-p694b-in-spending]. Approximate. Note returning Filipinos also use eTravel, so the user base is larger than tourist counts.

### South Korea: e-Arrival Card (not K-ETA)
- **Card and URL [official]:** e-Arrival Card, https://www.e-arrivalcard.go.kr (named on the Incheon Airport page: https://www.airport.kr/ap_en/1448/subview.do ). The site itself would not render to my fetcher.
- **K-ETA is separate:** K-ETA (k-eta.go.kr) is a pre-travel authorisation with a 10,000 KRW voluntary fee [unofficial]. Holding a valid K-ETA exempts you from the e-Arrival Card [official Incheon page].
- **Who [official Incheon page]:** Generally all foreign nationals who must fill the paper card. Exempt: registered foreign residents, valid K-ETA holders, airline crew, Korean nationals, Chinese group tourists with a group visa (except youth education groups).
- **Window [official Incheon page]:** "Submit electronically from 72 hours prior to your arrival" until handing in the card. Unofficial guides say the submission lapses 72 hours after filing; unverified.
- **Fee [official]:** None. Note many highly ranked sites (ivisitkorea.com, ketasouthkorea.com and similar) look like commercial sites, not government; treat as possible clones.
- **K-ETA waiver:** Unofficial sources (eiglaw.com, December 2025) say the waiver for 22 countries runs 1 Jan to 31 Dec 2026. Whether it is extended into 2027 is unconfirmed; some travel sites say it ends 1 Jan 2027.
- **Fields, login, captcha, common failures:** Unverified. I found no quotable official error messages.
- **Opportunity:** 18,936,562 foreign arrivals in 2025, record [unofficial: koreainnumbers.com citing KTO, https://koreainnumbers.com/foreign-visitors/]. Approximate; the addressable share is smaller because of exemptions.

### China (mainland): Online Arrival Card for foreigners
- **Card and URL [official]:** National Immigration Administration online arrival card, https://s.nia.gov.cn/ArrivalCardFillingPC/ (Chinese Embassy and consulate notices, e.g. https://chicago.china-consulate.gov.cn/eng/zytz_0/202512/t20251204_11767048.htm, published 4 Dec 2025; https://bb.china-embassy.gov.cn/eng/lsyws/202511/t20251128_11762211.htm, 28 Nov 2025).
- **Start date:** 20 Nov 2025, all ports nationwide [official].
- **Mandatory?** Official pages describe filing online before travel as strongly recommended, and offer fallbacks on arrival: scan QR code, smart devices, or paper card. So it is effectively "required information, online or paper".
- **Exempt [official]:** Foreign Permanent Resident ID holders; HK/Macao travel permit holders (non-Chinese); group visa or group visa-free entrants; 24-hour direct transit staying in the port area; same-vessel cruise passengers; E-channel users; foreign crew.
- **Channels [official]:** NIA website, NIA 12367 app, WeChat and Alipay mini programs, QR code.
- **Window:** No deadline on official pages I could read. Two unofficial guides (Wego, Trip.com) say up to 72 hours before arrival, and an Israeli embassy page reportedly says the same (fetch failed). Unverified.
- **Fee [official]:** Free. NIA warns of counterfeit paid sites posing as the official platform.
- **Fields:** Personal information, flight number, address in China, and a photo of the passport identity page [official, Luxembourg consulate Shanghai, https://shanghai.mae.lu/en/actualites/2025/1120-new-online-arrival-card-system-for-travelers-to-china.html]. A QR code is issued after submission. Login, captcha: unverified. Whether the form is available in English or requires Chinese address input: unverified.
- **Common failures:** None found with quotable text. Official pages do not discuss errors. Known risk areas, per source only: fake paid sites [official NIA]; "private stays require police registration within 24 hours" [unofficial, Wego; not a form failure].
- **Opportunity:** 30.08M visa-free foreign entries, stated as 73.1% of foreign entries, which implies about 41M foreign entries in 2025 (my arithmetic). Quoted in unofficial reporting of the NIA release (https://visasnews.com/en/china-more-than-30-million-visa-free-entries-recorded-in-2025/). Approximate. Note one outlet describes 82M foreign "crossings" (in and out combined).

### Cambodia: e-Arrival
- **Card and URL:** Cambodia e-Arrival, https://arrival.gov.kh/ (page title confirmed; content did not render). Tourism Cambodia [unofficial site] states the General Department of Immigration built it and calls arrival.gov.kh the only official website. I did not find an embassy page, so "official" rests on the .gov.kh domain only.
- **Who:** All air travellers per guides; land borders still use paper [unofficial, Globe Drifters article dated 5 Nov 2026]. Launch dates reported inconsistently in 2024 news (trial from 1 Jan 2024, mandatory from 1 Jul 2024, air launch 1 Sep 2024): unverified.
- **Window [unofficial, two sources]:** Within 7 days before arrival. Editing and resubmitting allowed until immigration processes it.
- **Web and app:** Both. The app shows the QR offline; on the web you must save the QR before leaving the page [unofficial].
- **Fee:** Free. cambodiaarrivalcard.com looks like a commercial lookalike: flag as a probable clone.
- **Fields [unofficial, Globe Drifters]:** face photo upload; passport number, issuing country, passport type, expiry, surname; given names, gender, DOB, birth country, occupation; passport page upload; phone, email; visa checkboxes; arrival/departure dates; port of entry, purpose, flight number; optional ticket upload; accommodation type, hotel name, phone, province; previous and next city; health and customs questions. About 15 repeating fields and about 10 trip fields. Two image uploads limit autofill.
- **Login/OTP/captcha:** Not mentioned by the sources I read. Unverified.
- **Failures:** No quoted errors. Source says "You can only submit this form within 7 days of your arrival" and passport details must match exactly [unofficial].
- **Opportunity:** 5.57M international arrivals in 2025, down 16.9% from 6.7M [unofficial: The Star citing Xinhua/Ministry of Tourism, https://www.thestar.com.my/aseanplus/aseanplus-news/2026/01/27/the-price-of-war---cambodia-records-557-million-international-tourists-in-2025-down-169-from-2024]. Approximate.

### Vietnam: pre-arrival declaration (pilot)
- **Card and URL:** https://prearrival.immigration.gov.vn/ (title "Pre-Arrival Information - Cục Quản lý xuất nhập cảnh", confirms it is the Immigration Department's site; content did not render). All detail below is from Wego (unofficial, published 20 Apr 2026, updated 11 May 2026): https://blog.wego.com/vietnam-digital-arrival-card/ . Its own sources are mostly news/visa services, not government texts.
- **Coverage:** Effective 15 Apr 2026, only Tan Son Nhat airport (SGN) at last report. Hanoi and Da Nang named as likely next; no dates. Land borders under study. Current status after May 2026: unverified.
- **Window:** Within 72 hours before arrival (guides vary between 24 and 72 hours).
- **Who:** Foreigners including visa-exempt, e-visa, visa-on-arrival with approval letter; not Vietnamese citizens on Vietnamese passports or airside transit. Each traveller, including minors, gets their own QR.
- **Fields (unofficial):** name, DOB, gender, nationality, passport number, visa details, flight and arrival date, a specific Vietnam address, health self-declaration.
- **Does not replace the visa.** Whether it replaces the paper NA1 form: sources conflict.
- **Login, captcha, failures:** Unverified. Unofficial guide notes typos or name mismatches can cause rejection at the counter, and advises saving the QR offline.
- **Fee:** Free per guide; paid third-party sites exist [unofficial].
- **Opportunity:** 21.2M arrivals in 2025, +20.4% (Trading Economics and Asia Lifestyle agree). Approximate. Most of those do not yet need the card, because it is limited to SGN.

### Japan: Visit Japan Web
- **Card and URL:** Visit Japan Web (VJW), https://services.digital.go.jp/en/visit-japan-web/ [official, Digital Agency]. Manual: https://www.vjw.digital.go.jp/manual/main/visitjapanweb_manual_en.html (404 when I fetched; unverified). The login host vjw.digital.go.jp comes from an unofficial guide.
- **Mandatory?** Optional. Unofficial guides say the paper Disembarkation Card remains available and ISA recommends but does not require VJW; I did not find an ISA page to confirm. Not an "arrival card" in the Indonesia sense.
- **How it works [official search snippets]:** Foreign visitors register a Disembarkation Card and a customs declaration, receive one unified QR code (since 25 Jan 2024), and show it at the airport. Needs an account, email address confirmation, passport details and airline ticket. Eligible status: Temporary Visitor, Diplomat, Official.
- **Why low value:** The site keeps your account, passport details and trips, so repeat data is already remembered.
- **Captcha, failures, fields:** Unverified. I found no quotable failures from official sources. Unofficial guides report fake VJW sites and paid "assistance" services (May 2026 per one guide).
- **Opportunity:** 42.7M international visitors in 2025, +15.8% [unofficial: Asia Lifestyle Magazine]. JNTO's own preliminary Jan-Oct 2025 total was 35,547,200 (https://asset.japan.travel/image/upload/v1763626725/pdf/Number_of_visitor_arrivals_to_Japan_in_October_2025.pdf). Approximate. Addressable share unknown because VJW is optional.

### Laos: Lao Digital Immigration Form (LDIF)
- **Official source:** Department of Immigration notice https://www.immigration.gov.la/en/news-detail/submit-arrival-or-departure-digital-card (page text did not render; URL taken from a KPMG alert). KPMG alert [unofficial, professional firm]: https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-203.html says the Department of Immigration began using LDIF on 1 Sep 2025 at four points: Wattay (Vientiane), Luang Prabang, Pakse airports and the Lao-Thai Friendship Bridge. Other checkpoints use the paper form. Full rollout expected from fiscal year 2026; whether it happened is unverified.
- **Form URL:** unverified. I tried ldif.immigration.gov.la and it does not resolve.
- **Window:** KPMG gives no deadline. Visa agency guides say up to 3 days before [unofficial].
- **Uploads:** passport copy and selfie per unofficial guides. Fee: none per KPMG.
- **Login, captcha, failures:** unverified.
- **Opportunity:** I did not find a citable 2025 arrivals figure. Unverified.

### Brunei: E-Arrival Card
- **Official site:** https://www.imm.gov.bn/ lists "E-Arrival Cards" under E-Services, linking to a portal path /ords/r/dl_portal/public_portal/dashboard, with Login and Register links. Whether the card needs an account is unverified.
- **Requirement:** The Australian government advice and the US Embassy advise registering/submitting online before arrival [per search snippets: smartraveller.gov.au Brunei page and https://bn.usembassy.gov/brunei-entry-exit-requirements/ (403 on fetch)]. Transit passengers who skip immigration are exempt.
- **Window:** Wego (unofficial) says within 72 hours; Australian advice only says "before arriving". Unverified.
- **Fee:** Free per Trip.com and Wise (unofficial). Each traveller needs their own card.
- **Fields, captcha, failures:** unverified.
- **Opportunity:** No citable 2025 arrivals figure found. Unverified.

### Myanmar
- No official online arrival card found. Search results are visa agencies and form-filler sites (pdfFiller, arrivalcards.com, Trip.com), all unofficial. They describe a paper arrival/departure card and a separate e-Visa. The e-Visa has reportedly been intermittently suspended [unofficial]. Verdict: unverified, treat as no online card. A Myanmar government or embassy source would be needed to change this.

### Timor-Leste
- **ASEAN:** Yes. Admitted as the 11th member on 26 Oct 2025 at the 47th ASEAN Summit in Kuala Lumpur [unofficial news: https://www.ttgasia.com/2025/10/27/timor-leste-joins-asean-as-11th-member/ and others; one outlet says May 2025, which conflicts; the October date matches summit coverage].
- **Arrival card:** No online card found. Government sites found are the customs site (https://customs.gov.tl) and the immigration site (https://migracao.gov.tl): visa on arrival at Dili airport and seaport, US$30 per customs site. Unofficial pages mention a paper arrival form. Verdict: no online card verified.

---

## 4. Things I could not verify

- Fields, captcha and login behaviour of the live forms for Singapore, Korea, China, Cambodia, Vietnam, Japan, Laos and Brunei (sites render only as JavaScript apps to my fetcher, and I was told not to get past checks).
- Exact exemption list for MDAC (Singaporeans, long-term pass holders). The Malaysian foreign-ministry page failed with a certificate error.
- China: the submission window (official pages give none; "72 hours" is from unofficial guides) and whether the form works in English.
- Philippines: whether first-time registration needs an account; whether eTravel is strictly mandatory for foreigners (sources conflict); group registration.
- Korea: whether the K-ETA waiver ends on 1 Jan 2027; the form's fields and captcha; whether the 72-hour submission lapses 72 hours after filing.
- Vietnam: status after May 2026 (expansion beyond Tan Son Nhat); whether it replaces the paper NA1 form; official URL content.
- Laos: current rollout status; the actual LDIF form URL; window.
- Brunei: window; whether the E-Arrival portal requires login; official arrivals figure.
- Cambodia: official launch dates; whether login/OTP/captcha exists.
- Myanmar: whether any online arrival card exists.
- Timor-Leste: whether any online arrival form exists.
- Japan: ISA statement that Visit Japan Web is optional (only unofficial sources).
- Arrivals figures for Laos, Brunei, Myanmar, Timor-Leste, and an official full-year figure for Japan and Malaysia. Singapore, Japan, Malaysia and Vietnam figures come from one aggregator article (Asia Lifestyle Magazine, 5 Oct 2026); Cambodia and Philippines from news; Korea from koreainnumbers.com; China is derived from a visa-free share.
- Common-failure text: apart from Philippines official FAQ items and the ICA error-enquiry advice, I found no quotable error messages for any country. No error text has been invented.
- smartraveller.gov.au advisories for these countries could not be fetched (timeouts), so no Australian government cross-check was possible for Philippines, Cambodia, Vietnam and Laos. Brunei's smartraveller content appears only as a search snippet.

## 5. Clone and scam sites noticed

- Korea: ivisitkorea.com, ketasouthkorea.com and similar rank high for "Korea e-Arrival Card" and look commercial.
- Cambodia: cambodiaarrivalcard.com ("Mandatory for all travelers") is not the .gov.kh site.
- General: NIA (China), ICA (Singapore), BI (Philippines), the Cambodian site and Brunei sources all warn that paid lookalike sites exist. Always verify the host before adding a manifest permission. Official hosts seen in this research: imigresen-online.imi.gov.my, eservices.ica.gov.sg, etravel.gov.ph, e-arrivalcard.go.kr, s.nia.gov.cn, arrival.gov.kh, prearrival.immigration.gov.vn, services.digital.go.jp, imm.gov.bn, immigration.gov.la.
