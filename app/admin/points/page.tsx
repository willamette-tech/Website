import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { theme } from "@/lib/theme"
import {
  getPointTotalsByUser,
  MAX_AWARD_POINTS,
  MAX_REASON_LENGTH,
  POINTS_PER_CHECKIN,
  POINTS_RSVP_BONUS,
} from "@/lib/points"
import { PointsManager } from "./points-manager"

/** How many of the most recent awards the admin screen lists. */
const RECENT_AWARD_LIMIT = 100

export default async function AdminPointsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/")
  }

  const [members, awards, totals] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        isApproved: true,
      },
      orderBy: [{ displayName: "asc" }, { name: "asc" }],
    }),
    prisma.pointAward.findMany({
      take: RECENT_AWARD_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        points: true,
        reason: true,
        source: true,
        createdAt: true,
        user: { select: { id: true, name: true, displayName: true, image: true } },
        event: { select: { id: true, title: true } },
        awardedBy: { select: { id: true, name: true, displayName: true } },
      },
    }),
    getPointTotalsByUser(),
  ])

  return (
    <div className="min-h-screen bg-theme-bg py-12">
      <div className={theme.container}>
        <div className="mb-8">
          <h1 className={`text-3xl ${theme.text.heading}`}>Member Points</h1>
          <p className="text-theme-muted mt-2">
            Award points for competitions, contributions, and anything else worth
            recognizing. Checking in grants {POINTS_PER_CHECKIN} points
            automatically, plus {POINTS_RSVP_BONUS} more if the member RSVPed
            before the event started.
          </p>
        </div>

        <PointsManager
          members={members.map((m) => ({
            id: m.id,
            displayName: m.displayName || m.name,
            image: m.image,
            isApproved: m.isApproved,
            points: totals.get(m.id) ?? 0,
          }))}
          awards={awards.map((a) => ({
            id: a.id,
            points: a.points,
            reason: a.reason,
            source: a.source,
            createdAt: a.createdAt.toISOString(),
            member: {
              id: a.user.id,
              displayName: a.user.displayName || a.user.name,
              image: a.user.image,
            },
            event: a.event,
            awardedBy: a.awardedBy
              ? {
                  displayName: a.awardedBy.displayName || a.awardedBy.name,
                }
              : null,
          }))}
          pointsPerCheckIn={POINTS_PER_CHECKIN}
          maxPoints={MAX_AWARD_POINTS}
          maxReasonLength={MAX_REASON_LENGTH}
        />
      </div>
    </div>
  )
}
