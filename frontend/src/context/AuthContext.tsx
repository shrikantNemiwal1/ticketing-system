"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, LoginRequest, UserRole } from "@/types";

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
  const logout = useCallback(async () => {
    try {
      // Call logout API to clear cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    }

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

  // Helper function to get user data from cookies
  const getUserFromCookies = useCallback(() => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const userDataCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("user_data=")
      );
      if (userDataCookie) {
        try {
          const userData = JSON.parse(
            decodeURIComponent(userDataCookie.split("=")[1])
          );
          return userData;
        } catch (error) {
          console.warn("Error parsing user data from cookie:", error);
        }
      }
    }
    return null;
  }, []);

  // Initialize authentication state from cookies only
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const userData = getUserFromCookies();
        console.log(
          "🍪 Auth initialization - User data from cookies:",
          userData
        );
        if (userData) {
          setUser(userData);
          console.log(
            "✅ User authenticated from cookies:",
            userData.email,
            userData.role
          );
        } else {
          console.log("❌ No user data found in cookies");
        }
      } catch (error) {
        console.warn("Error initializing auth from cookies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [getUserFromCookies]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      console.log("🔐 Attempting login with:", credentials.email);

      // Call our Next.js API route instead of direct backend call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ Login failed:", errorData.error);
        throw new Error(errorData.error || "Authentication failed");
      }

      const data = await response.json();
      console.log("✅ Login successful, cookies should be set:", data.email);

      // Create user from backend response (cookies are set automatically by API route)
      const user: User = {
        id: data.userId.toString(),
        email: data.email,
        role: data.authorities[0] as UserRole,
      };

      setUser(user);
      console.log("🎉 User state updated:", user);
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
