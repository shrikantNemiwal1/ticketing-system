import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ServerAPI, isJwtExpiredError } from "@/lib/server-api";
import TicketDetailClient from "./TicketDetailClient";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;
  const userDataCookie = cookieStore.get("user_data")?.value;

  if (!token || !userDataCookie) {
    redirect("/login");
  }

  const user = JSON.parse(userDataCookie);
  const { id: ticketId } = await params;

  try {
    // Fetch ticket data, comments, and assignable agents in parallel
    const [ticket, comments, assignableAgents] = await Promise.all([
      ServerAPI.getTicketById(ticketId),
      ServerAPI.getTicketComments(ticketId),
      // Only fetch assignable agents if user has permission
      user?.role === "SUPPORT_AGENT" || user?.role === "ADMIN"
        ? ServerAPI.getAssignableAgents()
        : Promise.resolve([]),
    ]);

    return (
      <TicketDetailClient
        initialTicket={ticket}
        initialComments={comments}
        initialAssignableAgents={assignableAgents}
        user={user}
      />
    );
  } catch (error) {
    console.error("Failed to fetch ticket data:", error);
    if (isJwtExpiredError(error)) {
      redirect("/login");
    }
    redirect("/tickets");
  }
}
