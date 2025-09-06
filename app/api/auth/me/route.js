// Get current user profile endpoint
import { NextResponse } from "next/server"
const AuthService = require("../../../../lib/auth")

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Access token required",
        },
        { status: 401 },
      )
    }

    const user = await AuthService.getUserFromToken(token)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
          industry: user.industry,
          companySize: user.company_size,
          createdAt: user.created_at,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Get user profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token",
      },
      { status: 401 },
    )
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Access token required",
        },
        { status: 401 },
      )
    }

    const user = await AuthService.getUserFromToken(token)
    const { companyName, industry, companySize } = await request.json()

    const User = require("../../../../models/User")
    const updatedUser = await User.updateProfile(user.id, {
      companyName,
      industry,
      companySize,
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          companyName: updatedUser.company_name,
          industry: updatedUser.industry,
          companySize: updatedUser.company_size,
          updatedAt: updatedUser.updated_at,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
      },
      { status: 500 },
    )
  }
}
