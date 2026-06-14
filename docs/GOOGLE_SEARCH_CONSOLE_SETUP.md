# Google Search Console, GA4, and GTM Setup Guide

## Current Production Tracking

- GA4 measurement ID: `G-KSY2D1YGSL`
- Google Tag Manager container: `GTM-TC4BKSKG`
- AdSense publisher: `ca-pub-3639153716376265`
- Sitemap: `https://tendercells.com/sitemap.xml`
- Robots: `https://tendercells.com/robots.txt`
- LLM discovery file: `https://tendercells.com/llms.txt`

## Google Search Console

1. Open https://search.google.com/search-console.
2. Add `https://tendercells.com` as a URL-prefix property.
3. Use the Google Tag Manager verification method if the Google account has access to `GTM-TC4BKSKG`.
4. If GTM verification is not available, use either fallback:
   - HTML file: place Google's verification file in `applications/tendercells_ui/test_output/website/public/`.
   - HTML meta tag: add Google's `google-site-verification` meta tag to `applications/tendercells_ui/test_output/website/index.html`.
5. Submit `https://tendercells.com/sitemap.xml` under Sitemaps.
6. Inspect and request indexing for:
   - `https://tendercells.com/education`
   - `https://tendercells.com/developers`
   - `https://tendercells.com/open-source`
   - `https://tendercells.com/tender-cells-overview`
   - `https://tendercells.com/shop/chicken-tender`
   - `https://tendercells.com/shop/watchtower`
   - `https://tendercells.com/shop/roaming-roost`
   - `https://tendercells.com/app/demo`

## GA4 Event Coverage

The marketing site sends events through both `gtag` and `dataLayer`, so GA4 and GTM can use the same event names.

Tracked events:

- `page_view`
- `internal_link_click`
- `click` for outbound links
- `resource_click` for GitHub, docs, downloads, and external resources
- `button_click`
- `cta_click`
- `view_item`
- `read_depth` at 25%, 50%, 75%, and 90%
- `form_submit`
- `search`
- `file_download`

## Recommended GTM Triggers

- Page View: all pages
- Custom Event: `read_depth`
- Custom Event: `internal_link_click`
- Custom Event: `resource_click`
- Custom Event: `cta_click`
- Custom Event: `view_item`
- Click URL contains `github.com/WeCr8/TenderCells`
- Page Path equals `/education`
- Page Path equals `/developers`
- Page Path equals `/app/demo`

## Recommended GA4 Conversions

Mark these as key events in GA4:

- `cta_click` where `cta_label` is `try-live-demo`
- `resource_click` where `resource_type` is `github`
- `internal_link_click` where `destination` is `/education`
- `internal_link_click` where `destination` is `/developers`
- `view_item` for `chicken-tender`, `watchtower`, and `roaming-roost`

## Search Monitoring

Track these in Search Console:

- 4-H STEM projects
- 4-H engineering projects
- FFA technology projects
- smart chicken coop
- automated chicken coop
- open-source agriculture
- agricultural robotics
- animal-care automation
- homestead automation
- STEM animal science projects

## Deployment Check

After any SEO or tracking change:

```bash
cd applications/tendercells_ui/test_output/website
npm.cmd run build:with-app
npx.cmd firebase deploy --only hosting:main
```

Then verify:

```bash
curl.exe -I https://tendercells.com/robots.txt
curl.exe -I https://tendercells.com/sitemap.xml
curl.exe -I https://tendercells.com/llms.txt
curl.exe -I https://tendercells.com/education
curl.exe -I https://tendercells.com/shop/roaming-roost
```
