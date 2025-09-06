// Assessment management endpoints
import { NextResponse } from "next/server"
const AuthService = require("../../../lib/auth")
const Assessment = require("../../../models/Assessment")
const SectionScore = require("../../../models/SectionScore")

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization")
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    const user = await AuthService.getUserFromToken(token)

    // Get user's assessments
    const assessments = await Assessment.findByUserId(user.id)

    // Get section scores for each assessment
    const assessmentsWithScores = await Promise.all(
      assessments.map(async (assessment) => {
        const sectionScores = await SectionScore.findByAssessmentId(assessment.id)
        return {
          ...assessment,
          sectionScores,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: {
        assessments: assessmentsWithScores,
      },
    })
  } catch (error) {
    console.error("[v0] Get assessments error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve assessments",
      },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization")
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    const user = await AuthService.getUserFromToken(token)
    const { title, reportingPeriod } = await request.json()

    // Create new assessment
    const assessment = await Assessment.create(user.id, { title, reportingPeriod })

    return NextResponse.json(
      {
        success: true,
        message: "Assessment created successfully",
        data: {
          assessment,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create assessment error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create assessment",
      },
      { status: 500 },
    )
  }
}
