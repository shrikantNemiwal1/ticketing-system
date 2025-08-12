import { cookies } from "next/headers";
import { CreateSupportAgentRequest } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Server-side API utility that reads JWT token from cookies
 * and makes authenticated requests to the Spring Boot backend
 */
export class ServerAPI {
  private static async getAuthHeaders() {
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;
    // Normalize token: ensure we don't end up with "Bearer Bearer <jwt>"
    const normalizedToken = token
      ? token.startsWith("Bearer ")
        ? token.slice(7)
        : token
      : undefined;

    // Debug: token presence (avoid logging full token)
    try {
      if (normalizedToken) {
        const safeSnippet = normalizedToken.slice(0, 12) + "...";
        console.log(
          `ServerAPI: jwt_token present (len=${normalizedToken.length}) snippet=${safeSnippet}`
        );
      } else {
        console.log("ServerAPI: jwt_token missing in cookies");
      }
    } catch {}

    return {
      "Content-Type": "application/json",
      ...(normalizedToken && { Authorization: `Bearer ${normalizedToken}` }),
    };
  }

  static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();

    // Debug: request info
    try {
      const hasAuth = Boolean(
        (headers as Record<string, string>).Authorization
      );
      console.log(
        `ServerAPI: request → ${
          options.method || "GET"
        } ${endpoint} auth=${hasAuth}`
      );
    } catch {}

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      cache: "no-store",
    });

    // Debug: response basic info
    try {
      console.log(
        `ServerAPI: response ← ${response.status} ${response.statusText} for ${endpoint}`
      );
    } catch {}

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const preview = errorText ? errorText.slice(0, 200) : "";
        console.log(
          `ServerAPI: non-ok response ${response.status} for ${endpoint}; body preview: ${preview}`
        );
      } catch {}
      // Prefer backend-provided messages
      let parsedMessages: string[] = [];
      try {
        const maybeJson = JSON.parse(errorText);
        const messages = (maybeJson &&
          (maybeJson.messages || maybeJson.message)) as
          | string[]
          | string
          | undefined;
        parsedMessages = Array.isArray(messages)
          ? messages.filter((m): m is string => typeof m === "string")
          : messages
          ? [messages]
          : [];
      } catch {
        // non-JSON body; use plain text below
      }

      const haystack = (
        parsedMessages.join(" | ") ||
        errorText ||
        ""
      ).toLowerCase();
      const isJwtExpired = haystack.includes("jwt token is invalid or expired");

      if (isJwtExpired) {
        throw new Error("JWT_EXPIRED");
      }

      // For other errors (including 401/403 without JWT expired), surface message
      const messageToShow =
        parsedMessages.length > 0
          ? parsedMessages.join("\n")
          : errorText || `HTTP error! status: ${response.status}`;
      throw new Error(messageToShow);
    }

    const data = await response.json();

    // Detect backends that return 200 OK with an error payload about JWT
    try {
      const messages = (data && (data.messages || data.message)) as
        | string[]
        | string
        | undefined;
      const asArray = Array.isArray(messages)
        ? messages
        : messages
        ? [messages]
        : [];
      const hasInvalidJwt = asArray.some(
        (m) =>
          typeof m === "string" &&
          m.toLowerCase().includes("jwt token is invalid or expired")
      );
      if (hasInvalidJwt) {
        throw new Error("JWT_EXPIRED");
      }
    } catch {
      // If parsing/shape fails, ignore and continue
    }

    console.log(`API Response for ${endpoint}:`, data);
    return data;
  }

  // Dashboard API
  static async getDashboardStats() {
    return this.makeRequest("/dashboard/stats");
  }

  // Tickets API
  static async getTickets(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    status?: string; // NEW | IN_PROGRESS | RESOLVED
    priority?: string; // LOW | MEDIUM | HIGH
  }) {
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.size !== undefined)
      queryParams.append("size", params.size.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortDir) queryParams.append("sortDir", params.sortDir);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.priority) queryParams.append("priority", params.priority);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/tickets?${queryString}` : "/tickets";

    // Debug: tickets params
    try {
      console.log(
        `ServerAPI.getTickets: params=${JSON.stringify(
          params || {}
        )} → ${endpoint}`
      );
    } catch {}

    return this.makeRequest(endpoint);
  }

  static async getTicketById(ticketId: string) {
    return this.makeRequest(`/tickets/${ticketId}`);
  }

  static async getTicketComments(ticketId: string) {
    return this.makeRequest(`/tickets/${ticketId}/comments`);
  }

  static async getAssignableAgents() {
    return this.makeRequest("/tickets/assignable-agents");
  }

  // Users API (for support/admin)
  static async getUsers() {
    return this.makeRequest("/users");
  }

  static async getAllUsers() {
    return this.makeRequest("/admin/users");
  }

  static async createUser(userData: CreateSupportAgentRequest) {
    return this.makeRequest("/admin/create-support-agent", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  static async deleteUser(userId: string) {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  }
}

/**
 * Helper function to check if user is authenticated server-side
 * Returns user data from cookies or null if not authenticated
 */
export async function getServerSideUser() {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data")?.value;

    if (userDataCookie) {
      return JSON.parse(decodeURIComponent(userDataCookie));
    }
  } catch (error) {
    console.warn("Error parsing user data from cookie:", error);
  }

  return null;
}

/**
 * Reusable helper to identify JWT expiry errors thrown by ServerAPI
 */
export function isJwtExpiredError(err: unknown): boolean {
  return err instanceof Error && err.message === "JWT_EXPIRED";
}

/**
 * Helper function for server-side authentication check
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getServerSideUser();
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;

  if (!user || !token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { user };
}
