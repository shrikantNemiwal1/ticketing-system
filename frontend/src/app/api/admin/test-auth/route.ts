import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;
    const userData = cookieStore.get("user_data")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "No JWT token found",
          hasToken: false,
          hasUserData: !!userData,
          allCookies: Object.fromEntries(
            cookieStore
              .getAll()
              .map((c) => [c.name, `${c.value.substring(0, 20)}...`])
          ),
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseText = await response.text();

    return NextResponse.json({
      hasToken: true,
      hasUserData: !!userData,
      tokenLength: token.length,
      backendResponse: {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        body: responseText.substring(0, 200),
      },
      apiBaseUrl: API_BASE_URL,
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
