import React from "react";
import { redirect } from "next/navigation";
import { getServerSideUser } from "@/lib/server-api";
import { CreateUserClient } from "./CreateUserClient";

export const dynamic = 'force-dynamic';

export default function CreateUserPageWrapper() {
  return <CreateUserPageAsync />;
}

async function CreateUserPageAsync() {
  const user = await getServerSideUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return <CreateUserClient />;
}
