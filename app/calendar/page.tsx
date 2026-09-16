import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { theme } from "@/lib/theme"
import { isPast, isUpcoming } from "@/lib/events"

export default async function CalendarPage() {
  const session = await auth()

  const events = await prisma.event.findMany({
    where: { published: true },
    orderBy: { startDate: "asc" },
    include: { author: true },
  })

  const now = new Date()
  const upcomingEvents = events.filter((event) => isUpcoming(event, now))
  const pastEvents = events.filter((event) => isPast(event, now))

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className={`${theme.container} ${theme.section}`}>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className={`text-4xl ${theme.text.heading}`}>Events Calendar</h1>
            <p className={`mt-2 ${theme.text.muted}`}>Discover upcoming events and activities</p>
          </div>
          {session?.user?.isAdmin && (
            <Link href="/events/new" className={theme.button.primary}>
              New Event
            </Link>
          )}
        </div>

        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className={`text-2xl ${theme.text.heading} mb-6`}>Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`${theme.card.className} block p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300 group`}
                >
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-accent/10 text-accent">
                      <span className="text-sm font-medium uppercase">
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold leading-none">
                        {new Date(event.startDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl font-semibold ${theme.text.heading} group-hover:text-accent transition-colors`}>
                        {event.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-theme-muted">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(event.startDate).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-theme-secondary line-clamp-2">{event.description}</p>
                      <p className={`mt-3 ${theme.text.muted}`}>
                        Posted by {event.author.displayName || event.author.name || event.author.email}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={`${theme.card.className} p-12 text-center`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-hover flex items-center justify-center">
                <svg className="w-8 h-8 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-theme-muted">No upcoming events scheduled. Check back soon!</p>
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className={`text-2xl ${theme.text.heading} mb-6`}>Past Events</h2>
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`${theme.card.className} block p-4 opacity-60 hover:opacity-100 hover:border-accent/50 transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-theme-hover text-theme-muted">
                      <span className="text-xs font-medium uppercase">
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {new Date(event.startDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${theme.text.heading} group-hover:text-accent transition-colors truncate`}>
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="text-sm text-theme-muted">{event.location}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
