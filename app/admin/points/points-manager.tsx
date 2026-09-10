"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { PointSource } from "@prisma/client"
import { theme } from "@/lib/theme"
import { PointSourceBadge } from "@/components/point-source-badge"
import { formatPoints } from "@/lib/format-points"

interface Member {
  id: string
  displayName: string | null
  image: string | null
  isApproved: boolean
  points: number
}

interface Award {
  id: string
  points: number
  reason: string
  source: PointSource
  createdAt: string
  member: { id: string; displayName: string | null; image: string | null }
  event: { id: string; title: string } | null
  awardedBy: { displayName: string | null } | null
}

interface PointsManagerProps {
  members: Member[]
  awards: Award[]
  pointsPerCheckIn: number
  maxPoints: number
  maxReasonLength: number
}

export function PointsManager({
  members,
  awards,
  pointsPerCheckIn,
  maxPoints,
  maxReasonLength,
}: PointsManagerProps) {
  const [userId, setUserId] = useState("")
  const [points, setPoints] = useState(String(pointsPerCheckIn))
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()

  // Anchored to the attendance award so the presets stay meaningful if that
  // value is ever retuned.
  const presets = useMemo(
    () => [0.5, 1, 2.5, 5].map((m) => Math.round(pointsPerCheckIn * m)),
    [pointsPerCheckIn]
  )

  const selectedMember = members.find((m) => m.id === userId)

  const handleAward = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)

    const parsedPoints = Number(points)

    if (!userId) {
      setError("Pick a member to award.")
      return
    }
    if (!Number.isInteger(parsedPoints) || parsedPoints === 0) {
      setError("Enter a whole, non-zero number of points.")
      return
    }
    if (Math.abs(parsedPoints) > maxPoints) {
      setError(`Points must be between -${maxPoints} and ${maxPoints}.`)
      return
    }
    if (!reason.trim()) {
      setError("Enter a reason — it is shown publicly on the member's profile.")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          points: parsedPoints,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to award points.")
        return
      }

      setNotice(
        `${formatPoints(parsedPoints)} points to ${
          selectedMember?.displayName || "member"
        }.`
      )
      setReason("")
      setPoints(String(pointsPerCheckIn))
      router.refresh()
    } catch {
      setError("Failed to award points.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (award: Award) => {
    const name = award.member.displayName || "this member"
    const extra =
      award.source === "EVENT_CHECKIN"
        ? "\n\nThis removes the points only. The check-in itself stays on the event, and checking in again would re-grant them."
        : ""

    if (
      !confirm(
        `Remove ${formatPoints(award.points)} points from ${name}?\n\n"${award.reason}"${extra}`
      )
    ) {
      return
    }

    setError(null)
    setNotice(null)
    setRemovingId(award.id)
    try {
      const response = await fetch(`/api/admin/points/${award.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "Failed to remove the award.")
        return
      }

      setNotice(`Removed ${formatPoints(award.points)} points from ${name}.`)
      router.refresh()
    } catch {
      setError("Failed to remove the award.")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Award form */}
      <div className={`${theme.card.className} p-6 h-fit lg:sticky lg:top-24`}>
        <h2 className={`text-lg ${theme.text.heading} mb-4`}>Award points</h2>

        <form onSubmit={handleAward}>
          <div className="mb-4">
            <label htmlFor="member" className={theme.label.className}>
              Member
            </label>
            <select
              id="member"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={theme.select.className}
            >
              <option value="">Select a member…</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName || "Unnamed member"}
                  {` — ${member.points.toLocaleString()} pts`}
                  {member.isApproved ? "" : " (pending)"}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="points" className={theme.label.className}>
              Points
            </label>
            <input
              id="points"
              type="number"
              step={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={theme.input.className}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPoints(String(preset))}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-theme-hover text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="text-xs text-theme-muted mt-2">
              Use a negative number to correct an over-award without deleting
              history.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="reason" className={theme.label.className}>
              Reason
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={maxReasonLength}
              placeholder="Won the CTF competition"
              className={theme.input.className}
            />
            <p className="text-xs text-theme-muted mt-1.5">
              Shown publicly on the member&apos;s profile ·{" "}
              {maxReasonLength - reason.length} characters left
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {notice && (
            <p className="mb-4 text-sm text-green-600 dark:text-green-400">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`${theme.button.primary} w-full`}
          >
            {submitting ? "Awarding…" : "Award points"}
          </button>
        </form>
      </div>

      {/* Recent awards */}
      <div className={`${theme.card.className} lg:col-span-2 overflow-hidden`}>
        <div className="px-6 py-4 border-b border-theme-border">
          <h2 className={`text-lg ${theme.text.heading}`}>Recent awards</h2>
          <p className="text-xs text-theme-muted mt-1">
            Every award ever granted, newest first. Removing one changes the
            member&apos;s total.
          </p>
        </div>

        {awards.length === 0 ? (
          <div className="px-6 py-12 text-center text-theme-muted">
            No points awarded yet.
          </div>
        ) : (
          <ul className="divide-y divide-theme-border">
            {awards.map((award) => (
              <li
                key={award.id}
                className="px-6 py-4 flex items-start gap-4 hover:bg-theme-hover/30"
              >
                <Link
                  href={`/members/${award.member.id}`}
                  className="shrink-0"
                  aria-label={award.member.displayName || "Member"}
                >
                  {award.member.image ? (
                    <img
                      src={award.member.image}
                      alt=""
                      className="w-9 h-9 rounded-full border border-theme-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-sm">
                      {(award.member.displayName || "M")[0].toUpperCase()}
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/members/${award.member.id}`}
                      className="text-sm font-medium text-theme-primary hover:text-accent transition-colors"
                    >
                      {award.member.displayName || "Unnamed member"}
                    </Link>
                    <PointSourceBadge source={award.source} />
                    <span className="text-xs text-theme-muted">
                      {new Date(award.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-theme-secondary break-words">
                    {award.reason}
                  </p>
                  {award.awardedBy?.displayName && (
                    <p className="mt-0.5 text-xs text-theme-muted">
                      by {award.awardedBy.displayName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      award.points > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPoints(award.points)}
                  </span>
                  <button
                    onClick={() => handleRemove(award)}
                    disabled={removingId === award.id}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    {removingId === award.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
