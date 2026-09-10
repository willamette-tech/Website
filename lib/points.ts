import { Prisma, PointSource } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { POINTS_PER_CHECKIN, POINTS_RSVP_BONUS } from "@/lib/points-config"

export {
  POINTS_PER_CHECKIN,
  POINTS_RSVP_BONUS,
  MAX_AWARD_POINTS,
  MAX_REASON_LENGTH,
} from "@/lib/points-config"

export interface RankedMember {
  rank: number
  id: string
  displayName: string | null
  image: string | null
  points: number
  checkInCount: number
}

export interface MemberAward {
  id: string
  points: number
  reason: string
  source: PointSource
  createdAt: Date
  event: { id: string; title: string } | null
  awardedBy: { id: string; displayName: string | null; name: string | null } | null
}

export interface MemberPointsSummary {
  total: number
  /** Competition rank (ties share a rank); null if the member has no awards. */
  rank: number | null
  awards: MemberAward[]
}

/**
 * Per-member point totals, highest first.
 *
 * Grouping the ledger rows keeps the sort key and the displayed total the same
 * number — a denormalized counter on `User` could drift from the awards that
 * explain it. Ties are broken by `userId` only so paging is stable; they still
 * share a rank.
 */
async function getMemberTotals(limit?: number) {
  return prisma.pointAward.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: [{ _sum: { points: "desc" } }, { userId: "asc" }],
    ...(limit === undefined ? {} : { take: limit }),
  })
}

/** Assigns competition ranks (equal totals share a rank, the next one skips). */
function withRanks<T extends { points: number }>(
  rows: T[]
): (T & { rank: number })[] {
  let rank = 0
  let previousPoints: number | null = null

  return rows.map((row, index) => {
    if (previousPoints === null || row.points !== previousPoints) {
      rank = index + 1
      previousPoints = row.points
    }
    return { ...row, rank }
  })
}

/**
 * Members ranked by total points, highest first. Members with no awards are
 * omitted — there is nothing to explain about a zero.
 */
export async function getPointsLeaderboard(
  limit: number | undefined = 50
): Promise<RankedMember[]> {
  const totals = await getMemberTotals(limit)
  if (totals.length === 0) return []

  const userIds = totals.map((t) => t.userId)

  const [users, checkIns] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, name: true, image: true },
    }),
    prisma.eventRegistration.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, checkedInAt: { not: null } },
      _count: { userId: true },
    }),
  ])

  const usersById = new Map(users.map((u) => [u.id, u]))
  const checkInsById = new Map(
    checkIns.map((c) => [c.userId, c._count.userId])
  )

  const rows = totals.flatMap((total) => {
    const user = usersById.get(total.userId)
    if (!user) return []
    return [
      {
        id: user.id,
        displayName: user.displayName || user.name,
        image: user.image,
        points: total._sum.points ?? 0,
        checkInCount: checkInsById.get(user.id) ?? 0,
      },
    ]
  })

  return withRanks(rows)
}

/** Current point total for every member who has any awards, keyed by user id. */
export async function getPointTotalsByUser(): Promise<Map<string, number>> {
  const totals = await getMemberTotals()
  return new Map(totals.map((t) => [t.userId, t._sum.points ?? 0]))
}

/**
 * One member's total, rank, and full award history (newest first).
 *
 * The rank comes from grouping every member's totals rather than a narrower
 * query: at club scale that is one row per member who has ever been awarded
 * points, and it keeps the rank identical to the one the leaderboard shows.
 */
export async function getMemberPointsSummary(
  userId: string
): Promise<MemberPointsSummary> {
  const [totals, awards] = await Promise.all([
    getMemberTotals(),
    prisma.pointAward.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        points: true,
        reason: true,
        source: true,
        createdAt: true,
        event: { select: { id: true, title: true } },
        awardedBy: { select: { id: true, displayName: true, name: true } },
      },
    }),
  ])

  const ranked = withRanks(
    totals.map((t) => ({ id: t.userId, points: t._sum.points ?? 0 }))
  )
  const own = ranked.find((r) => r.id === userId)

  return {
    total: own?.points ?? 0,
    rank: own?.rank ?? null,
    awards,
  }
}

export interface GrantedAward {
  points: number
  source: PointSource
  reason: string
}

/**
 * The awards a check-in earns: attendance always, plus the RSVP bonus if the
 * member RSVPed before the event started.
 *
 * Reasons are denormalized so an award still reads correctly if the event is
 * later deleted (`eventId` becomes null).
 */
export function eventAwardsFor({
  event,
  rsvpedAt,
}: {
  event: { title: string; startDate: Date }
  rsvpedAt: Date | null
}): GrantedAward[] {
  const awards: GrantedAward[] = [
    {
      points: POINTS_PER_CHECKIN,
      source: PointSource.EVENT_CHECKIN,
      reason: `Checked in to ${event.title}`,
    },
  ]

  // "Ahead of time" means before the event began — an RSVP tapped at the door
  // tells us nothing we could have planned around.
  if (rsvpedAt && rsvpedAt < event.startDate) {
    awards.push({
      points: POINTS_RSVP_BONUS,
      source: PointSource.RSVP_BONUS,
      reason: `RSVPed ahead of ${event.title}`,
    })
  }

  return awards
}

/**
 * Grants a check-in's awards inside the caller's transaction and returns the
 * ones that were newly created, so the caller can tell the member what they
 * just earned.
 *
 * The `[userId, source, eventId]` unique constraint makes this idempotent:
 * re-checking in to the same event never pays twice.
 */
export async function grantEventPoints(
  tx: Prisma.TransactionClient,
  { userId, eventId, event, rsvpedAt }: {
    userId: string
    eventId: string
    event: { title: string; startDate: Date }
    rsvpedAt: Date | null
  }
): Promise<GrantedAward[]> {
  const candidates = eventAwardsFor({ event, rsvpedAt })

  const existing = await tx.pointAward.findMany({
    where: {
      userId,
      eventId,
      source: { in: candidates.map((c) => c.source) },
    },
    select: { source: true },
  })
  const alreadyGranted = new Set(existing.map((e) => e.source))
  const toGrant = candidates.filter((c) => !alreadyGranted.has(c.source))

  if (toGrant.length === 0) return []

  // `skipDuplicates` is the backstop: if two check-in requests race, the unique
  // constraint still admits only one row per source.
  await tx.pointAward.createMany({
    data: toGrant.map((award) => ({ userId, eventId, ...award })),
    skipDuplicates: true,
  })

  return toGrant
}
