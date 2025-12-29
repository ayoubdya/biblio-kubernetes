import type { Book, SearchResult, Author } from "./types";

const CATALOG_SERVICE_URL = process.env.NEXT_PUBLIC_CATALOG_SERVICE_URL || "http://localhost:8082";

class CatalogService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CATALOG_SERVICE_URL;
  }

  async searchBooks(query: string, page = 1, limit = 10): Promise<SearchResult> {
    const response = await fetch(
      `${this.baseUrl}/api/books/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) {
      throw new Error("Failed to search books");
    }
    return response.json();
  }

  async searchBooksByTitle(title: string, page = 1, limit = 10): Promise<SearchResult> {
    const response = await fetch(
      `${this.baseUrl}/api/books/search/title?title=${encodeURIComponent(title)}&page=${page}&limit=${limit}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) {
      throw new Error("Failed to search books by title");
    }
    return response.json();
  }

  async searchBooksByAuthor(author: string, page = 1, limit = 10): Promise<SearchResult> {
    const response = await fetch(
      `${this.baseUrl}/api/books/search/author?author=${encodeURIComponent(author)}&page=${page}&limit=${limit}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) {
      throw new Error("Failed to search books by author");
    }
    return response.json();
  }

  async searchBooksBySubject(subject: string, page = 1, limit = 10): Promise<SearchResult> {
    const response = await fetch(
      `${this.baseUrl}/api/books/search/subject?subject=${encodeURIComponent(subject)}&page=${page}&limit=${limit}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) {
      throw new Error("Failed to search books by subject");
    }
    return response.json();
  }

  async getBookByKey(workKey: string): Promise<Book> {
    const response = await fetch(`${this.baseUrl}/api/books/${workKey}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch book");
    }
    return response.json();
  }

  async getAuthorByKey(authorKey: string): Promise<Author> {
    const response = await fetch(`${this.baseUrl}/api/authors/${authorKey}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch author");
    }
    return response.json();
  }

  async getAuthorWithWorks(authorKey: string, limit = 10): Promise<Author> {
    const response = await fetch(
      `${this.baseUrl}/api/authors/${authorKey}/works?limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch author with works");
    }
    return response.json();
  }

  // Helper to get cover URL
  getCoverUrl(coverId: number | undefined, size: "S" | "M" | "L" = "M"): string {
    if (!coverId) {
      return "/placeholder-book.png";
    }
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }
}

export const catalogService = new CatalogService();
