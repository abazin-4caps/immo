'use client'

import Link from 'next/link'

type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

interface Project {
  id: string
  title: string
  description: string | null
  address: string
  status: string
  createdAt: Date
  updatedAt: Date
}

const statusColors: Record<ProjectStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<ProjectStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            <Link href={`/projects/${project.id}`} className="hover:text-blue-600">
              {project.title}
            </Link>
          </h3>
          <p className="mt-2 text-gray-600">{project.description}</p>
          <p className="mt-2 text-sm text-gray-500">{project.address}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[project.status as ProjectStatus]
          }`}
        >
          {statusLabels[project.status as ProjectStatus]}
        </span>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Créé le {new Date(project.createdAt).toLocaleDateString()}
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Voir les détails
        </Link>
      </div>
    </div>
  )
} 