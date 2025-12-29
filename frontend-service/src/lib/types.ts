// Types for the Catalog Service (Open Library API wrapper)

export interface Author {
  key: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
  photoUrl?: string;
  works?: BookWork[];
}

export interface BookWork {
  key: string;
  title: string;
  coverUrl?: string;
  firstPublishYear?: number;
}

export interface Book {
  key: string;
  title: string;
  description?: string;
  subjects?: string[];
  covers?: number[];
  coverUrl?: string;
  authors?: Author[];
  firstPublishDate?: string;
  firstPublishYear?: number;
}

export interface SearchResult {
  numFound: number;
  start: number;
  docs: SearchDoc[];
}

export interface SearchDoc {
  key: string;
  title: string;
  authorName?: string[];
  authorKey?: string[];
  firstPublishYear?: number;
  coverI?: number;
  coverUrl?: string;
  subject?: string[];
  editionCount?: number;
}

// Types for the User Service
export interface User {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Types for the Comment Service
export interface Comment {
  id: number;
  bookKey: string;
  userId: string;
  username: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  bookKey: string;
  content: string;
  rating: number;
}

export interface UpdateCommentRequest {
  content: string;
  rating: number;
}

export interface BookRatingStats {
  bookKey: string;
  averageRating: number;
  totalComments: number;
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
