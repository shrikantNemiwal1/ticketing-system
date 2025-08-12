"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  TailAdminTable,
  TailAdminTableHeader,
  TailAdminTableBody,
  TailAdminTableRow,
  TailAdminTableCell,
} from "@/components/ui/tables/TailAdminTable";
import TailAdminBadge from "@/components/ui/TailAdminBadge";
import { Ticket, User } from "@/types";
import { formatRelativeTime, getTicketCreationDate } from "@/utils";

interface TicketsClientProps {
  tickets: Ticket[];
  user: User;
}

/**
 * Client Component for Interactive Tickets Table
 * Handles navigation and click events
 */
export default function TicketsClient({ tickets, user }: TicketsClientProps) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] max-w-full mx-1 sm:mx-0">
      {tickets.length === 0 ? (
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
      ) : (
        <div className="w-full overflow-x-auto table-scroll">
          <TailAdminTable className="w-full min-w-[800px]">
            {/* Table Header */}
            <TailAdminTableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TailAdminTableRow>
                <TailAdminTableCell
                  isHeader
                  className="pl-6 pr-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[60px] min-w-[60px]"
                >
                  ID
                </TailAdminTableCell>
                <TailAdminTableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[250px] min-w-[200px]"
                >
                  Subject
                </TailAdminTableCell>
                <TailAdminTableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[100px] min-w-[90px]"
                >
                  Status
                </TailAdminTableCell>
                <TailAdminTableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[100px] min-w-[90px]"
                >
                  Priority
                </TailAdminTableCell>
                <TailAdminTableCell
                  isHeader
                  className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[160px] min-w-[140px]"
                >
                  Created By
                </TailAdminTableCell>
                {user?.role !== "USER" && (
                  <TailAdminTableCell
                    isHeader
                    className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[120px] min-w-[100px]"
                  >
                    Assigned To
                  </TailAdminTableCell>
                )}
                <TailAdminTableCell
                  isHeader
                  className="pl-3 pr-6 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[110px] min-w-[100px]"
                >
                  Created
                </TailAdminTableCell>
              </TailAdminTableRow>
            </TailAdminTableHeader>

            {/* Table Body */}
            <TailAdminTableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {tickets.map((ticket) => (
                <TailAdminTableRow
                  key={ticket.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  <TailAdminTableCell className="pl-6 pr-3 py-4 text-start w-[60px] min-w-[60px]">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      #{ticket.id}
                    </span>
                  </TailAdminTableCell>

                  <TailAdminTableCell className="px-3 py-4 text-start w-[250px] min-w-[200px]">
                    <div className="max-w-[230px]">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                        {ticket.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {ticket.description}
                      </p>
                    </div>
                  </TailAdminTableCell>

                  <TailAdminTableCell className="px-3 py-4 text-start w-[100px] min-w-[90px]">
                    <TailAdminBadge
                      size="sm"
                      color={
                        ticket.status === "RESOLVED" ||
                        ticket.status === "CLOSED"
                          ? "success"
                          : ticket.status === "IN_PROGRESS"
                          ? "warning"
                          : ticket.status === "NEW"
                          ? "primary"
                          : "light"
                      }
                    >
                      {ticket.status.replace("_", " ")}
                    </TailAdminBadge>
                  </TailAdminTableCell>

                  <TailAdminTableCell className="px-3 py-4 text-start w-[100px] min-w-[90px]">
                    <TailAdminBadge
                      size="sm"
                      color={
                        ticket.priority === "HIGH"
                          ? "error"
                          : ticket.priority === "MEDIUM"
                          ? "warning"
                          : ticket.priority === "LOW"
                          ? "primary"
                          : "light"
                      }
                    >
                      {ticket.priority}
                    </TailAdminBadge>
                  </TailAdminTableCell>

                  <TailAdminTableCell className="px-3 py-4 text-start w-[160px] min-w-[140px]">
                    <div className="max-w-[140px]">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                        {ticket.createdBy?.email || "Unknown"}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400 truncate">
                        {ticket.createdBy?.email || "No email"}
                      </span>
                    </div>
                  </TailAdminTableCell>

                  {user?.role !== "USER" && (
                    <TailAdminTableCell className="px-3 py-4 text-start w-[120px] min-w-[100px]">
                      <div className="max-w-[100px]">
                        {ticket.assignedTo ? (
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate block">
                            {ticket.assignedTo?.email || "Unknown"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </TailAdminTableCell>
                  )}

                  <TailAdminTableCell className="pl-3 pr-6 py-4 text-gray-500 text-theme-sm dark:text-gray-400 w-[110px] min-w-[100px]">
                    <span className="text-xs sm:text-sm">
                      {formatRelativeTime(getTicketCreationDate(ticket))}
                    </span>
                  </TailAdminTableCell>
                </TailAdminTableRow>
              ))}
            </TailAdminTableBody>
          </TailAdminTable>
        </div>
      )}
    </div>
  );
}
