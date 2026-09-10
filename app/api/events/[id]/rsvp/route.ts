import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { POINTS_RSVP_BONUS } from "@/lib/points-config"

/**
 * RSVPs close when the event begins: an RSVP that lands after the doors open
 * can't inform anything we'd have planned with it. This is the same instant
 * the bonus window closes, so one predicate drives both.
 *
 * Cancelling is deliberately *not* time-gated — someone who can no longer make
 * it should be able to drop off the headcount at any point (up until they
 * check in, which the DELETE handler still blocks).
 */
function rsvpOpen(startDate: Date) {
  return new Date() < startDate
}

function bonusEarned(rsvpedAt: Date | null | undefined, startDate: Date) {
  return !!rsvpedAt && rsvpedAt < startDate
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, startDate: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const rsvpCount = await prisma.eventRegistration.count({
      where: { eventId: id, rsvpedAt: { not: null } },
    })

    let userRsvp = null
    if (session?.user?.id) {
      userRsvp = await prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: id, userId: session.user.id } },
        select: { rsvpedAt: true, checkedInAt: true },
      })
    }

    return NextResponse.json({
      rsvpCount,
      hasRsvped: !!userRsvp?.rsvpedAt,
      hasCheckedIn: !!userRsvp?.checkedInAt,
      rsvpBonusPoints: POINTS_RSVP_BONUS,
      rsvpOpen: rsvpOpen(event.startDate),
      rsvpBonusEarned: bonusEarned(userRsvp?.rsvpedAt, event.startDate),
    })
  } catch (error) {
    console.error("Get RSVP status error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, startDate: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!rsvpOpen(event.startDate)) {
      return NextResponse.json(
        { error: "RSVPs closed when the event started" },
        { status: 400 }
      )
    }

    const registration = await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
      update: { rsvpedAt: new Date() },
      create: {
        eventId: id,
        userId: session.user.id,
        rsvpedAt: new Date(),
      },
    })

    const rsvpCount = await prisma.eventRegistration.count({
      where: { eventId: id, rsvpedAt: { not: null } },
    })

    return NextResponse.json({
      success: true,
      rsvpCount,
      hasRsvped: true,
      rsvpBonusPoints: POINTS_RSVP_BONUS,
      rsvpOpen: rsvpOpen(event.startDate),
      rsvpBonusEarned: bonusEarned(registration.rsvpedAt, event.startDate),
    })
  } catch (error) {
    console.error("RSVP error:", error)
    return NextResponse.json(
      { error: "An error occurred while processing your RSVP" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, startDate: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    })

    if (registration?.checkedInAt) {
      return NextResponse.json(
        { error: "You can't cancel your RSVP after checking in" },
        { status: 400 }
      )
    }

    if (registration) {
      await prisma.eventRegistration.update({
        where: { eventId_userId: { eventId: id, userId: session.user.id } },
        data: { rsvpedAt: null },
      })
    }

    const rsvpCount = await prisma.eventRegistration.count({
      where: { eventId: id, rsvpedAt: { not: null } },
    })

    return NextResponse.json({
      success: true,
      rsvpCount,
      hasRsvped: false,
      rsvpBonusPoints: POINTS_RSVP_BONUS,
      rsvpOpen: rsvpOpen(event.startDate),
      rsvpBonusEarned: false,
    })
  } catch (error) {
    console.error("Cancel RSVP error:", error)
    return NextResponse.json(
      { error: "An error occurred while canceling your RSVP" },
      { status: 500 }
    )
  }
}
