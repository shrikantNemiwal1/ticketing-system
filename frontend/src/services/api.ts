import {
  User,
  Ticket,
  TicketComment,
  CreateTicketRequest,
  UpdateTicketRequest,
  UpdateTicketStatusRequest,
  RegisterUserRequest,
  VerifyEmailRequest,
  CreateSupportAgentRequest,
  LoginRequest,
  AuthResponse,
  DashboardStats,
  CreateCommentRequest,
  UpdateCommentRequest,
  AssignableAgent,
  AuditLog,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Global fetch wrapper with JWT error handling
 * Automatically redirects to login page when JWT token errors are detected
 */
const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    return await handleApiError(response);
  } catch (error) {
    // Additional check for network errors that might contain JWT info
    if (error instanceof Error && isJwtTokenError(error.message)) {
      handleTokenExpiration();
      throw new Error("Session expired. Please login again.");
    }
    throw error;
  }
};

/**
 * Helper function to detect JWT token errors in error messages
 * Checks for various JWT-related error patterns
 */
const isJwtTokenError = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    (lowerMessage.includes("jwt") &&
      (lowerMessage.includes("invalid") ||
        lowerMessage.includes("expired") ||
        lowerMessage.includes("malformed") ||
        lowerMessage.includes("signature"))) ||
    lowerMessage.includes("token is invalid") ||
    lowerMessage.includes("token has expired") ||
    lowerMessage.includes("authentication failed") ||
    lowerMessage.includes("unauthorized access")
  );
};

/**
 * Helper function to handle JWT token expiration
 * Clears auth data and redirects to login page
 */
const handleTokenExpiration = () => {
  // Clear stored auth data
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// Helper function to get auth headers for cookie-based auth
const getAuthHeaders = () => {
  return {
    "Content-Type": "application/json; charset=utf-8",
    // Cookies are sent automatically, no need to manually add Authorization header
  };
};

/**
 * Helper function to handle API errors with JWT token detection
 * Automatically handles JWT token expiration and redirects to login
 */
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();

    // Try to parse error response to check for JWT token errors
    try {
      const errorData = JSON.parse(errorText);

      // Check if the error indicates JWT token issues
      // Expected format: { "messages": ["JWT token is invalid or expired"], "timestamp": "..." }
      if (errorData.messages && Array.isArray(errorData.messages)) {
        const hasJwtError = errorData.messages.some((message: string) =>
          isJwtTokenError(message)
        );

        if (hasJwtError) {
          handleTokenExpiration();
          throw new Error("Session expired. Please login again.");
        }
      }

      // Throw the original error message
      throw new Error(
        errorData.messages?.[0] ||
          errorText ||
          `HTTP error! status: ${response.status}`
      );
    } catch {
      // If we can't parse the error, check for specific HTTP status codes that might indicate auth issues
      if (response.status === 401 || response.status === 403) {
        // Check if the raw error text contains JWT-related keywords
        if (isJwtTokenError(errorText)) {
          handleTokenExpiration();
          throw new Error("Session expired. Please login again.");
        }
      }

      // Throw the original error text if we can't determine if it's a JWT error
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
  }
  return response;
};

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    await handleApiError(response);
    const data = await response.json();

    // Store token and fetch user details
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  },

  register: async (
    userData: RegisterUserRequest
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    await handleApiError(response);
    return response.json();
  },

  verifyEmail: async (
    verificationData: VerifyEmailRequest
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verificationData),
    });

    await handleApiError(response);
    return response.json();
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/users/resend-otp?email=${encodeURIComponent(email)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    await handleApiError(response);
    return response.json();
  },

  getCurrentUser: async (): Promise<User> => {
    // Since your backend doesn't have a /me endpoint, we'll decode from token or store user data
    const userData = localStorage.getItem("user");
    if (userData) {
      return JSON.parse(userData);
    }
    throw new Error("No user data found");
  },
};

