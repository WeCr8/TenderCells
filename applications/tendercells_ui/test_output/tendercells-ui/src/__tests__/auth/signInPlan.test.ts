import { describe, expect, it } from 'vitest';
import {
  chooseSignInFlow,
  describeFederatedSignInError,
  describeFunctionsError,
  isIosLike,
  isSafariLike,
  isSameOriginAuth,
  parseHostList,
  resolveAuthDomain,
  shouldFallBackToRedirect,
  type DeviceSignals,
} from '../../../../shared/auth/signInPlan';

const TC = { protocol: 'https:', host: 'tendercells.com', hostname: 'tendercells.com' };
const WEBAPP = { protocol: 'https:', host: 'tender-cells.web.app', hostname: 'tender-cells.web.app' };
const FA = 'tender-cells.firebaseapp.com';

const IPAD_SAFARI: DeviceSignals = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
  platform: 'MacIntel',
  maxTouchPoints: 5,
};
const IPHONE: DeviceSignals = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  platform: 'iPhone',
  maxTouchPoints: 5,
};
const MAC_SAFARI: DeviceSignals = { ...IPAD_SAFARI, maxTouchPoints: 0 };
const DESKTOP_CHROME: DeviceSignals = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  platform: 'Win32',
  maxTouchPoints: 0,
};

describe('parseHostList', () => {
  it('splits, trims, lowercases and strips scheme/path', () => {
    expect(parseHostList(' TenderCells.com, https://www.tendercells.com/ ')).toEqual(['tendercells.com', 'www.tendercells.com']);
    expect(parseHostList(undefined)).toEqual([]);
    expect(parseHostList('')).toEqual([]);
  });
});

describe('resolveAuthDomain', () => {
  it('keeps the configured firebaseapp.com domain until a host is opted in', () => {
    expect(resolveAuthDomain(FA, TC, [])).toBe(FA);
  });
  it('uses the serving custom domain once it is opted in', () => {
    expect(resolveAuthDomain(FA, TC, ['tendercells.com'])).toBe('tendercells.com');
  });
  it('does not touch hosts that are not opted in', () => {
    expect(resolveAuthDomain(FA, WEBAPP, ['tendercells.com'])).toBe(FA);
  });
  it('never opts in a plain-http host (except localhost)', () => {
    expect(resolveAuthDomain(FA, { ...TC, protocol: 'http:' }, ['tendercells.com'])).toBe(FA);
    expect(resolveAuthDomain(FA, { protocol: 'http:', host: 'localhost:5173', hostname: 'localhost' }, ['localhost'])).toBe('localhost:5173');
  });
  it('passes through outside a browser', () => {
    expect(resolveAuthDomain(FA, undefined, ['tendercells.com'])).toBe(FA);
  });
});

describe('isSameOriginAuth', () => {
  it('is true only when authDomain equals the page host', () => {
    expect(isSameOriginAuth('tendercells.com', TC)).toBe(true);
    expect(isSameOriginAuth(FA, TC)).toBe(false);
    expect(isSameOriginAuth(undefined, TC)).toBe(false);
  });
});

describe('device detection', () => {
  it('recognises iPadOS desktop-class Safari as iOS', () => {
    expect(isIosLike(IPAD_SAFARI)).toBe(true);
    expect(isIosLike(IPHONE)).toBe(true);
    expect(isIosLike(MAC_SAFARI)).toBe(false);
    expect(isIosLike(DESKTOP_CHROME)).toBe(false);
  });
  it('recognises Safari but not Chrome', () => {
    expect(isSafariLike(IPAD_SAFARI)).toBe(true);
    expect(isSafariLike(DESKTOP_CHROME)).toBe(false);
  });
});

describe('chooseSignInFlow', () => {
  it('uses the popup everywhere while the helper is cross-origin (redirect cannot finish)', () => {
    expect(chooseSignInFlow(false, IPAD_SAFARI)).toBe('popup');
    expect(chooseSignInFlow(false, { ...IPAD_SAFARI, standalone: true })).toBe('popup');
    expect(chooseSignInFlow(false, DESKTOP_CHROME)).toBe('popup');
  });
  it('prefers redirect on iPad/iPhone and home-screen apps once the helper is same-origin', () => {
    expect(chooseSignInFlow(true, IPAD_SAFARI)).toBe('redirect');
    expect(chooseSignInFlow(true, IPHONE)).toBe('redirect');
    expect(chooseSignInFlow(true, { ...DESKTOP_CHROME, standalone: true })).toBe('redirect');
  });
  it('keeps the popup on desktop browsers', () => {
    expect(chooseSignInFlow(true, DESKTOP_CHROME)).toBe('popup');
    expect(chooseSignInFlow(true, MAC_SAFARI)).toBe('popup');
  });
});

describe('shouldFallBackToRedirect', () => {
  it('never falls back to a redirect that cannot complete (the iPad bug)', () => {
    expect(shouldFallBackToRedirect('auth/popup-blocked', false)).toBe(false);
  });
  it('falls back when the popup is unavailable and the helper is same-origin', () => {
    expect(shouldFallBackToRedirect('auth/popup-blocked', true)).toBe(true);
    expect(shouldFallBackToRedirect('auth/operation-not-supported-in-this-environment', true)).toBe(true);
    expect(shouldFallBackToRedirect('auth/invalid-credential', true)).toBe(false);
  });
});

describe('describeFederatedSignInError', () => {
  it('tells Safari users how to allow the popup instead of failing silently', () => {
    expect(describeFederatedSignInError('auth/popup-blocked', IPAD_SAFARI)).toMatch(/Safari blocked/);
    expect(describeFederatedSignInError('auth/popup-blocked', DESKTOP_CHROME)).toMatch(/browser blocked/);
  });
  it('explains closed popups, blocked storage and unauthorized hosts', () => {
    expect(describeFederatedSignInError('auth/popup-closed-by-user', DESKTOP_CHROME)).toMatch(/closed/);
    expect(describeFederatedSignInError('auth/web-storage-unsupported', IPAD_SAFARI)).toMatch(/private browsing/);
    expect(describeFederatedSignInError('auth/unauthorized-domain', DESKTOP_CHROME)).toMatch(/tendercells\.com\/account/);
  });
  it('returns null for codes other mappers own', () => {
    expect(describeFederatedSignInError('auth/invalid-credential', DESKTOP_CHROME)).toBeNull();
  });
});

describe('describeFunctionsError', () => {
  it('turns a backend INTERNAL into a plain outage message (school sign-in)', () => {
    const err = Object.assign(new Error('INTERNAL'), { code: 'functions/internal' });
    expect(describeFunctionsError(err, 'x')).toMatch(/temporarily unavailable/);
  });
  it('explains an unknown school code', () => {
    expect(describeFunctionsError({ code: 'functions/not-found' }, 'x')).toMatch(/could not find a school/);
  });
  it('keeps meaningful messages and hides a bare INTERNAL', () => {
    expect(describeFunctionsError(new Error('School sign-in is not active'), 'x')).toBe('School sign-in is not active');
    expect(describeFunctionsError(new Error('INTERNAL'), 'fallback')).toBe('fallback');
  });
});
