'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ProjectCard from '@/components/ProjectCard'
import Dashboard from '@/components/Dashboard'

type Project = {
  id: string
  title: string
  description: string | null
  address: string
  status: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  createdAt: Date
  updatedAt: Date
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchProjects()
    }
  }, [session])

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Vous devez être connecté pour voir vos projets
            </h3>
            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Chargement des projets...
            </h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Projets immobiliers</h1>
          <Link
            href="/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nouveau projet
          </Link>
        </div>

        <Dashboard projects={projects} />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucun projet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer un nouveau projet immobilier.
            </p>
            <div className="mt-6">
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Créer un projet
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 