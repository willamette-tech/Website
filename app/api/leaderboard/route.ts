import { NextRequest, NextResponse } from "next/server"
import { getPointsLeaderboard } from "@/lib/points"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const leaderboard = await getPointsLeaderboard(
      Number.isFinite(limit) && limit > 0 ? limit : 50
    )

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error("Get leaderboard error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
