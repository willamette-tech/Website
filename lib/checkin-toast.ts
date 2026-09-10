// Toast copy for a completed check-in. Pure and server-free so it can be unit
// checked and used from the client component that raises the toast.

export interface CheckinResponse {
  pointsAwarded?: number
  awards?: { points: number; source: string }[]
}

export interface CheckinToast {
  title: string
  description: string
  variant: "success"
}

/**
 * Describes what a check-in just earned.
 *
 * A repeat check-in awards nothing, so it gets an acknowledgement rather than
 * a phantom "+0 points". The RSVP bonus is called out separately when it was
 * earned — it is the only part of the payout the member had to do something
 * ahead of time for.
 */
export function checkinToast(
  data: CheckinResponse,
  eventTitle?: string
): CheckinToast {
  const points = data.pointsAwarded ?? 0
  const where = eventTitle ? `to ${eventTitle}` : "to this event"

  if (points <= 0) {
    return {
      title: "You're checked in!",
      description: `You were already checked in ${where}.`,
      variant: "success",
    }
  }

  const rsvpBonus = data.awards?.find((award) => award.source === "RSVP_BONUS")

  return {
    title: `+${points.toLocaleString()} points`,
    description: rsvpBonus
      ? `Checked in ${where}, including a +${rsvpBonus.points} bonus for RSVPing ahead.`
      : `Checked in ${where}.`,
    variant: "success",
  }
}
