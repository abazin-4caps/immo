'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Project = {
  id: string
  title: string
  description: string | null
  address: string
  status: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  createdAt: Date
  updatedAt: Date
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

export default function ProjectDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState<Project | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
          setEditedProject(data)
        } else {
          console.error('Erreur lors de la récupération du projet')
          router.push('/projects')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du projet:', error)
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (session && params.id) {
      fetchProject()
    }
  }, [session, params.id, router])

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/projects')
      } else {
        console.error('Erreur lors de la suppression du projet')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error)
    }
  }

  const handleSave = async () => {
    if (!editedProject) return

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProject),
      })

      if (response.ok) {
        const updatedProject = await response.json()
        setProject(updatedProject)
        setIsEditing(false)
      } else {
        console.error('Erreur lors de la mise à jour du projet')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error)
    }
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Vous devez être connecté pour voir les détails du projet
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
              Chargement du projet...
            </h3>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Projet non trouvé
            </h3>
            <div className="mt-6">
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retour aux projets
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/projects"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour aux projets
          </Link>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedProject(project)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={editedProject?.title}
                  onChange={(e) =>
                    setEditedProject(prev =>
                      prev ? { ...prev, title: e.target.value } : null
                    )
                  }
                  className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              )}
              {isEditing ? (
                <select
                  value={editedProject?.status}
                  onChange={(e) =>
                    setEditedProject(prev =>
                      prev ? { ...prev, status: e.target.value as Project['status'] } : null
                    )
                  }
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    statusColors[editedProject?.status || 'DRAFT']
                  }`}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusColors[project.status]
                  }`}
                >
                  {statusLabels[project.status]}
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProject?.address}
                      onChange={(e) =>
                        setEditedProject(prev =>
                          prev ? { ...prev, address: e.target.value } : null
                        )
                      }
                      className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    project.address
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {isEditing ? (
                    <textarea
                      value={editedProject?.description || ''}
                      onChange={(e) =>
                        setEditedProject(prev =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                      className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      rows={3}
                    />
                  ) : (
                    project.description || 'Aucune description'
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Dernière modification</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(project.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
} 