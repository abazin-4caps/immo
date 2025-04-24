import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { Session } from 'next-auth';

export const metadata: Metadata = {
  title: 'Détails du projet - Immo',
  description: 'Détails du projet immobilier',
};

type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

const projectInclude = {
  actors: {
    include: {
      user: true,
    },
  },
  documents: true,
  comments: {
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.ProjectInclude;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

const statusColors: Record<ProjectStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
} as const;

const statusLabels: Record<ProjectStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  ON_HOLD: 'En attente',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
} as const;

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as Session & {
    user: { id: string }
  };

  if (!session) {
    redirect('/auth/signin');
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
    },
    include: projectInclude,
  });

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
    );
  }

  // Vérifier si l'utilisateur a accès au projet
  const hasAccess = project.actors.some(actor => actor.userId === session.user.id);
  
  if (!hasAccess) {
    redirect('/projects');
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h2 className="text-2xl font-semibold text-gray-900">{project.title}</h2>
        <div className="mt-2 flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status as ProjectStatus]}`}>
            {statusLabels[project.status as ProjectStatus]}
          </span>
        </div>
      </div>
      
      {/* Reste du JSX pour afficher les détails du projet */}
    </div>
  );
} 