// Admin API
export const adminAPI = {
  createSupportAgent: async (
    userData: CreateSupportAgentRequest
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/admin/create-support-agent`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    await handleApiError(response);
    return response.json();
  },

  deleteUser: async (userId: string | number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
  },

  // Get all users without pagination
  getAllUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/all`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get all users with pagination
  getUsersPaginated: async (
    params?: PaginationParams
  ): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined)
      queryParams.set("page", params.page.toString());
    if (params?.size !== undefined)
      queryParams.set("size", params.size.toString());
    if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
    if (params?.sortDir) queryParams.set("sortDir", params.sortDir);

    const url = queryParams.toString()
      ? `${API_BASE_URL}/admin/users?${queryParams.toString()}`
      : `${API_BASE_URL}/admin/users`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get specific user details
  getUser: async (userId: string | number): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get support agents for assignment
  getSupportAgents: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/support-agents`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Assign ticket to support agent (Admin only)
  assignTicket: async (
    ticketId: string | number,
    assignedToId: number
  ): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedToId }),
    });

    await handleApiError(response);
    return response.json();
  },
};

// Tickets API
export const ticketsAPI = {
  // Get tickets based on user role (users see own, admin sees all, agents see assigned)
  getTickets: async (): Promise<Ticket[]> => {
    console.log("Making request to Next.js API route: /api/tickets");

    const response = await fetch("/api/tickets", {
      method: "GET",
      credentials: "include", // Include cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleTokenExpiration();
        throw new Error("Session expired. Please login again.");
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch tickets");
    }

    const data = await response.json();
    console.log("Tickets response data:", data);
    return data;
  },

  // Create ticket (User only) - routes through Next.js API with cookies
  createTicket: async (
    ticketData: CreateTicketRequest
  ): Promise<Ticket | null> => {
    console.log("Ticket data:", ticketData);

    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify(ticketData),
    });

    console.log("Create ticket response status:", response.status);
    console.log(
      "Create ticket response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const responseText = await response.text();
      console.error("Create ticket error response:", responseText);
      throw new Error(
        `Failed to create ticket: ${response.status} - ${responseText}`
      );
    }

    const responseText = await response.text();
    console.log("Create ticket response text:", responseText);

    // Check if response is JSON
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      console.log("Raw response:", responseText);
      throw new Error(`Server returned non-JSON response: ${responseText}`);
    }
  },

  // Get specific ticket - no userId needed, access control via JWT token
  getTicketById: async (ticketId: string | number): Promise<Ticket> => {
    const response = await apiRequest(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "GET",
    });

    const responseText = await response.text();
    console.log("Get ticket response text:", responseText);

    // Check if response is JSON
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error("Failed to parse ticket response as JSON:", parseError);
      console.log("Raw ticket response:", responseText);
      throw new Error(
        `Server returned non-JSON response for ticket: ${responseText}`
      );
    }
  },

  // Update ticket info (User only) - no userId needed
  updateTicket: async (
    ticketId: string | number,
    updates: UpdateTicketRequest
  ): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/info`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    await handleApiError(response);
    return response.json();
  },

  // Update ticket status (Support Agent only) - no userId needed
  updateTicketStatus: async (
    ticketId: string | number,
    statusUpdate: UpdateTicketStatusRequest
  ): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(statusUpdate),
    });

    await handleApiError(response);
    return response.json();
  },

  // Delete ticket - no userId needed
  deleteTicket: async (ticketId: string | number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
  },

  // Get user's own tickets explicitly
  getMyTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${API_BASE_URL}/tickets/my-tickets`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Search within a specific ticket
  searchTicket: async (
    ticketId: string | number,
    query: string
  ): Promise<Ticket[]> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/search?q=${encodeURIComponent(
        query
      )}`,
      {
        headers: getAuthHeaders(),
      }
    );

    await handleApiError(response);
    return response.json();
  },

  // Get ticket audit logs - no userId needed
  getTicketAuditLogs: async (
    ticketId: string | number
  ): Promise<AuditLog[]> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/audit-logs`,
      {
        headers: getAuthHeaders(),
      }
    );

    await handleApiError(response);
    return response.json();
  },

  // Assign/reassign ticket - unified endpoint for both ADMIN and SUPPORT_AGENT
  assignTicket: async (
    ticketId: string | number,
    assignedToId: number
  ): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedToId }),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get assignable support agents - role-based filtering applied automatically
  getAssignableAgents: async (): Promise<AssignableAgent[]> => {
    const response = await fetch(`${API_BASE_URL}/tickets/assignable-agents`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },
};

// Support Agent API
export const supportAPI = {
  // Get support agents for reassignment
  getAgents: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/support/agents`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Assign/reassign ticket to support agent
  assignTicket: async (
    ticketId: string | number,
    assignedToId: number
  ): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedToId }),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get tickets assigned to current support agent
  getMyTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${API_BASE_URL}/support/my-tickets`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get all tickets (for admin/support agent view)
  getAllTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${API_BASE_URL}/support/tickets`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  // Get unassigned tickets
  getUnassignedTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${API_BASE_URL}/support/tickets/unassigned`, {
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },
};

// Comments API
export const commentsAPI = {
  createComment: async (
    ticketId: string | number,
    commentData: CreateCommentRequest
  ): Promise<TicketComment> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/comments`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(commentData),
      }
    );

    await handleApiError(response);
    return response.json();
  },

  getComment: async (
    ticketId: string | number,
    commentId: string | number
  ): Promise<TicketComment> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    await handleApiError(response);
    return response.json();
  },

  updateComment: async (
    ticketId: string | number,
    commentId: string | number,
    updates: UpdateCommentRequest
  ): Promise<TicketComment> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      }
    );

    await handleApiError(response);
    return response.json();
  },

  deleteComment: async (
    ticketId: string | number,
    commentId: string | number
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    await handleApiError(response);
  },

  getCommentAuditLogs: async (
    ticketId: string | number,
    commentId: string | number
  ): Promise<AuditLog[]> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}/audit-logs`,
      {
        headers: getAuthHeaders(),
      }
    );

    await handleApiError(response);
    return response.json();
  },

  getTicketComments: async (
    ticketId: string | number
  ): Promise<TicketComment[]> => {
    const response = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/comments`,
      {
        headers: getAuthHeaders(),
      }
    );

    await handleApiError(response);

    const responseText = await response.text();
    console.log("Get comments response text:", responseText);

    // Check if response is JSON
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error("Failed to parse comments response as JSON:", parseError);
      console.log("Raw comments response:", responseText);
      throw new Error(
        `Server returned non-JSON response for comments: ${responseText}`
      );
    }
  },

  addComment: async (
    ticketId: string | number,
    content: string
  ): Promise<TicketComment> => {
    return commentsAPI.createComment(ticketId, { content });
  },
};

// Dashboard API (calculated from tickets data)
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const tickets = await ticketsAPI.getTickets();

    return {
      totalTickets: tickets.length,
      newTickets: tickets.filter((t) => t.status === "NEW").length,
      inProgressTickets: tickets.filter((t) => t.status === "IN_PROGRESS")
        .length,
      resolvedTickets: tickets.filter((t) => t.status === "RESOLVED").length,
      closedTickets: tickets.filter((t) => t.status === "CLOSED").length,
      highPriorityTickets: tickets.filter((t) => t.priority === "HIGH").length,
      averageResolutionTime: 24, // This would need to be calculated based on actual resolution times
    };
  },
};
