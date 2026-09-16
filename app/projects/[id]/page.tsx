import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DeleteButton } from "@/components/delete-button"
import { ContentRenderer } from "@/components/content-renderer"
import { TechnologyBadge } from "@/components/technology-badge"
import { theme } from "@/lib/theme"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: { author: true },
  })

  if (!project || !project.published) {
    notFound()
  }

  const isAuthor = session?.user?.id === project.authorId
  const isAdmin = session?.user?.isAdmin ?? false
  const canManageProject = isAuthor || isAdmin

  return (
    <div className="min-h-screen bg-theme-bg">
      <article className={`${theme.container} ${theme.section}`}>
        <div className={`${theme.card.className} max-w-4xl mx-auto overflow-hidden`}>
          {/* Project Image */}
          {project.imageUrl && (
            <div className="aspect-video w-full overflow-hidden bg-theme-hover">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Header */}
            <header className="mb-8 border-b border-theme-border pb-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className={`text-3xl md:text-4xl ${theme.text.heading} flex-1`}>
                  {project.title}
                </h1>
                {canManageProject && (
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className={theme.button.secondary}
                    >
                      Edit
                    </Link>
                    <DeleteButton id={project.id} type="project" redirectTo="/projects" />
                  </div>
                )}
              </div>

              <p className="text-lg text-theme-secondary mb-4">{project.description}</p>

              {/* Technologies */}
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <TechnologyBadge key={tech} technology={tech} />
                  ))}
                </div>
              )}

              {/* Links */}
              <div className="flex items-center gap-4">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    View Source
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-theme-secondary hover:text-theme-primary transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Live Demo
                  </a>
                )}
              </div>

              {/* Author info */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-theme-border">
                {project.author.image ? (
                  <img
                    src={project.author.image}
                    alt={project.author.displayName || project.author.name || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                    {(
                      project.author.displayName ||
                      project.author.name ||
                      project.author.email ||
                      "U"
                    )[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-theme-primary">
                    {project.author.displayName ||
                      project.author.name ||
                      project.author.email}
                  </p>
                  <time className="text-sm text-theme-muted">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </header>

            {/* Content */}
            <ContentRenderer
              content={project.content}
              type={project.type}
              title={project.title}
              resourceType="project"
              resourceId={project.id}
            />
          </div>
        </div>
      </article>
    </div>
  )
}
