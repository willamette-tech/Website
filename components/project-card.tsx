import Link from "next/link"
import { TechnologyBadge } from "./technology-badge"
import { theme } from "@/lib/theme"

interface Project {
  id: string
  title: string
  description: string
  imageUrl: string | null
  githubUrl: string | null
  demoUrl: string | null
  technologies: string[]
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article
      className={`${theme.card.className} overflow-hidden hover:border-accent/50 hover:shadow-lg transition-all duration-300 group flex flex-col`}
    >
      {project.imageUrl && (
        <Link href={`/projects/${project.id}`} className="block">
          <div className="aspect-video overflow-hidden bg-theme-hover">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <Link href={`/projects/${project.id}`}>
          <h3
            className={`text-xl font-semibold ${theme.text.heading} group-hover:text-accent transition-colors line-clamp-2`}
          >
            {project.title}
          </h3>
        </Link>
        <p className="mt-3 text-theme-secondary line-clamp-3 text-sm leading-relaxed flex-1">
          {project.description}
        </p>

        {project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <TechnologyBadge key={tech} technology={tech} />
            ))}
            {project.technologies.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-hover text-theme-muted">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-theme-border flex items-center gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-theme-muted hover:text-theme-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Code
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-theme-muted hover:text-theme-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Demo
            </a>
          )}
          <Link
            href={`/projects/${project.id}`}
            className="ml-auto flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
          >
            View details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}
