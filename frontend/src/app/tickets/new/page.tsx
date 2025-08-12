import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import NewTicketClient from "./NewTicketClient";

export default async function NewTicketPage() {
  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;
  const userDataCookie = cookieStore.get("user_data")?.value;

  if (!token || !userDataCookie) {
    redirect("/login");
  }

  const user = JSON.parse(userDataCookie);

  return <NewTicketClient user={user} />;
}
