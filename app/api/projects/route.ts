import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Validation des données
    if (!data.title || !data.address || !data.status) {
      return NextResponse.json(
        { error: 'Titre, adresse et statut sont requis' },
        { status: 400 }
      )
    }

    // Création du projet
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        status: data.status,
        actors: {
          create: {
            role: 'OWNER',
            userId: session.user.id
          }
        }
      },
      include: {
        actors: true
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du projet' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const projects = await prisma.project.findMany({
      where: {
        actors: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        actors: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    )
  }
} 