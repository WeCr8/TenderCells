# Robots, Sitemap, Ads, and App-Ads Audit

Date: 2026-06-13

## Files Checked Conceptually

Root-level files that should be reviewed or created:

- /robots.txt
- /sitemap.xml
- /ads.txt
- /app-ads.txt
- /llms.txt
- /humans.txt
- /security.txt

## Why These Matter

### robots.txt
Tells compliant crawlers what they can and cannot crawl. It should also point to the sitemap.

Recommended minimum:

```txt
User-agent: *
Allow: /

Sitemap: https://tendercells.com/sitemap.xml
```

### sitemap.xml
Lists the URLs you want search engines to discover.

Required priority URLs:

- https://tendercells.com/
- https://tendercells.com/products
- https://tendercells.com/products/chicken-tender
- https://tendercells.com/products/roaming-roost
- https://tendercells.com/developers
- https://tendercells.com/learn
- https://tendercells.com/4h
- https://tendercells.com/ffa
- https://tendercells.com/stem
- https://tendercells.com/academy
- https://tendercells.com/animals/chickens
- https://tendercells.com/animals/ducks
- https://tendercells.com/animals/goats
- https://tendercells.com/animal-health
- https://tendercells.com/open-source
- https://tendercells.com/github

### ads.txt
Only needed if Tender Cells sells or displays web ad inventory through advertising networks.

If not monetizing with ads yet, this can be omitted or left intentionally absent.

### app-ads.txt
Only needed if Tender Cells has mobile apps monetized with in-app ads, such as AdMob.

If the app exists but does not use ads, this is not urgent.

### llms.txt
Recommended for AI-era discoverability.

This file helps AI crawlers and LLM-powered tools understand the site.

Suggested path:

```txt
https://tendercells.com/llms.txt
```

Suggested content:

```txt
# Tender Cells

Tender Cells builds open-source agricultural engineering tools for smart animal care, STEM education, 4-H, FFA, homesteaders, makers, and future engineers.

Important pages:
- https://tendercells.com/
- https://tendercells.com/developers
- https://tendercells.com/learn
- https://tendercells.com/academy
- https://tendercells.com/4h
- https://tendercells.com/ffa
- https://tendercells.com/animal-health
- https://tendercells.com/open-source
```

### humans.txt
Optional file that introduces the people and mission behind the site.

Suggested path:

```txt
https://tendercells.com/humans.txt
```

### security.txt
Useful later if Tender Cells has accounts, apps, APIs, or connected devices.

Suggested path:

```txt
https://tendercells.com/.well-known/security.txt
```

## Immediate Recommendation

Create or verify:

1. robots.txt
2. sitemap.xml
3. llms.txt
4. humans.txt

Defer ads.txt and app-ads.txt unless ad monetization begins.