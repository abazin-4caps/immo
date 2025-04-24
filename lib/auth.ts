import { auth } from '@/app/api/auth/auth.config';

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function isAuthenticated() {
  const session = await auth();
  return !!session?.user;
} 