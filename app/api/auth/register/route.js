// User registration endpoint
import { NextResponse } from "next/server"
const User = require("../../../../models/User")
const AuthService = require("../../../../lib/auth")

export async function POST(request) {
  try {
    const { email, password, companyName, industry, companySize } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 409 },
      )
    }

    // Create user
    const user = await User.create({
      email,
      password,
      companyName,
      industry,
      companySize,
    })

    // Generate tokens
    const { accessToken, refreshToken } = AuthService.generateTokens(user.id)

    // Set refresh token as httpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            companyName: user.company_name,
            industry: user.industry,
            companySize: user.company_size,
          },
          accessToken,
        },
      },
      { status: 201 },
    )

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    return response
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
