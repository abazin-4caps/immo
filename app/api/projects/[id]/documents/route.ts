import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'
import prisma from '@/lib/prisma'

export async function POST(
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'Aucun fichier fourni' }),
        { status: 400 }
      )
    }

    // TODO: Implémenter le stockage de fichiers (par exemple avec AWS S3)
    // Pour l'instant, on simule un stockage avec une URL temporaire
    const document = await prisma.document.create({
      data: {
        name: file.name,
        url: `/temp/${file.name}`, // À remplacer par l'URL réelle
        type: file.type,
        project: { connect: { id: params.id } },
      },
    })

    return new NextResponse(JSON.stringify(document))
  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500 }
    )
  }
} 