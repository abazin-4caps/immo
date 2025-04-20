'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                ImmoProjects
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/projects"
                className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300"
              >
                Projets
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-900">{session.user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 