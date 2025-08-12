"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TailAdminInput,
  TailAdminTextarea,
  TailAdminSelect,
  TailAdminButton,
  TailAdminFormCard,
} from "@/components/ui/forms";
import { CreateTicketRequest, TicketPriority, User } from "@/types";

interface NewTicketClientProps {
  user: User;
}

export default function NewTicketClient({ user }: NewTicketClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
    status: "NEW",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "priority" ? (value as TicketPriority) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters long";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      const ticket = await response.json();

      if (ticket?.id) {
        console.log("Ticket created successfully:", ticket);
        router.push(`/tickets/${ticket.id}`);
      } else {
        // Ticket created successfully but no data returned
        console.log(
          "Ticket created successfully - redirecting to tickets list"
        );
        router.push("/tickets");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);

      setErrors({
        general: `Failed to create ticket: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Only users can create tickets
  if (!user || user.role !== "USER") {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Access Denied
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Only users can create tickets. Admins and support agents cannot
            create tickets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Create New Ticket
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Submit a new support request. Please provide as much detail as
          possible.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <TailAdminFormCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 dark:bg-red-500/10 dark:border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.general}
                </p>
              </div>
            )}

            <TailAdminInput
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="Brief description of your issue"
              required
              helpText="Provide a clear, concise title"
            />

            <TailAdminTextarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Detailed description of your issue or request..."
              rows={6}
              required
              helpText="Include steps to reproduce the issue, error messages, and any relevant details"
            />

            <TailAdminSelect
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={[
                { value: "LOW", label: "Low - General inquiry or minor issue" },
                {
                  value: "MEDIUM",
                  label: "Medium - Normal issue affecting work",
                },
                {
                  value: "HIGH",
                  label: "High - Important issue blocking work",
                },
              ]}
              helpText="Select the appropriate priority level for your request"
            />

            <div className="flex space-x-4 pt-4">
              <TailAdminButton
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1"
                variant="primary"
              >
                Create Ticket
              </TailAdminButton>

              <TailAdminButton
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </TailAdminButton>
            </div>
          </form>
        </TailAdminFormCard>

        {/* Guidelines */}
        <TailAdminFormCard
          title="Guidelines for Creating Tickets"
          className="mt-6"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Before submitting:
              </h4>
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>Check if a similar issue has already been reported</li>
                <li>Search the knowledge base for existing solutions</li>
                <li>
                  Gather relevant information (error messages, screenshots,
                  etc.)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Priority Guidelines:
              </h4>
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>
                  <strong>Low:</strong> General questions, feature requests,
                  minor cosmetic issues
                </li>
                <li>
                  <strong>Medium:</strong> Standard issues that affect
                  individual users
                </li>
                <li>
                  <strong>High:</strong> Issues that significantly impact
                  productivity or business operations
                </li>
                <li>
                  <strong>Urgent:</strong> Critical system failures, security
                  issues, or issues affecting many users
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                What to include:
              </h4>
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>Clear title that summarizes the issue</li>
                <li>Step-by-step description of what happened</li>
                <li>Expected vs. actual behavior</li>
                <li>Any error messages or screenshots</li>
                <li>Your operating system and browser information</li>
              </ul>
            </div>
          </div>
        </TailAdminFormCard>
      </div>
    </div>
  );
}
