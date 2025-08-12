"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { User } from "@/types";
import { getRoleText, getRoleColor } from "@/utils";
import Link from "next/link";

interface UsersManagementClientProps {
  user: User;
  initialUsers: User[];
  error: string | null;
}

export function UsersManagementClient({
  user,
  initialUsers,
  error,
}: UsersManagementClientProps) {
  // Ensure initialUsers is always an array
  const safeInitialUsers = Array.isArray(initialUsers) ? initialUsers : [];

  const [users, setUsers] = useState<User[]>(safeInitialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(safeInitialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<string | number | null>(
    null
  );

  const applyFilters = useCallback(() => {
    let filtered = [...users];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          String(u.id).toLowerCase().includes(search)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleDeleteUser = async (userId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setDeleteLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove user from local state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (error) {
    return (
      <div className="p-3 sm:p-6">
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">
            Error loading users: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage system users and their roles
          </p>
        </div>
        {user.role === "ADMIN" && (
          <div className="mt-4 sm:mt-0">
            <Link href="/support/users/new">
              <Button variant="primary">Create New User</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="SUPPORT_AGENT">Support Agent</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("");
              }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {filteredUsers.length === 0 ? (
          <div className="p-5 text-center md:p-6">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || roleFilter
                ? "Try adjusting your search or filter criteria."
                : "No users found in the system."}
            </p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-800/50">
                <div className="px-5 py-3 md:px-6">
                  <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    User
                  </h5>
                </div>
                <div className="px-5 py-3 text-center md:px-6">
                  <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Role
                  </h5>
                </div>
                <div className="px-5 py-3 text-center md:px-6">
                  <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Created
                  </h5>
                </div>
                {user.role === "ADMIN" && (
                  <div className="px-5 py-3 text-center md:px-6">
                    <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Actions
                    </h5>
                  </div>
                )}
              </div>

              {filteredUsers.map((targetUser, key) => (
                <div
                  className={`grid grid-cols-4 ${
                    key === filteredUsers.length - 1
                      ? ""
                      : "border-b border-gray-100 dark:border-white/[0.05]"
                  }`}
                  key={targetUser.id}
                >
                  <div className="flex items-center gap-3 px-5 py-4 md:px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {targetUser.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {targetUser.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {targetUser.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center px-5 py-4 md:px-6">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleColor(
                        targetUser.role
                      )}`}
                    >
                      {getRoleText(targetUser.role)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center px-5 py-4 md:px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {targetUser.createdAt
                        ? new Date(targetUser.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>

                  {user.role === "ADMIN" && (
                    <div className="flex items-center justify-center px-5 py-4 md:px-6">
                      {targetUser.id !== user.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(targetUser.id)}
                          disabled={deleteLoading === targetUser.id}
                        >
                          {deleteLoading === targetUser.id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
