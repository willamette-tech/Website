import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateContentForType } from "@/lib/content-validation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!project || !project.published) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching the project" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const {
      title,
      description,
      content,
      type,
      imageUrl,
      githubUrl,
      demoUrl,
      technologies,
      featured,
    } = await request.json()

    // Check if project exists and user is the author
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const isAdmin = session.user.isAdmin ?? false

    if (existingProject.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "You can only edit your own projects" },
        { status: 403 }
      )
    }

    if (content) {
      const contentError = validateContentForType(type || existingProject.type, content)
      if (contentError) {
        return NextResponse.json({ error: contentError }, { status: 400 })
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        content,
        ...(type && { type }),
        imageUrl: imageUrl || null,
        githubUrl: githubUrl || null,
        demoUrl: demoUrl || null,
        technologies: technologies || [],
        // Non-admins have no featured control, so their submissions carry no
        // value for it — keep whatever an admin set instead of clearing it.
        featured: isAdmin ? featured || false : existingProject.featured,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json(
      { error: "An error occurred while updating the project" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if project exists and user is the author
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (existingProject.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own projects" },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json(
      { error: "An error occurred while deleting the project" },
      { status: 500 }
    )
  }
}
