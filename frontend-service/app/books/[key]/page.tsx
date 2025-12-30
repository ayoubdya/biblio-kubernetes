'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookDetails, Comment, BookRatingStats } from '@/app/types';
import { apiGet, apiPost, apiDelete, handleApiError } from '@/app/lib/api';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookKey = params.key as string;

  const [book, setBook] = useState<BookDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<BookRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    setIsAuthenticated(true);
    fetchBookData();
  }, [bookKey, router]);

  const fetchBookData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch book details
      const bookData = await apiGet<BookDetails>('catalog', `/api/books/${bookKey}`);
      setBook(bookData);

      // Fetch comments and stats with error handling
      try {
        const commentsData = await apiGet<any>('comment', `/api/comments/book/${bookKey}`);
        // L'API retourne une structure paginée avec les commentaires dans 'content'
        const comments = commentsData?.content || commentsData;
        setComments(Array.isArray(comments) ? comments : []);
      } catch (commentError) {
        console.warn('Could not fetch comments:', commentError);
        setComments([]);
      }

      try {
        const statsData = await apiGet<BookRatingStats>('comment', `/api/comments/book/${bookKey}/stats`);
        setStats(statsData || null);
      } catch (statsError) {
        console.warn('Could not fetch stats:', statsError);
        setStats(null);
      }
    } catch (err) {
      setError(handleApiError(err));
      setBook(null);
      setComments([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Récupérer l'utilisateur actuel
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Vous devez être connecté pour commenter');
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const userId = user.email.split('@')[0]; // Utiliser la partie avant @ comme userId
    const username = user.name || userId;

    setSubmitting(true);
    try {
      await apiPost('comment', '/api/comments/public', {
        bookKey: bookKey.startsWith('OL') ? bookKey : `OL${bookKey}`,
        userId: userId,
        username: username,
        content: newComment,
        rating: newRating,
      });
      setNewComment('');
      setNewRating(5);
      fetchBookData();
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert(`Erreur lors de l'ajout du commentaire: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    try {
      await apiDelete('comment', `/api/comments/public/${commentId}`);
      fetchBookData();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  // Vérification d'authentification en cours
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du livre...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Livre non trouvé'}</p>
          <button
            onClick={() => router.push('/books')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retour aux livres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Retour
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-32 w-32 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              )}

              {stats && stats.totalComments > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">
                    {'★'.repeat(Math.round(stats.averageRating || 0))}
                    {'☆'.repeat(5 - Math.round(stats.averageRating || 0))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {(stats.averageRating || 0).toFixed(1)} / 5 ({stats.totalComments} avis)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                  Par {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                {book.firstPublishYear && (
                  <div>
                    <span className="font-semibold">Première publication:</span>{' '}
                    {book.firstPublishYear}
                  </div>
                )}
                {book.numberOfPages && (
                  <div>
                    <span className="font-semibold">Pages:</span> {book.numberOfPages}
                  </div>
                )}
                {book.publishers && Array.isArray(book.publishers) && book.publishers.length > 0 && (
                  <div>
                    <span className="font-semibold">Éditeur:</span> {book.publishers[0]}
                  </div>
                )}
                {book.publishDate && (
                  <div>
                    <span className="font-semibold">Date:</span> {book.publishDate}
                  </div>
                )}
              </div>

              {book.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-gray-700 dark:text-gray-300">{book.description}</p>
                </div>
              )}

              {book.subjects && Array.isArray(book.subjects) && book.subjects.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Sujets</h2>
                  <div className="flex flex-wrap gap-2">
                    {book.subjects.slice(0, 10).map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Commentaires</h2>

              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Note</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewRating(rating)}
                        className="text-3xl"
                      >
                        {rating <= newRating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Votre commentaire..."
                  className="w-full px-4 py-2 border rounded-lg mb-2 dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Ajouter un commentaire'}
                </button>
              </form>

              <div className="space-y-4">
                {Array.isArray(comments) && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-t dark:border-gray-700 pt-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{comment.username || 'Anonyme'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">
                            {'★'.repeat(comment.rating || 0)}
                            {'☆'.repeat(5 - (comment.rating || 0))}
                          </span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Aucun commentaire pour le moment
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
