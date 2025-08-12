import { TicketStatus, TicketPriority, UserRole, TicketCategory, User, Ticket } from '@/types';

// Status utilities
export const getStatusColor = (status: TicketStatus): string => {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusText = (status: TicketStatus): string => {
  switch (status) {
    case 'NEW':
      return 'New';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
};

// Priority utilities
export const getPriorityColor = (priority: TicketPriority): string => {
  switch (priority) {
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPriorityText = (priority: TicketPriority): string => {
  switch (priority) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    default:
      return priority;
  }
};

// Category utilities
export const getCategoryColor = (category: TicketCategory): string => {
  switch (category) {
    case 'NETWORK':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'SOFTWARE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'HARDWARE':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'OTHER':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Role utilities
export const getRoleText = (role: UserRole): string => {
  switch (role) {
    case 'USER':
      return 'User';
    case 'SUPPORT_AGENT':
      return 'Support Agent';
    case 'ADMIN':
      return 'Administrator';
    default:
      return role;
  }
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'USER':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SUPPORT_AGENT':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Date utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return formatDate(dateString);
};

// Safe date formatting for backend API (yyyy-MM-dd HH:mm:ss format)
export const formatDateForBackend = (dateString: string | undefined | null): string => {
  if (!dateString) {
    // If no date provided, use current date
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format, using current date:', dateString);
      return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // Format to backend expected format (yyyy-MM-dd HH:mm:ss)
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (error) {
    console.error('Error formatting date, using current date:', error);
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
};

// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Permission utilities
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'SUPPORT_AGENT';
};

export const canManageAllTickets = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'SUPPORT_AGENT';
};

export const canAssignTickets = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'SUPPORT_AGENT';
};

export const canUpdateTicketStatus = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'SUPPORT_AGENT';
};

export const canDeleteTickets = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

export const canAccessSystemSettings = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

export const canUserComment = (user: User, ticket: Ticket): boolean => {
  if (!user) return false;
  
  // ADMIN and SUPPORT_AGENT can comment on any ticket
  if (user.role === 'ADMIN' || user.role === 'SUPPORT_AGENT') {
    return true;
  }
  
  // Users can comment on their own tickets
  if (user.role === 'USER' && ticket.createdBy) {
    return String(ticket.createdBy.id) === String(user.id);
  }
  
  return false;
};

// Ticket date utilities - handle backend field name differences
export const getTicketCreationDate = (ticket: Ticket): string => {
  // Backend sends 'creationDate', but we might also have 'createdAt' for compatibility
  return ticket.creationDate || ticket.createdAt || '';
};

// Navigation utilities
export const getNavigationForRole = (role: UserRole) => {
  const commonNav = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Tickets', href: '/tickets' },
    { name: 'New Ticket', href: '/tickets/new' }
  ];

  if (role === 'ADMIN') {
    return [
      ...commonNav,
      { name: 'All Tickets', href: '/support/tickets' },
      { name: 'Users', href: '/support/users' },
      { name: 'Create User', href: '/support/users/new' },
      { name: 'System Settings', href: '/admin/settings' }
    ];
  }

  if (role === 'SUPPORT_AGENT') {
    return [
      ...commonNav,
      { name: 'All Tickets', href: '/support/tickets' },
      { name: 'Users', href: '/support/users' },
      { name: 'Create User', href: '/support/users/new' }
    ];
  }

  return commonNav;
};
