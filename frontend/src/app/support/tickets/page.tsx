import React from "react";
import { redirect } from "next/navigation";
import {
  ServerAPI,
  getServerSideUser,
  isJwtExpiredError,
} from "@/lib/server-api";
import { Ticket, AssignableAgent } from "@/types";
import { SupportTicketsClient } from "./SupportTicketsClient";

export const dynamic = "force-dynamic";

export default async function SupportTicketsPage() {
  // Check authentication and permissions
  const user = await getServerSideUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPPORT_AGENT") {
    redirect("/dashboard");
  }

  let tickets: Ticket[] = [];
  let agents: AssignableAgent[] = [];
  let error: string | null = null;

  try {
    // Fetch both tickets and agents in parallel
    const [ticketsData, agentsData] = await Promise.all([
      ServerAPI.getTickets(),
      ServerAPI.getAssignableAgents(),
    ]);

    tickets = ticketsData || [];
    agents = agentsData || [];
  } catch (err) {
    console.error("Failed to fetch data:", err);
    if (isJwtExpiredError(err)) {
      redirect("/login");
    }
    error = err instanceof Error ? err.message : "Failed to fetch data";
  }

  return (
    <SupportTicketsClient
      user={user}
      initialTickets={tickets}
      initialAgents={agents}
      error={error}
    />
  );
}
