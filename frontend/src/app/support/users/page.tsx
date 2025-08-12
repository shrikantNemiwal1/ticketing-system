import React from "react";
import { redirect } from "next/navigation";
import {
  ServerAPI,
  getServerSideUser,
  isJwtExpiredError,
} from "@/lib/server-api";
import { User } from "@/types";
import { UsersManagementClient } from "./UsersManagementClient";

export const dynamic = "force-dynamic";

export default async function SupportUsersPage() {
  // Check authentication
  const user = await getServerSideUser();
  if (!user) {
    redirect("/login");
  }

  // Check permissions
  if (user.role !== "ADMIN" && user.role !== "SUPPORT_AGENT") {
    redirect("/dashboard");
  }

  let users: User[] = [];
  let error: string | null = null;

  try {
    const usersData = await ServerAPI.getAllUsers();
    console.log("Server received users data:", usersData);

    if (Array.isArray(usersData)) {
      users = usersData;
    } else if (usersData && typeof usersData === "object") {
      // If the response is wrapped in an object (e.g., { users: [...] })
      users = Array.isArray(usersData.users)
        ? usersData.users
        : Array.isArray(usersData.data)
        ? usersData.data
        : [];
    } else {
      users = [];
      console.warn("Unexpected users data format:", usersData);
    }
  } catch (err) {
    console.error("Failed to fetch users:", err);
    if (isJwtExpiredError(err)) {
      redirect("/login");
    }
    error = err instanceof Error ? err.message : "Failed to fetch users";
    users = []; // Ensure users is always an array
  }

  return (
    <UsersManagementClient user={user} initialUsers={users} error={error} />
  );
}
