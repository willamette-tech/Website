import { NextRequest, NextResponse } from "next/server"
import { PointSource } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MAX_AWARD_POINTS, MAX_REASON_LENGTH } from "@/lib/points"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, points, reason } = await request.json()

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "A member is required" }, { status: 400 })
    }

    if (typeof points !== "number" || !Number.isInteger(points)) {
      return NextResponse.json(
        { error: "Points must be a whole number" },
        { status: 400 }
      )
    }

    // Negative awards are allowed as ledger corrections, but a zero-point award
    // records nothing and only clutters the member's history.
    if (points === 0) {
      return NextResponse.json(
        { error: "Points must not be zero" },
        { status: 400 }
      )
    }

    if (Math.abs(points) > MAX_AWARD_POINTS) {
      return NextResponse.json(
        { error: `Points must be between -${MAX_AWARD_POINTS} and ${MAX_AWARD_POINTS}` },
        { status: 400 }
      )
    }

    const trimmedReason = typeof reason === "string" ? reason.trim() : ""

    // The reason is shown publicly next to the award; a discretionary award with
    // no explanation is exactly the kind that gets questioned.
    if (!trimmedReason) {
      return NextResponse.json({ error: "A reason is required" }, { status: 400 })
    }

    if (trimmedReason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Reason must be ${MAX_REASON_LENGTH} characters or fewer` },
        { status: 400 }
      )
    }

    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!recipient) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const award = await prisma.pointAward.create({
      data: {
        userId,
        points,
        reason: trimmedReason,
        source: PointSource.MANUAL,
        awardedById: session.user.id,
      },
      select: {
        id: true,
        points: true,
        reason: true,
        source: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ award })
  } catch (error) {
    console.error("Award points error:", error)
    return NextResponse.json(
      { error: "An error occurred while awarding points" },
      { status: 500 }
    )
  }
}
