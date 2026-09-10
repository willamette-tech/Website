import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { theme } from "@/lib/theme"
import { getMemberPointsSummary } from "@/lib/points"
import { PointAwardsList } from "@/components/point-awards-list"

async function getMember(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      githubUsername: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { posts: true, projects: true } },
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await getMember(id)

  if (!member) {
    return { title: "Member not found | Willamette Technology Club" }
  }

  const name = member.displayName || member.name || "Member"
  return {
    title: `${name} | Willamette Technology Club`,
    description: `${name}'s points and awards at the Willamette Technology Club`,
  }
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const member = await getMember(id)

  if (!member) {
    notFound()
  }

  const [summary, checkInCount] = await Promise.all([
    getMemberPointsSummary(member.id),
    prisma.eventRegistration.count({
      where: { userId: member.id, checkedInAt: { not: null } },
    }),
  ])

  const name = member.displayName || member.name || "Member"
  const isOwnProfile = session?.user?.id === member.id

  const stats = [
    { label: "Points", value: summary.total.toLocaleString() },
    { label: "Rank", value: summary.rank === null ? "—" : `#${summary.rank}` },
    { label: "Events attended", value: checkInCount.toLocaleString() },
  ]

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className={`${theme.container} ${theme.section}`}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className={`${theme.card.className} p-6 md:p-8`}>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {member.image ? (
                <img
                  src={member.image}
                  alt={name}
                  className="w-20 h-20 rounded-full border-2 border-theme-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl">
                  {name[0].toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className={`text-2xl ${theme.text.heading}`}>{name}</h1>
                  {member.isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      Admin
                    </span>
                  )}
                </div>

                {member.githubUsername && (
                  <a
                    href={`https://github.com/${member.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme-muted hover:text-accent transition-colors flex items-center gap-1 mt-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    @{member.githubUsername}
                  </a>
                )}

                <p className={`mt-2 ${theme.text.muted}`}>
                  Member since{" "}
                  {new Date(member.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                  {member._count.posts > 0 &&
                    ` · ${member._count.posts} ${member._count.posts === 1 ? "post" : "posts"}`}
                  {member._count.projects > 0 &&
                    ` · ${member._count.projects} ${member._count.projects === 1 ? "project" : "projects"}`}
                </p>
              </div>

              {isOwnProfile && (
                <Link href="/profile" className={theme.button.secondary}>
                  Edit profile
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-theme-border grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className={`text-2xl ${theme.text.heading}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-theme-muted mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Award history */}
          <div className={`${theme.card.className} p-6 md:p-8 mt-6`}>
            <div className="flex items-end justify-between mb-2">
              <h2 className={`text-lg ${theme.text.heading}`}>Points history</h2>
              <Link
                href="/leaderboard"
                className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Leaderboard
              </Link>
            </div>
            <PointAwardsList awards={summary.awards} />
          </div>
        </div>
      </div>
    </div>
  )
}
