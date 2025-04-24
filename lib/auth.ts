import { auth } from '@/app/api/auth/auth.config';
import { type Session } from 'next-auth';

export type AuthSession = Session & {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
};

export async function getSession() {
  const session = await auth();
  return session as AuthSession;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
} 