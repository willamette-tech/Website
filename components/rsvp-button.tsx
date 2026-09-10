"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { theme } from "@/lib/theme"
import { loginHref } from "@/lib/login-url"

interface RsvpButtonProps {
  eventId: string
  initialRsvpCount?: number
  initialHasRsvped?: boolean
  initialHasCheckedIn?: boolean
  bonusPoints?: number
  /** Whether the event has yet to start — RSVPs and the bonus both close then. */
  initialRsvpOpen?: boolean
  /** Whether this member's existing RSVP beat the start time. */
  initialBonusEarned?: boolean
}

export function RsvpButton({
  eventId,
  initialRsvpCount = 0,
  initialHasRsvped = false,
  initialHasCheckedIn = false,
  bonusPoints = 0,
  initialRsvpOpen = false,
  initialBonusEarned = false,
}: RsvpButtonProps) {
  const { status } = useSession()
  const [hasRsvped, setHasRsvped] = useState(initialHasRsvped)
  const [hasCheckedIn, setHasCheckedIn] = useState(initialHasCheckedIn)
  const [rsvpCount, setRsvpCount] = useState(initialRsvpCount)
  const [rsvpOpen, setRsvpOpen] = useState(initialRsvpOpen)
  const [bonusEarned, setBonusEarned] = useState(initialBonusEarned)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/events/${eventId}/rsvp`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setHasRsvped(data.hasRsvped)
            setHasCheckedIn(data.hasCheckedIn)
            setRsvpCount(data.rsvpCount)
            setRsvpOpen(data.rsvpOpen)
            setBonusEarned(data.rsvpBonusEarned)
          }
        })
        .catch(console.error)
    }
  }, [eventId, status])

  const handleRsvp = async () => {
    if (status !== "authenticated") {
      window.location.href = loginHref(window.location.pathname)
      return
    }

    // Checking in locks attendance — no un-RSVP after that.
    if (hasCheckedIn) return

    // New RSVPs close at the start time; cancelling stays open.
    if (!hasRsvped && !rsvpOpen) return

    setError("")
    setIsLoading(true)
    try {
      const method = hasRsvped ? "DELETE" : "POST"
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method })
      const data = await res.json()

      if (data.error) {
        // Most likely the event started while this page sat open, so trust the
        // server and re-close the button rather than leaving a dead control.
        setError(data.error)
        if (typeof data.rsvpOpen === "boolean") setRsvpOpen(data.rsvpOpen)
        else setRsvpOpen(false)
        return
      }

      setHasRsvped(data.hasRsvped)
      setRsvpCount(data.rsvpCount)
      setBonusEarned(data.rsvpBonusEarned)
      if (typeof data.rsvpOpen === "boolean") {
        setRsvpOpen(data.rsvpOpen)
      }
    } catch (error) {
      console.error("RSVP error:", error)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // New RSVPs are only possible before the start time, and that is also the
  // bonus deadline — say both, so nobody discovers either from a check-in
  // toast that came up short.
  const rsvpClosed = !rsvpOpen && !hasRsvped && !hasCheckedIn
  const hint = (() => {
    if (status !== "authenticated") return null
    if (bonusEarned) {
      return `+${bonusPoints} RSVP bonus locked in — check in at the event to collect it.`
    }
    if (rsvpOpen) {
      return `RSVP before the event starts to earn a +${bonusPoints} bonus.`
    }
    return "RSVPs closed when the event started."
  })()

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRsvp}
          disabled={isLoading || hasCheckedIn || rsvpClosed}
          title={
            hasCheckedIn
              ? "You can't cancel your RSVP after checking in"
              : rsvpClosed
                ? "RSVPs closed when the event started"
                : undefined
          }
          className={
            hasRsvped || hasCheckedIn
              ? theme.button.secondary
              : theme.button.primary
          }
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : hasRsvped || hasCheckedIn ? (
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : null}
          {hasCheckedIn
            ? "Checked in"
            : hasRsvped
              ? "RSVPed"
              : rsvpClosed
                ? "RSVPs closed"
                : "RSVP"}
        </button>
        <span className="text-sm text-theme-muted">
          {rsvpCount} {rsvpCount === 1 ? "person" : "people"} attending
        </span>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && (
          <p
            className={`mt-2 text-xs ${
              bonusEarned ? "text-accent" : "text-theme-muted"
            }`}
          >
            {hint}
          </p>
        )
      )}
    </div>
  )
}
