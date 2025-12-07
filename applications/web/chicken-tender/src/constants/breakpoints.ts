/**
 * Responsive breakpoints for Chicken Tender application
 * Matches unified_ui.py specifications
 * 
 * Breakpoint definitions:
 * xs: 0      // mobile
 * sm: 600    // small tablets
 * md: 900    // large tablets / small laptops
 * lg: 1200   // desktop
 * xl: 1600   // big desktop
 */

export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1600,
} as const;

/**
 * Viewport dimensions for testing
 */
export const VIEWPORTS = {
  // Desktop
  desktopXL: { width: 1600, height: 900 },
  desktopL: { width: 1440, height: 900 },
  desktopM: { width: 1280, height: 720 },
  // Tablet
  tabletL: { width: 1024, height: 768 }, // landscape
  tabletP: { width: 834, height: 1112 }, // portrait
  // Mobile
  mobileTall: { width: 390, height: 844 }, // iPhone 14/15 style
  mobileCommon: { width: 360, height: 800 }, // Many Android devices
} as const;

/**
 * Layout dimensions for each breakpoint
 * These match the exact specifications from unified_ui.py
 */
export const LAYOUT_DIMENSIONS = {
  // Desktop XL (1600px)
  desktopXL: {
    leftNav: 260,
    rightPanel: 360,
    gap: 24,
    viewportHeight: 640,
  },
  // Desktop L (1440px)
  desktopL: {
    leftNav: 240,
    rightPanel: 320,
    gap: 24,
    viewportHeight: 620,
  },
  // Desktop M (1280px)
  desktopM: {
    leftNav: 220,
    rightPanel: 300,
    gap: 16,
    viewportHeight: 600,
  },
  // Tablet Landscape (1024px)
  tabletL: {
    leftNav: 200,
    rightPanel: 280,
    gap: 16,
    viewportHeight: 480,
  },
  // Tablet Portrait (834px) - 2-row layout
  tabletP: {
    viewportHeight: 520,
    viewportAspectRatio: 16 / 10,
  },
  // Mobile
  mobile: {
    contentPadding: 16,
    viewportMinHeight: 220,
    viewportAspectRatio: 16 / 10,
    telemetryTileHeight: 80,
    bottomToolbarHeight: 60,
  },
} as const;

/**
 * Calculate main viewport width for a given screen width
 */
export function calculateViewportWidth(screenWidth: number): number {
  if (screenWidth >= BREAKPOINTS.xl) {
    const dims = LAYOUT_DIMENSIONS.desktopXL;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  } else if (screenWidth >= BREAKPOINTS.lg) {
    const dims = LAYOUT_DIMENSIONS.desktopL;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  } else if (screenWidth >= BREAKPOINTS.md) {
    const dims = LAYOUT_DIMENSIONS.desktopM;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  } else if (screenWidth >= BREAKPOINTS.sm) {
    const dims = LAYOUT_DIMENSIONS.tabletL;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  }
  // Mobile: full width minus padding
  return screenWidth - (LAYOUT_DIMENSIONS.mobile.contentPadding * 2);
}

