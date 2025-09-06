// User logout endpoint
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    })

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
