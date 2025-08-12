import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ServerAPI, getServerSideUser } from "@/lib/server-api";
import { Button } from "@/components/ui/Button";
import { PaginatedTicketsResponse } from "@/types";
import TicketsPaginatedClient from "@/app/tickets/TicketsPaginatedClient";

export const dynamic = "force-dynamic";

interface TicketsPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    status?: string;
    priority?: string;
  }>;
}

/**
 * Server Component Tickets Page with Pagination
 * Fetches paginated tickets server-side and renders complete tickets view
 */
export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  // Require authentication server-side
  const user = await getServerSideUser();

  if (!user) {
    redirect("/login");
  }

  // Parse pagination parameters from URL
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "0", 10);
  const size = parseInt(resolvedSearchParams.size || "10", 10);
  const sortBy = resolvedSearchParams.sortBy || "creationDate";
  const sortDir = resolvedSearchParams.sortDir || "desc";
  const search = resolvedSearchParams.search || "";
  const status = resolvedSearchParams.status || undefined;
  const priority = resolvedSearchParams.priority || undefined;

  // Fetch paginated tickets data server-side
  let paginatedResponse: PaginatedTicketsResponse | null = null;
  let error: string | null = null;

  try {
    const response = await ServerAPI.getTickets({
      page,
      size,
      sortBy,
      sortDir,
      search: search || undefined,
      status,
      priority,
    });

    // Ensure we have a proper paginated response structure
    if (response && typeof response === "object" && "tickets" in response) {
      paginatedResponse = response as PaginatedTicketsResponse;
    } else if (Array.isArray(response)) {
      // Handle backwards compatibility if API still returns array
      // Apply client-side pagination to limit display
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedTickets = response.slice(startIndex, endIndex);
      const totalPages = Math.ceil(response.length / size);

      paginatedResponse = {
        tickets: paginatedTickets,
        currentPage: page,
        totalItems: response.length,
        totalPages: totalPages,
        size: size,
        hasNext: page < totalPages - 1,
        hasPrevious: page > 0,
      };
    } else {
      // Fallback for unexpected response
      paginatedResponse = {
        tickets: [],
        currentPage: 0,
        totalItems: 0,
        totalPages: 0,
        size: size,
        hasNext: false,
        hasPrevious: false,
      };
    }
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    if (err instanceof Error && err.message === "JWT_EXPIRED") {
      redirect("/login");
    }
    error = err instanceof Error ? err.message : "Failed to load tickets";
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Tickets Error</h1>
        <p className="mt-2 text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user?.role === "USER" ? "My Tickets" : "All Tickets"}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {user?.role === "USER"
              ? "Track and manage your support requests"
              : user?.role === "ADMIN"
              ? "Manage all tickets in the system with full administrative access"
              : "Manage support tickets in the system"}
          </p>
        </div>
        {user?.role === "USER" && (
          <Link href="/tickets/new">
            <Button>Create New Ticket</Button>
          </Link>
        )}
      </div>

      {/* Pass paginated data to client component */}
      <TicketsPaginatedClient
        paginatedResponse={paginatedResponse}
        user={user}
        currentParams={{
          page,
          size,
          sortBy,
          sortDir,
          search,
          status,
          priority,
        }}
      />
    </div>
  );
}
