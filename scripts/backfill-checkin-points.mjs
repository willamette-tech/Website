// One-off backfill: grants the attendance award — and the RSVP bonus where it
// was earned — for every event check-in that predates the Member Points
// system, so nobody's history resets when it ships. Idempotent: re-running
// only fills gaps.
//
// Run once after the schema is in place:
//   node scripts/backfill-checkin-points.mjs
//
// Against the live deployment:
//   kubectl exec -n cssa deploy/cssa -- node scripts/backfill-checkin-points.mjs
import "dotenv/config"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))

// Read the award sizes straight out of lib/points-config.ts so a retune there
// can't silently leave the backfill paying out the old amounts.
const pointsSource = readFileSync(join(rootDir, "lib/points-config.ts"), "utf8")

function readConstant(name) {
  const match = pointsSource.match(new RegExp(`${name} = ([\\d_]+)`))
  if (!match) {
    throw new Error(`Could not read ${name} from lib/points-config.ts`)
  }
  return Number(match[1].replaceAll("_", ""))
}

const POINTS_PER_CHECKIN = readConstant("POINTS_PER_CHECKIN")
const POINTS_RSVP_BONUS = readConstant("POINTS_RSVP_BONUS")

const prisma = new PrismaClient()

try {
  const registrations = await prisma.eventRegistration.findMany({
    where: { checkedInAt: { not: null } },
    select: {
      userId: true,
      eventId: true,
      checkedInAt: true,
      rsvpedAt: true,
      event: { select: { title: true, startDate: true } },
    },
  })

  const existing = await prisma.pointAward.findMany({
    where: { source: { in: ["EVENT_CHECKIN", "RSVP_BONUS"] } },
    select: { userId: true, eventId: true, source: true },
  })
  const alreadyAwarded = new Set(
    existing.map((a) => `${a.userId}:${a.eventId}:${a.source}`)
  )

  const rows = []
  for (const registration of registrations) {
    const { userId, eventId, checkedInAt, rsvpedAt, event } = registration

    const candidates = [
      {
        source: "EVENT_CHECKIN",
        points: POINTS_PER_CHECKIN,
        reason: `Checked in to ${event.title}`,
      },
    ]

    // Same rule the live check-in applies: the RSVP has to predate the event.
    if (rsvpedAt && rsvpedAt < event.startDate) {
      candidates.push({
        source: "RSVP_BONUS",
        points: POINTS_RSVP_BONUS,
        reason: `RSVPed ahead of ${event.title}`,
      })
    }

    for (const candidate of candidates) {
      if (alreadyAwarded.has(`${userId}:${eventId}:${candidate.source}`)) {
        continue
      }
      rows.push({
        userId,
        eventId,
        ...candidate,
        // Date the award to the check-in, not to the backfill, so points
        // history reads in the order things actually happened.
        createdAt: checkedInAt,
      })
    }
  }

  const checkIns = rows.filter((r) => r.source === "EVENT_CHECKIN").length
  const bonuses = rows.filter((r) => r.source === "RSVP_BONUS").length
  console.log(
    `${registrations.length} check-ins → ${checkIns} missing attendance awards ` +
      `(${POINTS_PER_CHECKIN} each), ${bonuses} missing RSVP bonuses (${POINTS_RSVP_BONUS} each).`
  )

  let created = 0
  for (let i = 0; i < rows.length; i += 500) {
    const result = await prisma.pointAward.createMany({
      data: rows.slice(i, i + 500),
      skipDuplicates: true,
    })
    created += result.count
  }

  console.log(`Created ${created} awards.`)
} finally {
  await prisma.$disconnect()
}
