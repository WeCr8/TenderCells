# Google Search Console & Analytics Setup Guide

## Step 1: Google Search Console (GSC) Setup

### Prerequisites
- tendercells.com domain registered and DNS configured
- Admin access to Google Cloud Console

### Setup Steps

1. **Visit Google Search Console**
   - Go to https://search.google.com/search-console
   - Sign in with your WeCr8 Google account

2. **Add Property**
   - Click "Add property"
   - Enter `https://tendercells.com`
   - Select "URL prefix" method

3. **Verify Ownership**
   - Google will offer 5 verification methods
   - **Recommended: HTML file method** (easiest for Vite)
     - Download the verification file (e.g., `google1a2b3c4d5e6f7g.html`)
     - Place in `applications/tendercells_ui/test_output/website/public/`
     - Verify in GSC interface

4. **Update Meta Tag** (alternative/additional)
   - Copy the verification meta tag from GSC
   - Replace `TODO_ADD_GSC_TOKEN` in `index.html` with the actual token
   - Current line:
     ```html
     <meta name="google-site-verification" content="TODO_ADD_GSC_TOKEN" />
     ```

5. **Submit Sitemap**
   - In GSC, go to Sitemaps section
   - Add sitemap URL: `https://tendercells.com/sitemap.xml`
   - Wait 24-48 hours for initial crawl

6. **Monitor Performance**
   - Check "Performance" tab for search queries
   - Monitor crawl errors in "Coverage" tab
   - Track mobile usability

---

## Step 2: Google Analytics 4 (GA4) Setup

### Prerequisites
- Google Analytics account (or create at analytics.google.com)
- Admin access to GA account

### Setup Steps

1. **Create GA4 Property**
   - Visit https://analytics.google.com
   - Click "Create" → "Property"
   - Property name: "Tender Cells Website"
   - Reporting timezone: UTC
   - Currency: USD

2. **Create Data Stream**
   - After property creation, click "Create data stream"
   - Platform: **Web**
   - Website URL: `https://tendercells.com`
   - Stream name: "Main Website"
   - Click "Create stream"

3. **Copy Measurement ID**
   - GA4 will generate a measurement ID like `G-XXXXXXXXXX`
   - Copy this ID

4. **Update index.html**
   - In `applications/tendercells_ui/test_output/website/index.html`
   - Replace both instances of `G-XXXXXXXXXX` with your actual GA4 ID
   - Current lines:
     ```html
     <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
     ...
     gtag('config', 'G-XXXXXXXXXX', {
     ```

5. **Deploy and Test**
   - After deployment, wait 24-48 hours
   - Go to GA4 → Realtime to verify tracking is working
   - Visit tendercells.com and confirm pageviews appear in Realtime

6. **Set Up Events**
   - Events are auto-tracked: page_view, button_click, anchor_click
   - View custom events in GA4 → Events section

---

## Step 3: Configure Analytics in index.html

Current GA4 setup in `index.html`:
- Tracks page views automatically
- Passes page_path for each navigation

Current events tracked via `src/utils/analytics.ts`:
- `page_view` - when user lands on a page
- `button_click` - when user clicks "Get Started"
- `anchor_click` - when user clicks navigation links

---

## Step 4: Deploy

Once GSC and GA4 are configured:

```bash
cd applications/tendercells_ui/test_output/website
npm run build
npm run deploy  # or git push (if CI/CD is set up)
```

---

## Monitoring Checklist

- [ ] GSC meta tag verified
- [ ] Sitemap submitted in GSC
- [ ] GA4 measurement ID active
- [ ] Realtime events showing in GA4
- [ ] Search impressions appearing in GSC (after 24-48 hours)
- [ ] Mobile usability report clean in GSC
- [ ] No crawl errors in GSC Coverage tab

---

## Troubleshooting

### GSC shows "Verification pending"
- Ensure HTML verification file is in `public/` folder
- Or use the meta tag method and rebuild site

### GA4 shows no data
- Check that GA4 ID is correct in index.html
- Wait 24-48 hours for data pipeline
- Use Browser DevTools → Network to confirm gtag.js is loading

### Sitemap shows 0 URLs indexed
- Check robots.txt allows crawling
- Verify sitemap.xml is accessible at `https://tendercells.com/sitemap.xml`
- Submit individual URLs in GSC if needed

---

## Next Steps

1. Set up Google Search Console alerts for critical errors
2. Create Google Analytics custom dashboards for tracking KPIs
3. Link GSC to GA4 for search performance insights
4. Configure Google Tag Manager (GTM) for advanced tracking
5. Set up conversion tracking for "Get Started" CTA
