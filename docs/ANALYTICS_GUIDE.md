# Analytics & Tags — Plain-English Guide

For a brand-new website/company/community. No prior analytics experience assumed.
This explains what is already wired up, what to click to see results, and the few
rules we follow because our audience includes kids, 4-H, FFA, classrooms, and
homeschoolers.

---

## The 60-second mental model

You have three things working together:

| Thing | What it is | Where it lives |
|---|---|---|
| **GA4** (Google Analytics 4) | The report system. Answers "how many people, which pages, where from." | Property ID `G-KSY2D1YGSL` |
| **GTM** (Google Tag Manager) | A "remote control" for adding/changing tags without code edits. | Container `GTM-TC4BKSKG` |
| **Events** | Named things people do (`page_view`, `view_item`, `cta_click`). Our code sends these. | `src/utils/analytics.ts` |

Big companies aren't doing anything magic — they just (1) send clean events, (2) read
the standard reports, and (3) respect consent. We already do all three.

---

## What is already tracked (no extra work needed)

Our code in `website/src/utils/analytics.ts` already sends these events:

- `page_view` — every page someone opens. → **Most-viewed pages.**
- `view_item` — fires when a product page (Chicken Tender, WatchTower, …) loads. → **Most-viewed products.**
- `product_interest` — clicks on product cards and CTAs. → which products people *act* on.
- `cta_click`, `button_click`, `form_submit`, `waitlist_signup`, `search`, `read_depth`,
  `file_download`, `outbound`/`internal_link_click` — general interaction tracking.

The app (`tendercells-ui`) sends `page_view` per screen and ties events to the signed-in
user's Firebase ID — but **only when a real deployment turns analytics on**. In the public
sim-only demo, app analytics is silent (nothing leaves the browser).

---

## The 4 reports you asked for — where to click in GA4

Go to [analytics.google.com](https://analytics.google.com) → pick the TenderCells property.

1. **Most-viewed products**
   Reports → Engagement → **Pages and screens**, then filter the page path to `/shop/`.
   Or build a free-form Exploration on the `view_item` event grouped by `item_name`.

2. **Most-viewed pages**
   Reports → Engagement → **Pages and screens**. Sort by Views. That's your top content.

3. **Audience source** (where visitors come from)
   Reports → Acquisition → **Traffic acquisition**. Shows Search / Social / Direct / Referral.
   (Our 4-H, FFA, homeschool sections show up as the *pages* people land on.)

4. **Demo funnel**
   Reports → Engagement → Pages and screens → look at `/demo` and `/app/demo` views.
   For a true step-by-step funnel, build Explore → **Funnel exploration** using
   `page_view` (on `/demo`) → app demo screen views.

> New data takes ~24-48h to fully appear in standard reports. Use **Realtime** (left menu)
> to confirm tracking works *right now* while you test.

---

## The one rule we follow: NO age/gender demographics

Our audience includes children. By decision (and by law):

- **We do NOT collect age or gender.** Google's age/gender data comes from "Google Signals,"
  which is **prohibited on content directed to children** and would risk getting the GA
  property suspended.
- The site config explicitly turns Signals **off** (`allow_google_signals: false` in
  `index.html`). Do not flip the "Google Signals" toggle on in GA4 Admin.
- We track **behavior** (what pages/products people view) — never **who** they are.

This is the "proper" way for a kids-first brand: rich behavior insight, zero personal data.

---

## Consent (already built)

A cookie banner sets consent. Until a visitor accepts, analytics storage is denied
(Google "Consent Mode"). On accept, we also give the visitor a **random, anonymous id**
(a UUID — not a name or email) so GA4 can tell repeat visits apart. On withdraw, that id
is deleted. See `src/utils/consent.ts` and `src/utils/analytics.ts`.

---

## A simple first-week checklist

- [ ] Open GA4 **Realtime**, visit the site yourself, confirm your visit shows up.
- [ ] Click a product page, confirm a `view_item` event appears in Realtime.
- [ ] After 1-2 days, check **Pages and screens** for your top pages/products.
- [ ] Check **Traffic acquisition** to see where early visitors come from.
- [ ] Leave Google Signals **OFF**. Do not add age/gender.

---

## When you're ready to grow (later, optional)

- **GTM** lets you add things like scroll tracking or a new button event *without* a code
  deploy — edit the tag in tagmanager.google.com, hit Publish.
- **Custom events**: to track something new, call `trackEvent('your_event', { ...details })`
  from `analytics.ts`. Keep names lowercase_with_underscores.
- **Search Console** (already verified) shows what Google *searches* bring people in —
  pair it with GA4 for the full picture.

*You don't need to do everything at once. Sending clean events + reading the standard
reports already puts you on par with how most companies actually use analytics.*
