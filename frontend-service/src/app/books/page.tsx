"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookCard, BookCardSkeleton } from "~/components/book-card";
import { SearchBar } from "~/components/search-bar";
import { catalogService } from "~/lib/catalog-service";
import type { SearchResult } from "~/lib/types";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function BooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams.get("q") || "";
  const initialType = (searchParams.get("type") as "all" | "title" | "author" | "subject") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [currentType, setCurrentType] = useState(initialType);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const performSearch = useCallback(
    async (query: string, type: "all" | "title" | "author" | "subject", page: number) => {
      setIsLoading(true);
      setError("");

      try {
        let result: SearchResult;

        switch (type) {
          case "title":
            result = await catalogService.searchBooksByTitle(query, page, 12);
            break;
          case "author":
            result = await catalogService.searchBooksByAuthor(query, page, 12);
            break;
          case "subject":
            result = await catalogService.searchBooksBySubject(query, page, 12);
            break;
          default:
            result = await catalogService.searchBooks(query, page, 12);
        }

        setResults(result);
        setCurrentQuery(query);
        setCurrentType(type);
        setCurrentPage(page);

        // Update URL
        const params = new URLSearchParams();
        params.set("q", query);
        params.set("type", type);
        params.set("page", page.toString());
        router.push(`/books?${params.toString()}`, { scroll: false });
      } catch (err) {
        setError("Failed to search books. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const handleSearch = (query: string, type: "all" | "title" | "author" | "subject") => {
    performSearch(query, type, 1);
  };

  const handlePageChange = (newPage: number) => {
    performSearch(currentQuery, currentType, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = results ? Math.ceil(results.numFound / 12) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold">Discover Your Next Read</h1>
          <p className="mb-8 text-lg text-indigo-100">
            Search millions of books from the Open Library catalog
          </p>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>

      {/* Results Section */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div>
            <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : results ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Found <span className="font-semibold">{results.numFound.toLocaleString()}</span> books
                {currentQuery && (
                  <>
                    {" "}for &ldquo;<span className="font-semibold">{currentQuery}</span>&rdquo;
                  </>
                )}
              </p>
            </div>

            {results.docs.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {results.docs.map((book) => (
                    <BookCard key={book.key} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <span className="px-4 text-gray-600">
                      Page {currentPage} of {Math.min(totalPages, 100)}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || currentPage >= 100}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No books found</h3>
                <p className="mt-2 text-gray-500">Try a different search term</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Start your search</h3>
            <p className="mt-2 text-gray-500">
              Enter a title, author, or subject to find books
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
