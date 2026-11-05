# Tender Cells Brand Assets — Corrected v6

## Source of truth
The package now separates the **full lockup** from the **app/icon mark**. App icons are generated only from `tc-mark_CANONICAL_REPO.svg`; the previous v5 workflow rasterized the full 1024×1024 lockup into square icon sizes, which caused crowding/cropping and made the mark appear inconsistent.

- Full lockup source: `Brand/Original/tender-cells-logo_CANONICAL_REPO.svg`
- Mark-only source: `Brand/Original/tc-mark_CANONICAL_REPO.svg`
- Developer icons: `Brand/Developer/`
- Current repository SHA for the mark: `8bf4bd37f26e3931b7d230650c2187f539c582ae`
- Current repository SHA for full SVG: `f4e03890bedecdf8363d6dc3279eac5857e59506`

**Do not use any file prefixed `LEGACY_DO_NOT_USE_`.** These are retained only so a developer can see what was replaced.

If the internally approved corporate logo differs from the repository's current canonical assets, replace the two canonical SVG files first and rerun the icon export; do not hand-edit downstream PNGs.
