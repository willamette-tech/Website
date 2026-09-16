"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input, Textarea, Button, Checkbox, Select } from "@/components/ui"
import type { ContentType } from "@prisma/client"
import { readFileAsBase64, formatFileSize } from "@/lib/file-client"
import { MAX_PPTX_FILE_BYTES } from "@/lib/pptx"

interface Project {
  id: string
  title: string
  description: string
  content: string
  type: ContentType
  imageUrl: string | null
  githubUrl: string | null
  demoUrl: string | null
  technologies: string[]
  featured: boolean
}

export function EditProjectForm({
  project,
  isAdmin,
}: {
  project: Project
  isAdmin: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [technologies, setTechnologies] = useState<string[]>(project.technologies)
  const [techInput, setTechInput] = useState("")
  const [contentType, setContentType] = useState<ContentType>(project.type)
  const [content, setContent] = useState(project.content)
  const [pptxFileName, setPptxFileName] = useState<string | null>(null)
  const [pptxFileSize, setPptxFileSize] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // True once `content` is known to hold valid PPTX bytes: either a freshly
  // uploaded file, or the untouched original (when the project was already PPTX).
  const pptxContentReady =
    pptxFileName !== null || (project.type === "PPTX" && content === project.content)

  function addTechnology() {
    const tech = techInput.trim()
    if (tech && !technologies.includes(tech)) {
      setTechnologies([...technologies, tech])
      setTechInput("")
    }
  }

  function removeTechnology(tech: string) {
    setTechnologies(technologies.filter((t) => t !== tech))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addTechnology()
    }
  }

  function resetPptxFile() {
    setContent(project.type === "PPTX" ? project.content : "")
    setPptxFileName(null)
    setPptxFileSize(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split(".").pop()?.toLowerCase()

    if (contentType === "REVEAL_MD" && extension !== "md") {
      setError("Please upload a .md file for Markdown presentations")
      return
    }
    if (contentType === "REVEAL_HTML" && extension !== "html" && extension !== "htm") {
      setError("Please upload an .html file for HTML presentations")
      return
    }
    if (contentType === "PPTX") {
      if (extension !== "pptx") {
        setError("Please upload a .pptx file")
        return
      }
      if (file.size > MAX_PPTX_FILE_BYTES) {
        setError(`PPTX file exceeds the ${MAX_PPTX_FILE_BYTES / (1024 * 1024)}MB limit`)
        return
      }

      setIsProcessingFile(true)
      setError(null)
      try {
        const base64 = await readFileAsBase64(file)
        setContent(base64)
        setPptxFileName(file.name)
        setPptxFileSize(file.size)
      } catch {
        setError("Failed to read PPTX file")
      } finally {
        setIsProcessingFile(false)
      }
      return
    }

    const text = await file.text()
    setContent(text)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (contentType === "PPTX" && !pptxContentReady) {
      setError("Please upload a .pptx file")
      return
    }

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const imageUrl = formData.get("imageUrl") as string
    const githubUrl = formData.get("githubUrl") as string
    const demoUrl = formData.get("demoUrl") as string
    const featured = formData.get("featured") === "on"

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          content,
          type: contentType,
          imageUrl,
          githubUrl,
          demoUrl,
          technologies,
          featured,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update project")
        return
      }

      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getContentDescription = () => {
    switch (contentType) {
      case "MARKDOWN":
        return "Detailed description of the project. You can use Markdown formatting."
      case "REVEAL_MD":
        return "Use --- to separate horizontal slides, -- for vertical slides. Markdown is supported."
      case "REVEAL_HTML":
        return "Paste or upload raw RevealJS HTML. Each <section> is a slide."
      case "PPTX":
        return "Upload a PowerPoint file. It's rendered directly in the browser - no conversion."
    }
  }

  const getFileAccept = () => {
    switch (contentType) {
      case "REVEAL_MD":
        return ".md"
      case "REVEAL_HTML":
        return ".html,.htm"
      case "PPTX":
        return ".pptx"
      default:
        return undefined
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Input
        id="title"
        name="title"
        type="text"
        label="Title"
        defaultValue={project.title}
        required
      />

      <Textarea
        id="description"
        name="description"
        rows={2}
        label="Description"
        description="A short summary that appears in project previews"
        defaultValue={project.description}
        required
      />

      <div>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          label="Image URL"
          defaultValue={project.imageUrl || ""}
        />
        <p className="mt-1.5 text-sm text-theme-muted">
          URL to a cover image for the project (optional)
        </p>
      </div>

      <div>
        <Input
          id="githubUrl"
          name="githubUrl"
          type="url"
          label="GitHub URL"
          defaultValue={project.githubUrl || ""}
        />
        <p className="mt-1.5 text-sm text-theme-muted">
          Link to the project&apos;s source code (optional)
        </p>
      </div>

      <div>
        <Input
          id="demoUrl"
          name="demoUrl"
          type="url"
          label="Demo URL"
          defaultValue={project.demoUrl || ""}
        />
        <p className="mt-1.5 text-sm text-theme-muted">
          Link to a live demo of the project (optional)
        </p>
      </div>

      {/* Technologies */}
      <div>
        <label className="block text-sm font-medium text-theme-primary mb-1.5">
          Technologies
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a technology"
            className="flex-1 rounded-lg border border-theme-border bg-theme-input px-4 py-2.5 text-theme-primary placeholder-theme-muted shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <Button type="button" variant="secondary" onClick={addTechnology}>
            Add
          </Button>
        </div>
        {technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-accent/10 text-accent"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => removeTechnology(tech)}
                  className="hover:text-accent-hover"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-sm text-theme-muted">
          Press Enter or click Add to add technologies
        </p>
      </div>

      <Select
        id="type"
        name="type"
        label="Content Type"
        value={contentType}
        onChange={(e) => {
          const newType = e.target.value as ContentType
          // Don't carry a huge base64 blob into a plain-text field.
          if (contentType === "PPTX" && newType !== "PPTX") {
            setContent("")
          }
          setContentType(newType)
          setPptxFileName(null)
          setPptxFileSize(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }}
        description="Choose the format for your content"
      >
        <option value="MARKDOWN">Markdown</option>
        <option value="REVEAL_MD">RevealJS Presentation (Markdown)</option>
        <option value="REVEAL_HTML">RevealJS Presentation (HTML)</option>
        <option value="PPTX">PowerPoint Presentation (PPTX)</option>
      </Select>

      {(contentType === "REVEAL_MD" || contentType === "REVEAL_HTML") && (
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1.5">
            Upload File (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={getFileAccept()}
            onChange={handleFileUpload}
            className="block w-full text-sm text-theme-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-hover"
          />
          <p className="mt-1.5 text-sm text-theme-muted">
            Or edit content directly in the textarea below
          </p>
        </div>
      )}

      {contentType === "PPTX" && (
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1.5">
            {pptxContentReady && pptxFileName === null
              ? "Replace File (Optional)"
              : "Upload File"}
          </label>

          {pptxContentReady && pptxFileName === null && (
            <div className="mb-2 flex items-center justify-between rounded-md bg-theme-secondary/50 px-3 py-2 text-sm">
              <span className="text-theme-primary">
                📎 A PPTX file is attached to this project
              </span>
              <Link
                href={`/projects/${project.id}/slides`}
                target="_blank"
                className="text-accent hover:text-accent-hover font-medium"
              >
                Preview
              </Link>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={getFileAccept()}
            onChange={handleFileUpload}
            disabled={isProcessingFile}
            className="block w-full text-sm text-theme-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-hover disabled:opacity-50"
          />
          {isProcessingFile && (
            <p className="mt-1.5 text-sm text-accent">Reading file&hellip;</p>
          )}
          {!isProcessingFile && pptxFileName && (
            <div className="mt-2 flex items-center justify-between rounded-md bg-theme-secondary/50 px-3 py-2 text-sm">
              <span className="text-theme-primary">
                📎 {pptxFileName}
                {pptxFileSize !== null && (
                  <span className="text-theme-muted"> ({formatFileSize(pptxFileSize)})</span>
                )}
              </span>
              <button
                type="button"
                onClick={resetPptxFile}
                className="text-theme-muted hover:text-theme-primary"
              >
                Remove
              </button>
            </div>
          )}
          <p className="mt-1.5 text-sm text-theme-muted">{getContentDescription()}</p>
        </div>
      )}

      {contentType !== "PPTX" && (
        <Textarea
          id="content"
          name="content"
          rows={15}
          label="Content"
          description={getContentDescription()}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      )}

      {isAdmin && (
        <div>
          <Checkbox
            id="featured"
            name="featured"
            label="Featured project"
            defaultChecked={project.featured}
          />
          <p className="mt-1.5 text-sm text-theme-muted">
            Featured projects appear on the home page
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Save Changes
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
