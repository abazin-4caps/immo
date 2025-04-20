import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401 }
      )
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        comments: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Projet non trouvé' }),
        { status: 404 }
      )
    }

    // Transformer les commentaires pour inclure authorName
    const transformedProject = {
      ...project,
      comments: project.comments.map(comment => ({
        ...comment,
        authorName: comment.author.name,
      })),
    }

    return new NextResponse(JSON.stringify(transformedProject))
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401 }
      )
    }

    const updates = await request.json()
    
    // Ne permettre que la mise à jour des champs autorisés
    const allowedUpdates = {
      title: updates.title,
      description: updates.description,
      address: updates.address,
      status: updates.status,
    }

    // Filtrer les champs undefined
    const validUpdates = Object.entries(allowedUpdates)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    const project = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: validUpdates,
      include: {
        comments: {
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Transformer les commentaires pour inclure authorName
    const transformedProject = {
      ...project,
      comments: project.comments.map(comment => ({
        ...comment,
        authorName: comment.author.name,
      })),
    }

    return new NextResponse(JSON.stringify(transformedProject))
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401 }
      )
    }

    // Supprimer d'abord les relations
    await prisma.$transaction([
      prisma.comment.deleteMany({
        where: { projectId: params.id },
      }),
      prisma.document.deleteMany({
        where: { projectId: params.id },
      }),
      prisma.projectActor.deleteMany({
        where: { projectId: params.id },
      }),
      prisma.project.delete({
        where: { id: params.id },
      }),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 