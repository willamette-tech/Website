import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ProjectCard } from "@/components/project-card"
import { theme } from "@/lib/theme"

export default async function ProjectsPage() {
  const session = await auth()

  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  })

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className={`${theme.container} ${theme.section}`}>
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className={`text-3xl md:text-4xl ${theme.text.heading}`}>Projects</h1>
            <p className={`mt-2 ${theme.text.muted}`}>
              Explore projects built by our community members
            </p>
          </div>
          {session?.user && (
            <Link href="/projects/new" className={theme.button.primary}>
              New Project
            </Link>
          )}
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className={`${theme.card.className} p-12 text-center`}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-hover flex items-center justify-center">
              <svg
                className="w-8 h-8 text-theme-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <p className="text-theme-muted">No projects yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
