export default function Home() {
  return (
    <div className="min-h-screen pt-8 pb-16">
      <main className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-8">
          <div className="inline-block mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-2xl animate-pulse">
              <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-extrabold mb-4">
            <span className="text-gradient">Biblio</span> Kubernetes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Plateforme moderne de gestion de bibliothèque basée sur une architecture microservices
          </p>
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg max-w-2xl mx-auto">
            <p className="text-indigo-800 text-sm">
              🔒 <strong>Connexion requise</strong> : Vous devez être connecté pour accéder au catalogue et laisser des commentaires
            </p>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="/login" className="btn btn-primary">
              🔐 Se connecter
            </a>
            <a href="/books" className="btn btn-secondary">
              📚 Parcourir le catalogue
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">Catalog Service</h3>
            <p className="text-gray-600 mb-4">
              Gestion du catalogue de livres via OpenLibrary API
            </p>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Port 8090
            </span>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-bold mb-2">User Service</h3>
            <p className="text-gray-600 mb-4">
              Gestion des utilisateurs avec Keycloak
            </p>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Port 8081
            </span>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Comment Service</h3>
            <p className="text-gray-600 mb-4">
              Gestion des commentaires et évaluations
            </p>
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              Port 8082
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
