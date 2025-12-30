export interface Book {
  key: string;
  title: string;
  author?: string;
  authorKey?: string;
  coverUrl?: string;
  firstPublishYear?: number;
  isbn?: string[];
  subject?: string[];
}

export interface BookDetails extends Book {
  description?: string;
  numberOfPages?: number;
  publishers?: string[];
  publishDate?: string;
  subjects?: string[];
}

export interface SearchResponse {
  numFound: number;
  docs: Book[];
  offset: number;
  limit: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

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

export interface BookRatingStats {
  bookKey: string;
  averageRating: number;
  totalComments: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';
  timestamp: string;
  service?: string;
  version?: string;
  services?: {
    [key: string]: {
      url: string;
      status: string;
    };
  };
}
