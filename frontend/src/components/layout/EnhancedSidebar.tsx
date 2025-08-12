"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import {
  DashboardIcon,
  TicketsIcon,
  NewTicketIcon,
  UsersIcon,
  CreateUserIcon,
  HorizontalDotsIcon,
} from "@/components/ui/Icons";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const getNavItemsForRole = (role: string): NavItem[] => {
  const items: NavItem[] = [
    {
      icon: <DashboardIcon />,
      name: "Dashboard", 
      path: "/dashboard",
    },
    {
      icon: <TicketsIcon />,
      name: "Tickets",
      path: "/tickets",
    },
  ];

  // New Ticket - only for USER role
  if (role === "USER") {
    items.push({
      icon: <NewTicketIcon />,
      name: "New Ticket",
      path: "/tickets/new",
    });
  }

  // Admin-only features
  if (role === "ADMIN") {
    items.push(
      {
        icon: <UsersIcon />,
        name: "Users", 
        path: "/support/users",
      },
      {
        icon: <CreateUserIcon />,
        name: "Create User",
        path: "/support/users/new",
      }
    );
  }

  return items;
};

export const EnhancedSidebar: React.FC = () => {
  const { user } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  if (!user) {
    return null;
  }

  const navItems = getNavItemsForRole(user.role);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Ticket System
            </h1>
          ) : (
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">TS</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Content */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {/* Main Menu */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontalDotsIcon />
                )}
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav) => (
                  <li key={nav.name}>
                    <Link
                      href={nav.path}
                      className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${
                        isActive(nav.path)
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/[0.12] dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100 group-hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300"
                      }`}
                    >
                      <span
                        className={`${
                          isActive(nav.path)
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                        }`}
                      >
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="font-medium">{nav.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};
