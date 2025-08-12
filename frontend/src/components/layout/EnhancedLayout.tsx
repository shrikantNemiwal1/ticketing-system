"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { EnhancedSidebar } from "./EnhancedSidebar";
import { UserDropdown } from "./UserDropdown";
import { ThemeToggleButton } from "@/components/common";

interface EnhancedLayoutProps {
  children: React.ReactNode;
}

const EnhancedLayoutContent: React.FC<EnhancedLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { isMobileOpen, toggleMobileSidebar, isExpanded, toggleSidebar } =
    useSidebar();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Enhanced Sidebar */}
      <EnhancedSidebar />

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
          isExpanded ? "lg:ml-[290px]" : "lg:ml-[90px]"
        }`}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Unified toggle button with AppHeader styling */}
            <button
              type="button"
              className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  toggleSidebar();
                } else {
                  toggleMobileSidebar();
                }
              }}
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>

            {/* Theme toggle and user dropdown */}
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <UserDropdown />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-2 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <EnhancedLayoutContent>{children}</EnhancedLayoutContent>
    </SidebarProvider>
  );
};
