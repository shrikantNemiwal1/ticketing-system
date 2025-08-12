"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, LoginRequest, UserRole } from "@/types";
import { authAPI } from "@/services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  /** Handles JWT token expiration by clearing auth data and redirecting to login */
  handleTokenExpiration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Enhanced AuthProvider with improved error handling and performance optimizations
 * Maintains the same API and behavior as the original while being more robust
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized functions to prevent unnecessary re-renders
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Redirect to login page
    window.location.href = "/login";
  }, []);

  const handleTokenExpiration = useCallback(() => {
    logout();
  }, [logout]);

  const hasRole = useCallback(
    (role: string) => {
      return user?.role === role;
    },
    [user?.role]
  );

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        console.warn("Corrupted auth data cleared:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials);

      // Store token (remove "Bearer " prefix if present since we add it in headers)
      const token = response.token.startsWith("Bearer ")
        ? response.token.substring(7)
        : response.token;
      localStorage.setItem("token", token);

      // Create user from actual backend response
      const user: User = {
        id: response.userId.toString(),
        email: response.email,
        role: response.authorities[0] as UserRole, // Use the actual role from authorities
      };

      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
      handleTokenExpiration,
    }),
    [user, isLoading, login, logout, hasRole, handleTokenExpiration]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
