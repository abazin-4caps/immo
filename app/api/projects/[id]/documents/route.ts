import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'
import prisma from '@/lib/prisma'

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    // Vérifier que l'utilisateur a accès au projet
    const projectActor = await prisma.projectActor.findFirst({
      where: {
        projectId: params.id,
        userId: session.user.id,
      },
    })

    if (!projectActor) {
      return new NextResponse('Unauthorized', { status: 401 })
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