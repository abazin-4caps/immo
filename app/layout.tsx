import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import { NextAuthProvider } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Plateforme de Projets Immobiliers',
  description: 'Gérez vos projets immobiliers efficacement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <NextAuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  )
} 