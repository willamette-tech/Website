// Point values and limits, kept free of server imports so client components
// (the RSVP button, check-in toast) can display the same numbers the server
// awards. `lib/points.ts` re-exports these for server-side callers.

/**
 * Points granted for checking in to an event.
 *
 * Deliberately coarse (100, not 1) so discretionary awards — a competition
 * prize, a workshop write-up — can be scaled against attendance without
 * either one dwarfing the other.
 */
export const POINTS_PER_CHECKIN = 100

/**
 * Bonus for having RSVPed *before the event started*, granted alongside the
 * check-in award. Small on purpose: it is a nudge to help us plan headcount,
 * not a second attendance payout.
 */
export const POINTS_RSVP_BONUS = 10

/** Guard rails for admin-entered awards. */
export const MAX_AWARD_POINTS = 100_000
export const MAX_REASON_LENGTH = 200
