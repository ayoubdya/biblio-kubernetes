import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  BookRatingStats,
  PaginatedResponse,
} from "./types";

const COMMENT_SERVICE_URL = process.env.NEXT_PUBLIC_COMMENT_SERVICE_URL || "http://localhost:8083";

class CommentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = COMMENT_SERVICE_URL;
  }

  private getHeaders(accessToken?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  }

  async getCommentsByBookKey(
    bookKey: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Comment>> {
    const response = await fetch(
      `${this.baseUrl}/api/comments/book/${bookKey}?page=${page}&size=${size}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch comments");
    }
    return response.json();
  }

  async getCommentById(id: number): Promise<Comment> {
    const response = await fetch(`${this.baseUrl}/api/comments/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch comment");
    }
    return response.json();
  }

  async getBookRatingStats(bookKey: string): Promise<BookRatingStats> {
    const response = await fetch(
      `${this.baseUrl}/api/comments/book/${bookKey}/stats`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch rating stats");
    }
    return response.json();
  }

  async hasUserCommented(bookKey: string, userId: string): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/api/comments/book/${bookKey}/user/${userId}/exists`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Failed to check user comment");
    }
    return response.json();
  }

  async getUserCommentOnBook(bookKey: string, userId: string): Promise<Comment> {
    const response = await fetch(
      `${this.baseUrl}/api/comments/book/${bookKey}/user/${userId}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user comment");
    }
    return response.json();
  }

  async createComment(
    request: CreateCommentRequest,
    accessToken: string
  ): Promise<Comment> {
    const response = await fetch(`${this.baseUrl}/api/comments`, {
      method: "POST",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create comment");
    }
    return response.json();
  }

  async updateComment(
    id: number,
    request: UpdateCommentRequest,
    accessToken: string
  ): Promise<Comment> {
    const response = await fetch(`${this.baseUrl}/api/comments/${id}`, {
      method: "PUT",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to update comment");
    }
    return response.json();
  }

  async deleteComment(id: number, accessToken: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/comments/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(accessToken),
    });
    if (!response.ok) {
      throw new Error("Failed to delete comment");
    }
  }

  async getMyCommentOnBook(bookKey: string, accessToken: string): Promise<Comment> {
    const response = await fetch(
      `${this.baseUrl}/api/comments/book/${bookKey}/me`,
      {
        headers: this.getHeaders(accessToken),
        cache: "no-store",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch my comment");
    }
    return response.json();
  }

  async getCommentsByUserId(
    userId: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Comment>> {
    const response = await fetch(
      `${this.baseUrl}/api/comments/user/${userId}?page=${page}&size=${size}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user comments");
    }
    return response.json();
  }
}

export const commentService = new CommentService();
