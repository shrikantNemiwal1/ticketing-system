import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ServerAPI, isJwtExpiredError } from "@/lib/server-api";
import { Ticket } from "@/types";

/**
 * Server Component Dashboard Page
 * Fetches data server-side and renders complete dashboard with TailAdmin styling
 */
export default async function DashboardPage() {
  // Check authentication server-side
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("user_data")?.value;
  const jwtToken = cookieStore.get("jwt_token")?.value;

  if (!userDataCookie || !jwtToken) {
    redirect("/login");
  }

  try {
    JSON.parse(decodeURIComponent(userDataCookie));
  } catch {
    redirect("/login");
  }

  // Fetch dashboard data server-side
  let tickets: Ticket[] = [];
  let error: string | null = null;

  try {
    // Get recent tickets for dashboard (fetch first 10 tickets sorted by creation date)
    const response = await ServerAPI.getTickets({
      page: 0,
      size: 10,
      sortBy: "creationDate",
      sortDir: "desc",
    });

    // Handle both old array format and new paginated format
    if (Array.isArray(response)) {
      tickets = response;
    } else if (response && response.tickets) {
      tickets = response.tickets;
    } else {
      tickets = [];
    }
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    if (isJwtExpiredError(err)) {
      redirect("/login");
    }
    error =
      err instanceof Error ? err.message : "Failed to load dashboard data";
  }

  // Calculate stats from tickets
  const stats = {
    total: tickets.length,
    open: tickets.filter(
      (t: Ticket) => t.status === "NEW" || t.status === "IN_PROGRESS"
    ).length,
    inProgress: tickets.filter((t: Ticket) => t.status === "IN_PROGRESS")
      .length,
    closed: tickets.filter(
      (t: Ticket) => t.status === "CLOSED" || t.status === "RESOLVED"
    ).length,
  };

  // Get recent tickets (last 5)
  const recentTickets = tickets
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Error Display */}
      {error && (
        <div className="col-span-12">
          <div className="rounded-2xl border border-error-200 bg-error-50 p-5 dark:border-error-500/20 dark:bg-error-500/10 md:p-6">
            <p className="text-error-600 dark:text-error-400">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="col-span-6 lg:col-span-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <svg
              className="h-5 w-5 text-gray-800 dark:text-white/90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total Tickets
              </span>
              <h4 className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.total}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/15">
            <svg
              className="h-5 w-5 text-orange-500 dark:text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Open Tickets
              </span>
              <h4 className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.open}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/15">
            <svg
              className="h-5 w-5 text-warning-500 dark:text-warning-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                In Progress
              </span>
              <h4 className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.inProgress}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-6 lg:col-span-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/15">
            <svg
              className="h-5 w-5 text-success-500 dark:text-success-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Resolved
              </span>
              <h4 className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
                {stats.closed}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="col-span-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 p-5 dark:border-white/[0.05] md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Tickets
            </h3>
          </div>

          <div className="max-w-full overflow-x-auto">
            {recentTickets.length === 0 ? (
              <div className="p-5 text-center md:p-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No tickets found.
                </p>
              </div>
            ) : (
              <div className="min-w-[800px]">
                <div className="grid grid-cols-5 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-800/50">
                  <div className="px-5 py-3 md:px-6">
                    <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Ticket
                    </h5>
                  </div>
                  <div className="px-5 py-3 text-center md:px-6">
                    <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Status
                    </h5>
                  </div>
                  <div className="px-5 py-3 text-center md:px-6">
                    <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Priority
                    </h5>
                  </div>
                  <div className="px-5 py-3 text-center md:px-6">
                    <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Created
                    </h5>
                  </div>
                  <div className="px-5 py-3 text-center md:px-6">
                    <h5 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Created By
                    </h5>
                  </div>
                </div>

                {recentTickets.map((ticket, key) => (
                  <div
                    className={`grid grid-cols-5 ${
                      key === recentTickets.length - 1
                        ? ""
                        : "border-b border-gray-100 dark:border-white/[0.05]"
                    }`}
                    key={ticket.id}
                  >
                    <div className="flex items-center gap-3 px-5 py-4 md:px-6">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          #{ticket.id} - {ticket.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center px-5 py-4 md:px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ticket.status === "NEW"
                            ? "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                            : ticket.status === "IN_PROGRESS"
                            ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                            : ticket.status === "RESOLVED"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80"
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-center px-5 py-4 md:px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ticket.priority === "HIGH"
                            ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                            : ticket.priority === "MEDIUM"
                            ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
                            : "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-center px-5 py-4 md:px-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>

                    <div className="flex items-center justify-center px-5 py-4 md:px-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.createdBy?.email || "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
