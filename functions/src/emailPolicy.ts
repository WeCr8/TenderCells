// emailPolicy.ts - pure rules for newsletter email (unit tested in emailPolicy.test.ts).

/** Confirmation emails: at most one per address per day, and a global hourly cap. */
export const SIGNUP_LIMITS = { perAddressMs: 24 * 60 * 60 * 1000, perHour: 200 };

/**
 * Should a confirmation email go out now?
 *
 * @param now - Current time, ms
 * @param lastSentMs - When this address last got a confirmation email (0 = never)
 * @param sentThisHour - Confirmation emails sent in the current hour, all addresses
 */
export function mayEmailConfirmation(now: number, lastSentMs: number, sentThisHour: number): boolean {
  return now - lastSentMs >= SIGNUP_LIMITS.perAddressMs && sentThisHour < SIGNUP_LIMITS.perHour;
}
