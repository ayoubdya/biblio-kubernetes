"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Users, Tag } from "lucide-react";
import { catalogService } from "~/lib/catalog-service";
import { commentService } from "~/lib/comment-service";
import type { Book, Comment, BookRatingStats, PaginatedResponse } from "~/lib/types";
import { RatingDisplay } from "~/components/star-rating";
import { CommentCard, CommentForm, CommentSkeleton, EmptyComments } from "~/components/comment";
import { cn } from "~/lib/utils";

export default function BookDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const workKey = params.workKey as string;

  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<PaginatedResponse<Comment> | null>(null);
  const [stats, setStats] = useState<BookRatingStats | null>(null);
  const [userComment, setUserComment] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [bookData, commentsData, statsData] = await Promise.all([
        catalogService.getBookByKey(workKey),
        commentService.getCommentsByBookKey(workKey, 0, 10),
        commentService.getBookRatingStats(workKey),
      ]);

      setBook(bookData);
      setComments(commentsData);
      setStats(statsData);

      // Check if user has already commented
      if (session?.user?.id) {
        try {
          const hasCommented = await commentService.hasUserCommented(workKey, session.user.id);
          if (hasCommented) {
            const myComment = await commentService.getUserCommentOnBook(workKey, session.user.id);
            setUserComment(myComment);
          }
        } catch {
          // User hasn't commented yet
        }
      }
    } catch (err) {
      setError("Failed to load book details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [workKey, session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitComment = async (content: string, rating: number) => {
    if (!session?.accessToken) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        await commentService.updateComment(
          editingComment.id,
          { content, rating },
          session.accessToken
        );
        setEditingComment(null);
      } else {
        await commentService.createComment(
          { bookKey: workKey, content, rating },
          session.accessToken
        );
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!session?.accessToken || !confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await commentService.deleteComment(commentId, session.accessToken);
      setUserComment(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment");
    }
  };

  const coverUrl = book?.covers?.[0]
    ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 w-24 rounded bg-gray-200" />
            <div className="mt-8 flex flex-col gap-8 md:flex-row">
              <div className="aspect-[2/3] w-full rounded-lg bg-gray-200 md:w-80" />
              <div className="flex-1 space-y-4">
                <div className="h-10 w-3/4 rounded bg-gray-200" />
                <div className="h-6 w-1/2 rounded bg-gray-200" />
                <div className="h-24 w-full rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <BookOpen className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Book not found</h2>
          <p className="mt-2 text-gray-500">{error || "Could not load book details"}</p>
          <Link
            href="/books"
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>

        {/* Book Details */}
        <div className="mt-8 flex flex-col gap-8 md:flex-row">
          {/* Cover */}
          <div className="shrink-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-100 shadow-lg md:w-80">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                  <BookOpen className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>

            {book.authors && book.authors.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-lg text-gray-600">
                <Users className="h-5 w-5" />
                <span>
                  by{" "}
                  {book.authors.map((author, i) => (
                    <span key={author.key}>
                      <Link
                        href={`/authors/${author.key.replace("/authors/", "")}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {author.name}
                      </Link>
                      {i < book.authors!.length - 1 && ", "}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {stats && stats.totalComments > 0 && (
              <div className="mt-4">
                <RatingDisplay
                  average={stats.averageRating}
                  total={stats.totalComments}
                  size="lg"
                />
              </div>
            )}

            {book.firstPublishYear && (
              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>First published in {book.firstPublishYear}</span>
              </div>
            )}

            {book.description && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                <p className="mt-2 whitespace-pre-line text-gray-600">
                  {typeof book.description === "string"
                    ? book.description
                    : (book.description as any)?.value || ""}
                </p>
              </div>
            )}

            {book.subjects && book.subjects.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Tag className="h-5 w-5" />
                  Subjects
                </h2>
                <div className="flex flex-wrap gap-2">
                  {book.subjects.slice(0, 15).map((subject) => (
                    <Link
                      key={subject}
                      href={`/books?q=${encodeURIComponent(subject)}&type=subject`}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
                    >
                      {subject}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>

          {/* Write Review Form */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {session?.user ? (
              userComment && !editingComment ? (
                <div>
                  <p className="mb-4 text-sm text-gray-600">Your review:</p>
                  <CommentCard
                    comment={userComment}
                    isOwner
                    onEdit={setEditingComment}
                    onDelete={handleDeleteComment}
                  />
                </div>
              ) : (
                <>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    {editingComment ? "Edit Your Review" : "Write a Review"}
                  </h3>
                  <CommentForm
                    bookKey={workKey}
                    existingComment={editingComment || undefined}
                    onSubmit={handleSubmitComment}
                    onCancel={editingComment ? () => setEditingComment(null) : undefined}
                    isLoading={isSubmitting}
                  />
                </>
              )
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">Sign in to write a review</p>
                <button
                  onClick={() => signIn("keycloak")}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="mt-8 space-y-4">
            {!comments ? (
              Array.from({ length: 3 }).map((_, i) => <CommentSkeleton key={i} />)
            ) : comments.content.length > 0 ? (
              comments.content
                .filter((c) => c.userId !== session?.user?.id)
                .map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onDelete={
                      session?.user?.roles?.includes("ADMIN")
                        ? handleDeleteComment
                        : undefined
                    }
                  />
                ))
            ) : !userComment ? (
              <EmptyComments />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
