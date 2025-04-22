import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/auth.config'
import prisma from '../../../../../lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401 }
      )
    }

    const { content } = await request.json()

    const comment = await prisma.comment.create({
      data: {
        content,
        project: { connect: { id: params.id } },
        author: { connect: { email: session.user.email } },
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    })

    return new NextResponse(JSON.stringify({
      ...comment,
      authorName: comment.author.name,
    }))
  } catch (error) {
    console.error('Erreur lors de la création du commentaire:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 