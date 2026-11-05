# ArrivalFiller

- **Slug:** arrivalfiller
- **What:** Free, open-source Chrome extension that fills official arrival cards (Indonesia, Thailand) from answers a traveller gave once. Everything stays in the browser.
- **Site:** https://arrivalfiller.vercel.app (Vercel project `indoarrival`, static, `site/`)
- **Store item:** emdkbckehgnfnjggcfndccmjahncjkmc
- **Repo:** 99Darius/ArrivalFiller (public)
- **Status:** 1.0.1 published as IndoArrival; 1.1.0 (ArrivalFiller, adds Thailand) built, awaiting store submission.
- **Support:** darius.cheung@gmail.com

## KPIs

Store clicks per guide (`store_click` in GA4), weekly store installs, Search Console clicks by page. Quote counts, never shares.

## Provisioned

GCP project, GA4 property, Tavily allocation. Skipped on purpose: storage, database, payments, email, OAuth, because the product has no server or sign-in.

## Public repo: what stays out

This repo is public, so it is registered with `hq_push: false`, the HQ catalog is not copied into AGENTS.md, and `moat/ledger.csv` and `moat/from-holdco/*-experts.md` are gitignored. They can hold cross-venture or financial detail.
