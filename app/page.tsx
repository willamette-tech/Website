import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { theme } from "@/lib/theme"
import { ContributionGraph } from "@/components/contribution-graph"
import { FeaturedProjects } from "@/components/featured-projects"
import { PointsLeaderboard } from "@/components/points-leaderboard"
import { getPointsLeaderboard } from "@/lib/points"

export default async function Home() {
  const recentPosts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { author: true },
  })

  const upcomingEvents = await prisma.event.findMany({
    where: {
      published: true,
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: 3,
  })

  const featuredProjects = await prisma.project.findMany({
    where: { published: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const topMembers = await getPointsLeaderboard(10)

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
        <div className={`${theme.container} relative py-20 md:py-28`}>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Welcome to Tech Club
            </div>
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl ${theme.text.heading} leading-tight`}>
              Willamette Technology
              <span className="block text-accent">Club</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-theme-secondary max-w-2xl mx-auto leading-relaxed">
              Join us in exploring the exciting world of technology. Connect with fellow students,
              attend events, and build your skills together.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/calendar"
                className={theme.button.primary + " px-8 py-3 text-base"}
              >
                View Events
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/posts"
                className={theme.button.secondary + " px-8 py-3 text-base"}
              >
                Read Posts
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a
                href="https://discord.gg/jhsWpgVh9h"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-theme-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </a>
              <a
                href="https://instagram.com/wu_tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-theme-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>
              <a
                href="https://github.com/willamette-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-theme-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className={theme.section}>
          <div className={theme.container}>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-3xl ${theme.text.heading}`}>Featured Projects</h2>
                <p className={`mt-2 ${theme.text.muted}`}>Showcasing work from our community</p>
              </div>
              <Link
                href="/projects"
                className="text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View all projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <FeaturedProjects projects={featuredProjects} />
          </div>
        </section>
      )}

      {/* GitHub Activity */}
      <section className={theme.section}>
        <div className={theme.container}>
          <ContributionGraph />
        </div>
      </section>

      {/* Top Members by Points */}
      {topMembers.length > 0 && (
        <section className={theme.section}>
          <div className={theme.container}>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className={`text-3xl ${theme.text.heading}`}>Member Points</h2>
                <p className={`mt-2 ${theme.text.muted}`}>Earned by attending events and contributing to the club</p>
              </div>
              <Link
                href="/leaderboard"
                className="text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View full leaderboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className={`${theme.card.className} p-6`}>
              <PointsLeaderboard members={topMembers} compact />
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className={theme.section}>
        <div className={theme.container}>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className={`text-3xl ${theme.text.heading}`}>Upcoming Events</h2>
              <p className={`mt-2 ${theme.text.muted}`}>Don&apos;t miss out on what&apos;s happening</p>
            </div>
            <Link
              href="/calendar"
              className="text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`${theme.card.className} p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-accent/10 text-accent">
                      <span className="text-xs font-medium uppercase">
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold leading-none">
                        {new Date(event.startDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${theme.text.heading} group-hover:text-accent transition-colors`}>
                        {event.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-theme-secondary line-clamp-2 text-sm">{event.description}</p>
                  {event.location && (
                    <div className="mt-4 pt-4 border-t border-theme-border flex items-center gap-2 text-sm text-theme-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
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
              <p className="text-theme-muted">No upcoming events. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Posts */}
      <section className={`${theme.section} bg-theme-card`}>
        <div className={theme.container}>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className={`text-3xl ${theme.text.heading}`}>Recent Posts</h2>
              <p className={`mt-2 ${theme.text.muted}`}>Latest updates from the community</p>
            </div>
            <Link
              href="/posts"
              className="text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {recentPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-theme-bg rounded-xl border border-theme-border p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300 group"
                >
                  <Link href={`/posts/${post.id}`}>
                    <h3 className={`text-xl font-semibold ${theme.text.heading} group-hover:text-accent transition-colors line-clamp-2`}>
                      {post.title}
                    </h3>
                  </Link>
                  <p className="mt-3 text-theme-secondary line-clamp-3 text-sm leading-relaxed">
                    {post.description || post.content.substring(0, 150) + "..."}
                  </p>
                  <div className="mt-4 pt-4 border-t border-theme-border flex items-center gap-3">
                    <Link
                      href={`/members/${post.author.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      {post.author.image ? (
                        <img
                          src={post.author.image}
                          alt={post.author.displayName || post.author.name || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-sm">
                          {(post.author.displayName || post.author.name || post.author.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-primary truncate">
                          {post.author.displayName || post.author.name || post.author.email}
                        </p>
                        <p className="text-xs text-theme-muted">
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-theme-bg rounded-xl border border-theme-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-hover flex items-center justify-center">
                <svg className="w-8 h-8 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-theme-muted">No posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
