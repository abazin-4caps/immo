import NextAuth from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
  }
} 