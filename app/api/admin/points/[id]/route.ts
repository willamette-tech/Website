import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Deleting a check-in award does not un-check-in the member: the
    // registration stays as the record of who actually attended, and a later
    // re-check-in would re-grant the points. The admin UI says so.
    await prisma.pointAward.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 })
    }

    console.error("Delete award error:", error)
    return NextResponse.json(
      { error: "An error occurred while removing the award" },
      { status: 500 }
    )
  }
}
