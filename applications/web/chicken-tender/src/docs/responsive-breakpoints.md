# Responsive Breakpoints & Layout Guide

This document describes the responsive breakpoints and exact layout dimensions used in the Chicken Tender application, matching the unified_ui.py specifications.

## Breakpoint Definitions

The application uses Tailwind CSS breakpoints with the following values (matching unified_ui.py):

- **xs**: 0px (mobile)
- **sm**: 600px (small tablets)
- **md**: 900px (large tablets / small laptops)
- **lg**: 1200px (desktop)
- **xl**: 1600px (big desktop)

## Viewport Testing Targets

### Desktop / Laptop (Web)

| Name | Viewport (px) | Notes |
|------|---------------|-------|
| Desktop XL | 1600 × 900 | Big monitors, main design reference |
| Desktop L | 1440 × 900 | Common MacBook / 15" laptops |
| Desktop M | 1280 × 720 | Lower-res / smaller laptops |

### Tablet (Web & App)

| Name | Viewport (px) | Notes |
|------|---------------|-------|
| Tablet L | 1024 × 768 | iPad standard (landscape) |
| Tablet P | 834 × 1112 | Newer iPads / Android tablets (portrait) |

### Mobile (Web & Native App)

| Name | Viewport (px) | Example |
|------|---------------|---------|
| Mobile Tall | 390 × 844 | iPhone 14/15 style |
| Mobile Common | 360 × 800 | Many Android devices |

## Layout Dimensions

### Desktop XL (1600px)

- Left nav: **260px**
- Right panel: **360px**
- Gap between columns: **24px** each side
- Main viewport width: **932px** (1600 - 260 - 360 - 48)
- Viewport height: **~640px**

### Desktop L (1440px)

- Left nav: **240px**
- Right panel: **320px**
- Gap: **24px**
- Main viewport width: **832px** (1440 - 240 - 320 - 48)
- Viewport height: **~620px**

### Desktop M (1280px)

- Left nav: **220px**
- Right panel: **300px**
- Gap: **16px**
- Main viewport width: **728px** (1280 - 220 - 300 - 32)
- Viewport height: **~600px**

### Tablet Landscape (1024px)

- Left nav: **200px**
- Right panel: **280px**
- Gap: **16px**
- Main viewport width: **512px** (1024 - 200 - 280 - 32)
- Viewport height: **~480px**

### Tablet Portrait (834px)

Switches to **2-row layout**:

- Row 1: Coop viewport full width (aspect-ratio: 16/10, ~834 × 520px)
- Row 2: Tabs for "Telemetry / Network / Hogs" below
- Hamburger nav for left items (drawer slide-out)

### Mobile (390 × 844 / 360 × 800)

**Single column layout**:

- Content padding: **16px**
- Coop viewport: 100% width minus padding, aspect-ratio 16/10 (~220–260px height)
- Telemetry tiles: 2-column grid, height **72–88px**
- Bottom toolbar: **56–64px**

## Implementation in Real Application

The real application (`applications/web/chicken-tender`) uses:

1. **Tailwind CSS breakpoints** defined in `tailwind.config.js` matching the specifications
2. **Layout dimensions** defined in `src/constants/breakpoints.ts`
3. **Responsive navigation** in `src/components/navigation/EnhancedNavigation.tsx` with widths:
   - `md:w-[200px]` (900px+)
   - `lg:w-[240px]` (1200px+)
   - `xl:w-[260px]` (1600px+)
4. **Responsive layout padding** in `src/components/layout/Layout.tsx`:
   - Mobile: `px-4` (16px)
   - Tablet/Desktop: `sm:px-6 md:px-8` (24-32px)

## Testing

To test responsive layouts:

1. Use browser DevTools to simulate viewport sizes
2. Test at exact breakpoint values (600px, 900px, 1200px, 1600px)
3. Test orientation changes on tablets
4. Verify touch targets are at least 44×44px on mobile

