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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement du livre...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold mb-4">{error || 'Livre non trouvé'}</p>
          <button
            onClick={() => router.push('/books')}
            className="btn btn-primary"
          >
            Retour aux livres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-purple-50">
      <div className="container-custom py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-cyan-600 font-medium transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full rounded-xl mb-6 shadow-lg"
                />
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="h-24 w-24 text-gray-300"
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
                </div>
              )}

              {stats && stats.totalComments > 0 && (
                <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="text-3xl font-bold text-amber-500 mb-1">
                    {'★'.repeat(Math.round(stats.averageRating || 0))}
                    <span className="text-gray-300">{'★'.repeat(5 - Math.round(stats.averageRating || 0))}</span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">
                    {(stats.averageRating || 0).toFixed(1)} / 5 ({stats.totalComments} avis)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-xl text-gray-600 mb-6 flex items-center gap-2">
                  <svg className="h-5 w-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Par {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {book.firstPublishYear && (
                  <div className="p-3 bg-gradient-to-r from-cyan-50 to-cyan-100/50 rounded-xl border border-cyan-100">
                    <span className="text-xs font-medium text-cyan-600 uppercase tracking-wide">Première publication</span>
                    <p className="text-gray-900 font-semibold">{book.firstPublishYear}</p>
                  </div>
                )}
                {book.numberOfPages && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-100">
                    <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Pages</span>
                    <p className="text-gray-900 font-semibold">{book.numberOfPages}</p>
                  </div>
                )}
                {book.publishers && Array.isArray(book.publishers) && book.publishers.length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100">
                    <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Éditeur</span>
                    <p className="text-gray-900 font-semibold">{book.publishers[0]}</p>
                  </div>
                )}
                {book.publishDate && (
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-100">
                    <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Date</span>
                    <p className="text-gray-900 font-semibold">{book.publishDate}</p>
                  </div>
                )}
              </div>

              {book.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{book.description}</p>
                </div>
              )}

              {book.subjects && Array.isArray(book.subjects) && book.subjects.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Sujets
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {book.subjects.slice(0, 10).map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-purple-50 text-gray-700 rounded-full text-sm font-medium border border-cyan-100 hover:border-cyan-300 transition-colors"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-100 to-purple-100">
                  <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                Commentaires
              </h2>

              <form onSubmit={handleSubmitComment} className="mb-8 p-6 bg-gradient-to-r from-cyan-50/50 to-purple-50/50 rounded-2xl border border-cyan-100">
                <div className="mb-4">
                  <label className="block mb-2 font-semibold text-gray-700">Votre note</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setNewRating(rating)}
                        className="text-3xl transition-transform hover:scale-110"
                      >
                        <span className={rating <= newRating ? 'text-amber-400' : 'text-gray-300'}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partagez votre avis sur ce livre..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <div className="spinner h-5 w-5"></div>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Ajouter un commentaire
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-4">
                {Array.isArray(comments) && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {(comment.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{comment.username || 'Anonyme'}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 text-lg">
                            {'★'.repeat(comment.rating || 0)}
                            <span className="text-gray-300">{'★'.repeat(5 - (comment.rating || 0))}</span>
                          </span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Aucun commentaire pour le moment</p>
                    <p className="text-gray-400 text-sm mt-1">Soyez le premier à donner votre avis !</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
