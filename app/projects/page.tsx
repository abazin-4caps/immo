import { Metadata } from 'next';
import { auth } from '@/app/api/auth/auth.config';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Projets - Immo',
  description: 'Liste de vos projets immobiliers',
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  status: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  const prismaProjects = await prisma.project.findMany({
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
  });

  const projects: Project[] = prismaProjects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    address: project.address,
    status: project.status as 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }));

  return (
    <Dashboard projects={projects} />
  );
} 