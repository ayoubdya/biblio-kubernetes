import type { User, RegisterRequest } from "./types";

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:8081";

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = USER_SERVICE_URL;
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

  async register(request: RegisterRequest): Promise<{ message: string; user: User }> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to register");
    }
    return response.json();
  }

  async syncUser(accessToken: string): Promise<{ message: string; user: User }> {
    const response = await fetch(`${this.baseUrl}/api/sync/user`, {
      method: "POST",
      headers: this.getHeaders(accessToken),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to sync user");
    }
    return response.json();
  }

  async getAllUsers(accessToken: string): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      headers: this.getHeaders(accessToken),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  }

  async getUserById(id: number, accessToken: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
      headers: this.getHeaders(accessToken),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }
    return response.json();
  }

  async deleteUser(id: number, accessToken: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(accessToken),
    });
    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
  }

  async addRoleToUser(id: number, role: string, accessToken: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/users/${id}/roles/${role}`, {
      method: "POST",
      headers: this.getHeaders(accessToken),
    });
    if (!response.ok) {
      throw new Error("Failed to add role");
    }
    return response.json();
  }

  async removeRoleFromUser(id: number, role: string, accessToken: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/users/${id}/roles/${role}`, {
      method: "DELETE",
      headers: this.getHeaders(accessToken),
    });
    if (!response.ok) {
      throw new Error("Failed to remove role");
    }
    return response.json();
  }
}

export const userService = new UserService();
