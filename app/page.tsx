export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Bienvenue sur</span>
          <span className="block text-blue-600">ImmoProjects</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500">
          Gérez vos projets immobiliers de manière efficace et collaborative. Suivez l'avancement,
          partagez des documents et collaborez avec tous les acteurs de vos projets.
        </p>
        <div className="mt-10">
          <a
            href="/projects"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Commencer un projet
          </a>
        </div>
      </div>
    </div>
  )
} 