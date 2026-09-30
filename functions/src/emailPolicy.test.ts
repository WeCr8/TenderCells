import { SIGNUP_LIMITS, mayEmailConfirmation } from "./emailPolicy";

describe("newsletter confirmation throttle", () => {
  const now = 10 * SIGNUP_LIMITS.perAddressMs;

  it("sends to a new address", () => {
    expect(mayEmailConfirmation(now, 0, 0)).toBe(true);
  });

  it("sends at most one confirmation per address per day", () => {
    expect(mayEmailConfirmation(now, now - 1000, 0)).toBe(false);
    expect(mayEmailConfirmation(now, now - SIGNUP_LIMITS.perAddressMs, 0)).toBe(true);
  });

  it("stops everything once the hourly cap is reached", () => {
    expect(mayEmailConfirmation(now, 0, SIGNUP_LIMITS.perHour - 1)).toBe(true);
    expect(mayEmailConfirmation(now, 0, SIGNUP_LIMITS.perHour)).toBe(false);
  });
});
