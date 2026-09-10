import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  validateAnswers,
  type QuestionForValidation,
  type ValidatedAnswer,
} from "@/lib/forms"
import { grantEventPoints, type GrantedAward } from "@/lib/points"

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
    const { code, answers } = await request.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        checkInCode: true,
        title: true,
        startDate: true,
        checkInFormId: true,
        checkInFormRequired: true,
        checkInForm: {
          select: {
            id: true,
            questions: { orderBy: { order: "asc" } },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.checkInCode) {
      return NextResponse.json(
        { error: "Check-in is not enabled for this event" },
        { status: 400 }
      )
    }

    if (code !== event.checkInCode) {
      return NextResponse.json({ error: "Invalid check-in code" }, { status: 400 })
    }

    // Exit poll: if a form is attached, validate the submitted answers.
    let validAnswers: ValidatedAnswer[] | null = null
    const form = event.checkInForm
    if (form) {
      const hasAnswers = Array.isArray(answers) && answers.length > 0

      if (event.checkInFormRequired && !hasAnswers) {
        return NextResponse.json(
          {
            error: "This event requires the exit poll to check in",
            formRequired: true,
          },
          { status: 400 }
        )
      }

      if (hasAnswers) {
        const questions: QuestionForValidation[] = form.questions.map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          required: q.required,
          options: q.options,
          allowOther: q.allowOther,
          minRating: q.minRating,
          maxRating: q.maxRating,
        }))
        const result = validateAnswers(questions, answers)
        if (result.errors) {
          return NextResponse.json(
            { error: "Please complete the exit poll", fieldErrors: result.errors },
            { status: 400 }
          )
        }
        validAnswers = result.answers
      }
    }

    let granted: GrantedAward[] = []

    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.eventRegistration.upsert({
        where: { eventId_userId: { eventId: id, userId: session.user.id } },
        update: { checkedInAt: new Date() },
        create: {
          eventId: id,
          userId: session.user.id,
          checkedInAt: new Date(),
        },
      })

      // Attendance points, plus the RSVP bonus when they signed up ahead of
      // time. Idempotent, so a repeat check-in refreshes the timestamp above
      // without paying out again. `reg.rsvpedAt` survives the upsert, which
      // only touches `checkedInAt`.
      granted = await grantEventPoints(tx, {
        userId: session.user.id,
        eventId: id,
        event: { title: event.title, startDate: event.startDate },
        rsvpedAt: reg.rsvpedAt,
      })

      if (form && validAnswers) {
        const response = await tx.formResponse.upsert({
          where: {
            formId_eventId_userId: {
              formId: form.id,
              eventId: id,
              userId: session.user.id,
            },
          },
          update: {},
          create: { formId: form.id, eventId: id, userId: session.user.id },
          select: { id: true },
        })

        await tx.formAnswer.deleteMany({ where: { responseId: response.id } })
        if (validAnswers.length > 0) {
          await tx.formAnswer.createMany({
            data: validAnswers.map((a) => ({
              responseId: response.id,
              questionId: a.questionId,
              value: a.value,
            })),
          })
        }
      }

      return reg
    })

    return NextResponse.json({
      success: true,
      checkedInAt: registration.checkedInAt,
      pointsAwarded: granted.reduce((sum, award) => sum + award.points, 0),
      awards: granted.map((award) => ({
        points: award.points,
        source: award.source,
      })),
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json(
      { error: "An error occurred while checking in" },
      { status: 500 }
    )
  }
}
