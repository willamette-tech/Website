import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DeleteButton } from "@/components/delete-button"
import { MarkdownContent } from "@/components/markdown-content"
import { RsvpButton } from "@/components/rsvp-button"
import { CheckinForm } from "@/components/checkin-form"
import { AdminCheckinCode } from "@/components/admin-checkin-code"
import { EventFormManager } from "@/components/event-form-manager"
import { EventPollResults } from "@/components/event-poll-results"
import { AttendeesList } from "@/components/attendees-list"
import { theme } from "@/lib/theme"
import { POINTS_RSVP_BONUS } from "@/lib/points-config"

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      author: true,
      checkInForm: {
        include: { questions: { orderBy: { order: "asc" } } },
      },
      registrations: {
        where: { checkedInAt: { not: null } },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { checkedInAt: "asc" },
      },
    },
  })

  if (!event || !event.published) {
    notFound()
  }

  const isAuthor = session?.user?.id === event.authorId
  const isAdmin = session?.user?.isAdmin
  const canManageEvent = isAuthor || isAdmin

  const now = new Date()
  const eventEnd = event.endDate || event.startDate
  const isPastEvent = eventEnd < now

  const rsvpCount = await prisma.eventRegistration.count({
    where: { eventId: id, rsvpedAt: { not: null } },
  })

  let userRegistration = null
  if (session?.user?.id) {
    userRegistration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    })
  }

  const attendees = event.registrations.map((r) => ({
    id: r.user.id,
    displayName: r.user.displayName || r.user.name,
    image: r.user.image,
    checkedInAt: r.checkedInAt!.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-theme-bg">
      <article className={`${theme.container} ${theme.section}`}>
        <div className={`${theme.card.className} max-w-4xl mx-auto p-8`}>
          {/* Header */}
          <header className="mb-8 border-b border-theme-border pb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className={`text-3xl md:text-4xl ${theme.text.heading} flex-1`}>
                {event.title}
              </h1>
              {canManageEvent && (
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/events/${event.id}/edit`}
                    className={theme.button.secondary}
                  >
                    Edit
                  </Link>
                  <DeleteButton id={event.id} type="event" redirectTo="/calendar" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-theme-muted">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time>
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" at "}
                  {new Date(event.startDate).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>

              {event.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Posted by {event.author.displayName || event.author.name || event.author.email}</span>
              </div>
            </div>

            {event.description && (
              <p className="mt-4 text-lg text-theme-secondary italic">
                {event.description}
              </p>
            )}
          </header>

          {/* Markdown Content */}
          <MarkdownContent content={event.content} />

          {/* Attendance Section */}
          <div className="mt-8 pt-8 border-t border-theme-border space-y-6">
            {!isPastEvent && (
              <>
                {/* RSVP Button */}
                <RsvpButton
                  eventId={event.id}
                  initialRsvpCount={rsvpCount}
                  initialHasRsvped={!!userRegistration?.rsvpedAt}
                  initialHasCheckedIn={!!userRegistration?.checkedInAt}
                  bonusPoints={POINTS_RSVP_BONUS}
                  initialRsvpOpen={now < event.startDate}
                  initialBonusEarned={
                    !!userRegistration?.rsvpedAt &&
                    userRegistration.rsvpedAt < event.startDate
                  }
                />

                {/* Check-in Form (only if code exists) */}
                {event.checkInCode && (
                  <CheckinForm
                    eventId={event.id}
                    eventTitle={event.title}
                    hasCheckedIn={!!userRegistration?.checkedInAt}
                    checkInForm={event.checkInForm}
                    formRequired={event.checkInFormRequired}
                  />
                )}
              </>
            )}

            {/* Past Event - Show Attendees */}
            {isPastEvent && attendees.length > 0 && (
              <AttendeesList attendees={attendees} />
            )}

            {/* Past Event - Exit poll results for managers */}
            {isPastEvent && canManageEvent && event.checkInFormId && (
              <div className="pt-4 border-t border-theme-border">
                <EventPollResults
                  eventId={event.id}
                  formId={event.checkInFormId}
                />
              </div>
            )}

            {/* Admin/Author Panel */}
            {canManageEvent && !isPastEvent && (
              <div className="pt-4 border-t border-theme-border space-y-4">
                <h3 className={`text-sm font-medium ${theme.text.muted}`}>
                  Event Management
                </h3>
                <AdminCheckinCode eventId={event.id} />
                <EventFormManager eventId={event.id} />
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
