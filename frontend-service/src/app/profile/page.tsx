"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { User, BookOpen, Star, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { commentService } from "~/lib/comment-service";
import { userService } from "~/lib/user-service";
import type { Comment, PaginatedResponse } from "~/lib/types";
import { CommentCard, CommentSkeleton } from "~/components/comment";
import { StarRating } from "~/components/star-rating";
import { formatDate, getInitials } from "~/lib/utils";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<PaginatedResponse<Comment> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchComments = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const data = await commentService.getCommentsByUserId(session.user.id, page, 10);
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, page]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchComments();
    }
  }, [fetchComments, session?.user?.id]);

  // Sync user on first load
  useEffect(() => {
    const syncUser = async () => {
      if (session?.accessToken) {
        try {
          await userService.syncUser(session.accessToken);
        } catch (err) {
          // User might already be synced
        }
      }
    };
    syncUser();
  }, [session?.accessToken]);

  const handleDeleteComment = async (commentId: number) => {
    if (!session?.accessToken || !confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await commentService.deleteComment(commentId, session.accessToken);
      await fetchComments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-xl bg-gray-200" />
            <div className="h-20 rounded-xl bg-gray-200" />
            <div className="h-20 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Sign in to view your profile</h2>
          <p className="mt-2 text-gray-500">
            Access your reviews and reading history
          </p>
          <button
            onClick={() => signIn("keycloak")}
            className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Sign In with Keycloak
          </button>
        </div>
      </div>
    );
  }

  const averageRating =
    comments && comments.content.length > 0
      ? comments.content.reduce((sum, c) => sum + c.rating, 0) / comments.content.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
              {getInitials(session.user.name || session.user.email || "U")}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {session.user.name || "User"}
              </h1>
              <p className="text-gray-500">{session.user.email}</p>
              {session.user.roles && session.user.roles.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {session.user.roles
                    .filter((role) => !role.startsWith("default-"))
                    .map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600"
                      >
                        {role}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                {comments?.totalElements || 0}
              </div>
              <p className="text-sm text-gray-500">Reviews</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                {averageRating.toFixed(1)}
              </div>
              <p className="text-sm text-gray-500">Avg Rating</p>
            </div>
            <div className="col-span-2 text-center sm:col-span-1">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Calendar className="h-6 w-6 text-indigo-600" />
                {new Date().getFullYear()}
              </div>
              <p className="text-sm text-gray-500">Member Since</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="mb-6 text-xl font-bold text-gray-900">My Reviews</h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          ) : comments && comments.content.length > 0 ? (
            <>
              <div className="space-y-4">
                {comments.content.map((comment) => (
                  <div key={comment.id} className="relative">
                    {/* Book link badge */}
                    <Link
                      href={`/books/${comment.bookKey}`}
                      className="absolute -top-2 left-4 z-10 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-indigo-700"
                    >
                      View Book →
                    </Link>
                    <CommentCard
                      comment={comment}
                      isOwner
                      onDelete={handleDeleteComment}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {comments.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={comments.first}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="px-4 text-gray-600">
                    Page {page + 1} of {comments.totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={comments.last}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No reviews yet</h3>
              <p className="mt-2 text-gray-500">
                Start exploring books and share your thoughts!
              </p>
              <Link
                href="/books"
                className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Browse Books
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
