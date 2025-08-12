// Core types for the ticketing system

export type UserRole = "USER" | "SUPPORT_AGENT" | "ADMIN";

export type TicketStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export type TicketCategory = "NETWORK" | "HARDWARE" | "SOFTWARE" | "OTHER";

export interface User {
  id: string | number;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string | number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy?: User;
  assignedTo?: User;
  assignedBy?: User;
  creationDate: string;
  createdAt?: string;
  updatedAt?: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketComment {
  id: string | number;
  content: string;
  author: User;
  createdAt: string;
}

export interface PaginatedTicketsResponse {
  tickets: Ticket[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
}

export interface UpdateTicketRequest {
  title: string;
  description: string;
  creationDate: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface CreateSupportAgentRequest {
  email: string;
  password: string;
  role: "SUPPORT_AGENT" | "ADMIN";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  userId: number;
  authorities: string[];
  message: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface AssignTicketRequest {
  assignedToId: number;
}

export interface AssignableAgent {
  id: number;
  email: string;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardStats {
  totalTickets: number;
  newTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  averageResolutionTime: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  users?: T[];
  tickets?: T[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}
