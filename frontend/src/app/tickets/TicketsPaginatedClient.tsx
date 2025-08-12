"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  TailAdminTable,
  TailAdminTableHeader,
  TailAdminTableBody,
  TailAdminTableRow,
  TailAdminTableCell,
} from "@/components/ui/tables/TailAdminTable";
import TailAdminBadge from "@/components/ui/TailAdminBadge";
import Pagination from "@/components/ui/Pagination";
import { PaginatedTicketsResponse, User } from "@/types";
import { formatRelativeTime, getTicketCreationDate } from "@/utils";

interface TicketsPaginatedClientProps {
  paginatedResponse: PaginatedTicketsResponse | null;
  user: User;
  currentParams: {
    page: number;
    size: number;
    sortBy: string;
    sortDir: string;
    search?: string;
    status?: string;
    priority?: string;
  };
}

/**
 * Client Component for Interactive Paginated Tickets Table
 * Handles navigation, click events, and pagination
 */
export default function TicketsPaginatedClient({
  paginatedResponse,
  user,
  currentParams,
}: TicketsPaginatedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/tickets?${params.toString()}`);
  };

  const applyAndResetPage = (params: URLSearchParams) => {
    params.set("page", "0");
    router.push(`/tickets?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    applyAndResetPage(params);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    applyAndResetPage(params);
  };

  const handlePriorityChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("priority", value);
    } else {
      params.delete("priority");
    }
    applyAndResetPage(params);
  };

  const handleSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = params.get("sortBy");
    const currentSortDir = params.get("sortDir") || "desc";

    // If clicking the same column, toggle direction
    if (currentSortBy === sortBy) {
      params.set("sortDir", currentSortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortDir", "desc");
    }

    params.set("page", "0"); // Reset to first page when sorting
    router.push(`/tickets?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (currentParams.sortBy !== column) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return currentParams.sortDir === "asc" ? (
      <svg
        className="w-4 h-4 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  if (
    !paginatedResponse ||
    !paginatedResponse.tickets ||
    paginatedResponse.tickets.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] max-w-full mx-1 sm:mx-0">
        <div className="text-center py-12 px-4">
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
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No tickets found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.role === "USER"
              ? "You haven't created any tickets yet."
              : user?.role === "SUPPORT_AGENT"
              ? "No tickets found in the system."
              : "No tickets match your current filters."}
          </p>
          {user?.role === "USER" && (
            <div className="mt-6">
              <Link href="/tickets/new">
                <Button>Create your first ticket</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { tickets, currentPage, totalPages, totalItems, size } =
    paginatedResponse;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] max-w-full mx-1 sm:mx-0">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-1">
            Search
          </label>
          <input
            type="text"
            value={currentParams.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search title or description..."
            className="w-full rounded-md border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-1">
            Status
          </label>
          <select
            value={currentParams.status || ""}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-md border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
        <div>
          <label className="block text-theme-xs text-gray-500 dark:text-gray-400 mb-1">
            Priority
          </label>
          <select
            value={currentParams.priority || ""}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full rounded-md border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>
      <div className="w-full overflow-x-auto table-scroll">
        <TailAdminTable className="w-full min-w-[800px]">
          {/* Table Header */}
          <TailAdminTableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TailAdminTableRow>
              <TailAdminTableCell
                isHeader
                className="pl-6 pr-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[60px] min-w-[60px]"
              >
                <button
                  onClick={() => handleSortChange("id")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>ID</span>
                  {getSortIcon("id")}
                </button>
              </TailAdminTableCell>
              <TailAdminTableCell
                isHeader
                className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[250px] min-w-[200px]"
              >
                <button
                  onClick={() => handleSortChange("title")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>Subject</span>
                  {getSortIcon("title")}
                </button>
              </TailAdminTableCell>
              <TailAdminTableCell
                isHeader
                className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[100px] min-w-[90px]"
              >
                <button
                  onClick={() => handleSortChange("status")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>Status</span>
                  {getSortIcon("status")}
                </button>
              </TailAdminTableCell>
              <TailAdminTableCell
                isHeader
                className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[100px] min-w-[90px]"
              >
                <button
                  onClick={() => handleSortChange("priority")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>Priority</span>
                  {getSortIcon("priority")}
                </button>
              </TailAdminTableCell>
              <TailAdminTableCell
                isHeader
                className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[160px] min-w-[140px]"
              >
                Created By
              </TailAdminTableCell>
              <TailAdminTableCell
                isHeader
                className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[120px] min-w-[100px]"
              >
                <button
                  onClick={() => handleSortChange("creationDate")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <span>Created</span>
                  {getSortIcon("creationDate")}
                </button>
              </TailAdminTableCell>
            </TailAdminTableRow>
          </TailAdminTableHeader>

          {/* Table Body */}
          <TailAdminTableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {tickets.map((ticket) => (
              <TailAdminTableRow
                key={ticket.id}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
                onClick={() => router.push(`/tickets/${ticket.id}`)}
              >
                <TailAdminTableCell className="pl-6 pr-3 py-4 text-start">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    #{ticket.id}
                  </span>
                </TailAdminTableCell>

                <TailAdminTableCell className="px-3 py-4 text-start">
                  <span className="font-medium text-gray-900 dark:text-white/90 block">
                    {ticket.title}
                  </span>
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {ticket.description.length > 60
                      ? `${ticket.description.substring(0, 60)}...`
                      : ticket.description}
                  </span>
                </TailAdminTableCell>

                <TailAdminTableCell className="px-3 py-4 text-start">
                  <TailAdminBadge
                    size="sm"
                    color={
                      ticket.status === "NEW"
                        ? "warning"
                        : ticket.status === "IN_PROGRESS"
                        ? "info"
                        : ticket.status === "RESOLVED"
                        ? "success"
                        : "light"
                    }
                  >
                    {ticket.status.replace("_", " ")}
                  </TailAdminBadge>
                </TailAdminTableCell>

                <TailAdminTableCell className="px-3 py-4 text-start">
                  <TailAdminBadge
                    size="sm"
                    color={
                      ticket.priority === "HIGH"
                        ? "error"
                        : ticket.priority === "MEDIUM"
                        ? "warning"
                        : "success"
                    }
                  >
                    {ticket.priority}
                  </TailAdminBadge>
                </TailAdminTableCell>

                <TailAdminTableCell className="px-3 py-4 text-start">
                  <span className="text-theme-sm text-gray-900 dark:text-gray-100">
                    {ticket.createdBy?.email || "Unknown"}
                  </span>
                </TailAdminTableCell>

                <TailAdminTableCell className="px-3 py-4 text-start">
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(getTicketCreationDate(ticket))}
                  </span>
                </TailAdminTableCell>
              </TailAdminTableRow>
            ))}
          </TailAdminTableBody>
        </TailAdminTable>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={size}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
