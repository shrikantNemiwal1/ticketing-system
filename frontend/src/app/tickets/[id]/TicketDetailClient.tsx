"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Textarea, Select } from "@/components/ui";
import {
  Ticket,
  TicketComment,
  TicketStatus,
  TicketPriority,
  AssignableAgent,
  User,
} from "@/types";
import {
  getStatusColor,
  getPriorityColor,
  formatDate,
  formatRelativeTime,
  formatDateForBackend,
  canUpdateTicketStatus,
  canAssignTickets,
  canUserComment,
  getTicketCreationDate,
} from "@/utils";

interface TicketDetailClientProps {
  initialTicket: Ticket;
  initialComments: TicketComment[];
  initialAssignableAgents: AssignableAgent[];
  user: User;
}

export default function TicketDetailClient({
  initialTicket,
  initialComments,
  initialAssignableAgents,
  user,
}: TicketDetailClientProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [comments, setComments] = useState<TicketComment[]>(initialComments);
  const [assignableAgents] = useState<AssignableAgent[]>(
    initialAssignableAgents
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!ticket || !user || !canUpdateTicketStatus(user.role)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket status");
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
    } catch (error) {
      console.error("Failed to update ticket status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityUpdate = async (newPriority: TicketPriority) => {
    if (!ticket || !user || !canUpdateTicketStatus(user.role)) return;

    setIsUpdating(true);
    try {
      const creationDate = formatDateForBackend(getTicketCreationDate(ticket));

      const response = await fetch(`/api/tickets/${ticket.id}/info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          creationDate: creationDate,
          category: ticket.category,
          priority: newPriority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket priority");
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
    } catch (error) {
      console.error("Failed to update ticket priority:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignmentUpdate = async (assignedToId: string) => {
    if (!ticket || !user || !canAssignTickets(user.role)) return;
    if (!assignedToId || assignedToId === "") return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assignedToId: Number(assignedToId) }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign ticket");
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
    } catch (error) {
      console.error("Failed to update ticket assignment:", error);
      alert("Failed to assign ticket. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket || !user) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const comment = await response.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Ticket #{ticket.id}
            </h1>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority}
            </Badge>
          </div>
          <h2 className="mt-2 text-base sm:text-lg text-gray-700 dark:text-gray-300">
            {ticket.title}
          </h2>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          ← Back to Tickets
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <Card title="Description">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {ticket.description}
            </div>
          </Card>

          {/* Comments */}
          <Card title={`Comments (${comments.length})`}>
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No comments yet.
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {comment.author?.email?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {comment.author?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                ))
              )}

              {/* Add Comment Form */}
              {user && ticket && canUserComment(user, ticket) && (
                <form
                  onSubmit={handleCommentSubmit}
                  className="border-t border-gray-200 dark:border-gray-700 pt-4"
                >
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    required
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="submit"
                      isLoading={isSubmittingComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card title="Ticket Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created By
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {ticket.createdBy?.email || "Unknown"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created At
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(getTicketCreationDate(ticket))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {ticket.updatedAt
                    ? formatDate(ticket.updatedAt)
                    : "Not updated"}
                </p>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Resolved At
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(ticket.resolvedAt)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          {user && canUpdateTicketStatus(user.role) && (
            <Card title="Actions">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select
                    value={ticket.status}
                    onChange={(e) =>
                      handleStatusUpdate(e.target.value as TicketStatus)
                    }
                    disabled={isUpdating}
                    options={[
                      { value: "OPEN", label: "Open" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "RESOLVED", label: "Resolved" },
                      { value: "CLOSED", label: "Closed" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <Select
                    value={ticket.priority}
                    onChange={(e) =>
                      handlePriorityUpdate(e.target.value as TicketPriority)
                    }
                    disabled={isUpdating}
                    options={[
                      { value: "LOW", label: "Low" },
                      { value: "MEDIUM", label: "Medium" },
                      { value: "HIGH", label: "High" },
                    ]}
                  />
                </div>

                {canAssignTickets(user.role) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assigned To
                    </label>
                    <Select
                      value={ticket.assignedTo?.id || ""}
                      onChange={(e) => handleAssignmentUpdate(e.target.value)}
                      disabled={isUpdating}
                      options={[
                        { value: "", label: "Unassigned" },
                        ...assignableAgents.map((agent) => ({
                          value: String(agent.id),
                          label: agent.email,
                        })),
                      ]}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Assignment Info */}
          {ticket.assignedTo && (
            <Card title="Assignment">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned To
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ticket.assignedTo?.email || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Role: {ticket.assignedTo.role.replace("_", " ")}
                  </p>
                </div>

                {ticket.assignedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assigned At
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(ticket.assignedAt)}
                    </p>
                  </div>
                )}

                {ticket.assignedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assigned By
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {ticket.assignedBy.email || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Role: {ticket.assignedBy.role.replace("_", " ")}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Category */}
          <Card title="Category">
            <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {ticket.category.replace("_", " ")}
            </Badge>
          </Card>
        </div>
      </div>
    </div>
  );
}
