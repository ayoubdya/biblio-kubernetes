"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Trash2, Edit2, MessageSquare } from "lucide-react";
import { StarRating } from "./star-rating";
import { cn, formatDate, getInitials } from "~/lib/utils";
import type { Comment } from "~/lib/types";

interface CommentCardProps {
  comment: Comment;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  isOwner?: boolean;
}

export function CommentCard({ comment, onEdit, onDelete, isOwner }: CommentCardProps) {
  const { data: session } = useSession();
  const canModify = isOwner || session?.user?.id === comment.userId;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-600">
            {getInitials(comment.username)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{comment.username}</p>
            <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={comment.rating} readonly size="sm" />
          
          {canModify && (
            <div className="ml-2 flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(comment)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                  title="Edit comment"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-gray-700">{comment.content}</p>

      {comment.updatedAt !== comment.createdAt && (
        <p className="mt-2 text-xs italic text-gray-400">
          Edited {formatDate(comment.updatedAt)}
        </p>
      )}
    </div>
  );
}

interface CommentFormProps {
  bookKey: string;
  existingComment?: Comment;
  onSubmit: (content: string, rating: number) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CommentForm({
  bookKey,
  existingComment,
  onSubmit,
  onCancel,
  isLoading,
}: CommentFormProps) {
  const [content, setContent] = useState(existingComment?.content || "");
  const [rating, setRating] = useState(existingComment?.rating || 5);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (content.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating");
      return;
    }

    try {
      await onSubmit(content.trim(), rating);
      if (!existingComment) {
        setContent("");
        setRating(5);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Your Rating
        </label>
        <StarRating rating={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Your Review
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this book..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700",
            isLoading && "cursor-not-allowed opacity-50"
          )}
        >
          {isLoading
            ? "Submitting..."
            : existingComment
              ? "Update Review"
              : "Submit Review"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function CommentSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface EmptyCommentsProps {
  message?: string;
}

export function EmptyComments({ message = "No reviews yet. Be the first to share your thoughts!" }: EmptyCommentsProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
      <MessageSquare className="h-12 w-12 text-gray-300" />
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}
