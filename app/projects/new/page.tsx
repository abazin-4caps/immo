'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      status: formData.get('status') as ProjectStatus,
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Une erreur est survenue')
      }

      router.push('/projects')
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Nouveau projet immobilier
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Titre du projet
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse
              </label>
              <input
                type="text"
                name="address"
                id="address"
                required
                className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Statut
              </label>
              <select
                name="status"
                id="status"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="ACTIVE">Actif</option>
                <option value="ON_HOLD">En pause</option>
                <option value="COMPLETED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer le projet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 