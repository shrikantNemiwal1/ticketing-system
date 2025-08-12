import { NextRequest, NextResponse } from "next/server";
import { LoginRequest } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginRequest = await request.json();

    // Forward login request to Spring Boot backend
    const response = await fetch(`${API_BASE_URL}/user/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || "Authentication failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Create response with authentication data
    const authResponse = NextResponse.json({
      userId: data.userId,
      email: data.email,
      authorities: data.authorities,
    });

    // Set HTTP-only cookies for JWT token and user data
    if (data.token) {
      authResponse.cookies.set("jwt_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
    }

    // Set user data cookie (not HTTP-only so client can read it)
    const userData = {
      id: data.userId.toString(),
      email: data.email,
      role: data.authorities[0],
    };

    authResponse.cookies.set("user_data", JSON.stringify(userData), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return authResponse;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
