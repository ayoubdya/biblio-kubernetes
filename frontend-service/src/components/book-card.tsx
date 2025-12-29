import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { SearchDoc } from "~/lib/types";
import { cn } from "~/lib/utils";

interface BookCardProps {
  book: SearchDoc;
  className?: string;
}

export function BookCard({ book, className }: BookCardProps) {
  const coverUrl = book.coverI
    ? `https://covers.openlibrary.org/b/id/${book.coverI}-M.jpg`
    : null;

  // Extract work key from the full key path
  const workKey = book.key.replace("/works/", "");

  return (
    <Link
      href={`/books/${workKey}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
            <span className="text-center text-sm font-medium text-gray-500 px-2">
              No Cover
            </span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
          {book.title}
        </h3>
        
        {book.authorName && book.authorName.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
            by {book.authorName.join(", ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          {book.firstPublishYear && (
            <span className="text-xs text-gray-400">{book.firstPublishYear}</span>
          )}
          
          {book.editionCount && (
            <span className="text-xs text-gray-400">
              {book.editionCount} editions
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface BookCardSkeletonProps {
  className?: string;
}

export function BookCardSkeleton({ className }: BookCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white",
        className
      )}
    >
      <div className="aspect-[2/3] w-full animate-pulse bg-gray-200" />
      <div className="p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 flex justify-between">
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
