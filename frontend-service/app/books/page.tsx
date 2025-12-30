'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book, SearchResponse } from '../types';
import { apiGet, handleApiError } from '../lib/api';

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchBooks = async (searchQuery: string = '', pageNum: number = 0) => {
    setLoading(true);
    setError('');
    try {
      // Use 'bestseller' as default search term to show popular books when no search query
      const defaultQuery = searchQuery || 'bestseller';
      const endpoint = `/api/books/search?q=${encodeURIComponent(defaultQuery)}&page=${pageNum}`;
      const response = await apiGet<SearchResponse>('catalog', endpoint);
      setBooks(response.docs || []);
      setTotalPages(Math.ceil((response.numFound || 0) / (response.limit || 10)));
    } catch (err) {
      setError(handleApiError(err));
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier l'authentification
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    fetchBooks('', 0); // Load bestsellers by default
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchBooks(search, 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBooks(search, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Afficher un loader pendant la vérification d'authentification
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gradient mb-2">
            📚 Catalogue de Livres
          </h1>
          <p className="text-gray-600">
            {search ? `Résultats pour "${search}"` : 'Livres les plus populaires via OpenLibrary'}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="card p-6 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un livre, un auteur, un ISBN..."
                className="form-input pl-12"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary min-w-[140px]"
            >
              {loading ? (
                <>
                  <div className="spinner h-5 w-5"></div>
                  Recherche...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Rechercher
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">Vérifiez que le service Catalog est accessible sur le port 8090</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="spinner h-12 w-12 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des livres...</p>
            </div>
          </div>
        )}

        {/* Books Grid */}
        {!loading && books.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <Link
                  key={book.key}
                  href={`/books/${book.key.replace('/works/', '')}`}
                  className="card card-hover group overflow-hidden"
                >
                  <div className="h-64 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <svg
                          className="h-20 w-20 mx-auto text-indigo-300 group-hover:text-indigo-400 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <p className="text-xs text-gray-400 mt-2">Pas de couverture</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                        📝 {book.author}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      {book.firstPublishYear && (
                        <span className="badge badge-primary text-xs">
                          {book.firstPublishYear}
                        </span>
                      )}
                      <span className="text-indigo-600 text-sm font-medium group-hover:underline">
                        Voir détails →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="btn btn-secondary"
                >
                  ← Précédent
                </button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-gray-600">
                    Page {page + 1} sur {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="btn btn-secondary"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!loading && books.length === 0 && !error && (
          <div className="text-center py-20">
            <svg className="h-24 w-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun livre trouvé</h3>
            <p className="text-gray-500">Essayez une autre recherche</p>
          </div>
        )}
      </div>
    </div>
  );
}
