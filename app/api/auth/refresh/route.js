// Token refresh endpoint
import { NextResponse } from "next/server"
const AuthService = require("../../../../lib/auth")
const User = require("../../../../models/User")

export async function POST(request) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token not found",
        },
        { status: 401 },
      )
    }

    // Verify refresh token
    const decoded = AuthService.verifyToken(refreshToken)
    if (decoded.type !== "refresh") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token type",
        },
        { status: 401 },
      )
    }

    // Get user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 401 },
      )
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = AuthService.generateTokens(user.id)

    // Set new refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
      },
    })

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    return response
  } catch (error) {
    console.error("[v0] Token refresh error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired refresh token",
      },
      { status: 401 },
    )
  }
}
