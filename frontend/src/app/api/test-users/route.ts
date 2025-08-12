import { NextResponse } from "next/server";
import { ServerAPI } from "@/lib/server-api";

export async function GET() {
  try {
    const users = await ServerAPI.getAllUsers();

    return NextResponse.json({
      success: true,
      users,
      type: typeof users,
      isArray: Array.isArray(users),
      length: Array.isArray(users) ? users.length : "N/A",
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        type: typeof error,
      },
      { status: 500 }
    );
  }
}
