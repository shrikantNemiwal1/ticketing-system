"use client";

import React, { useState } from "react";
import {
  TailAdminTable,
  TailAdminTableHeader,
  TailAdminTableRow,
  TailAdminTableCell,
  Button,
} from "@/components/ui";
import { Ticket, AssignableAgent, User } from "@/types";
import {
  getPriorityColor,
  getStatusColor,
  getTicketCreationDate,
} from "@/utils";
import Link from "next/link";

interface SupportTicketsClientProps {
  user: User;
  initialTickets: Ticket[];
  initialAgents: AssignableAgent[];
  error: string | null;
}

export function SupportTicketsClient({
  user,
  initialTickets,
  initialAgents,
  error,
}: SupportTicketsClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [agents] = useState<AssignableAgent[]>(initialAgents);
  const [assigningTickets, setAssigningTickets] = useState<
    Set<string | number>
  >(new Set());

  const handleAssignTicket = async (
    ticketId: string | number,
    assignedToId: string
  ) => {
    if (assigningTickets.has(ticketId)) return;

    try {
      setAssigningTickets((prev) => new Set(prev.add(ticketId)));

      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: Number(assignedToId) }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign ticket");
      }

      // Update local state
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                assignedTo: agents.find(
                  (agent) => agent.id === Number(assignedToId)
                ) as User,
                status: "IN_PROGRESS" as const,
              }
            : ticket
        )
      );
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      alert("Failed to assign ticket. Please try again.");
    } finally {
      setAssigningTickets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  if (error) {
    return (
      <div className="p-3 sm:p-6">
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">
            Error loading tickets: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {user.role === "ADMIN" ? "Admin" : "Support"} - Tickets Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage and assign tickets to support agents
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-6 text-center">
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
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No tickets found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No tickets are currently available for management.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TailAdminTable className="w-full min-w-[800px]">
              <TailAdminTableHeader>
                <TailAdminTableRow>
                  <TailAdminTableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Ticket
                  </TailAdminTableCell>
                  <TailAdminTableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </TailAdminTableCell>
                  <TailAdminTableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Priority
                  </TailAdminTableCell>
                  <TailAdminTableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Created
                  </TailAdminTableCell>
                  <TailAdminTableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Assigned To
                  </TailAdminTableCell>
                  <TailAdminTableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </TailAdminTableCell>
                </TailAdminTableRow>
              </TailAdminTableHeader>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <TailAdminTableRow key={ticket.id}>
                    <TailAdminTableCell className="px-4 py-4">
                      <div>
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          #{ticket.id} - {ticket.title}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {ticket.description?.slice(0, 60)}...
                        </p>
                      </div>
                    </TailAdminTableCell>
                    <TailAdminTableCell className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status === "IN_PROGRESS"
                          ? "In Progress"
                          : ticket.status}
                      </span>
                    </TailAdminTableCell>
                    <TailAdminTableCell className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </TailAdminTableCell>
                    <TailAdminTableCell className="px-4 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(
                          getTicketCreationDate(ticket)
                        ).toLocaleDateString()}
                      </span>
                    </TailAdminTableCell>
                    <TailAdminTableCell className="px-4 py-4">
                      {ticket.status === "NEW" ? (
                        <select
                          onChange={(e) =>
                            handleAssignTicket(ticket.id, e.target.value)
                          }
                          value=""
                          disabled={assigningTickets.has(ticket.id)}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="" disabled>
                            {assigningTickets.has(ticket.id)
                              ? "Assigning..."
                              : "Select Agent"}
                          </option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.email}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {ticket.assignedTo?.email || "Unassigned"}
                        </span>
                      )}
                    </TailAdminTableCell>
                    <TailAdminTableCell className="px-4 py-4">
                      <Link href={`/tickets/${ticket.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TailAdminTableCell>
                  </TailAdminTableRow>
                ))}
              </tbody>
            </TailAdminTable>
          </div>
        )}
      </div>
    </div>
  );
}
