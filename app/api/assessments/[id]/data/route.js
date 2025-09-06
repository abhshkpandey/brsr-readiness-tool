// Assessment data endpoint for retrieving all responses
import { NextResponse } from "next/server"
const AuthService = require("../../../../../lib/auth")
const Assessment = require("../../../../../models/Assessment")
const AssessmentResponse = require("../../../../../models/AssessmentResponse")

export async function GET(request, { params }) {
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
    const { id } = params

    // Verify assessment ownership
    const assessment = await Assessment.findById(id)
    if (!assessment || assessment.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Assessment not found or access denied",
        },
        { status: 404 },
      )
    }

    // Get all responses
    const responses = await AssessmentResponse.findByAssessmentId(id)

    // Group by section for easier frontend consumption
    const responsesBySection = {}
    responses.forEach((response) => {
      if (!responsesBySection[response.section_key]) {
        responsesBySection[response.section_key] = {}
      }

      // Convert response value based on type
      let value = response.response_value
      if (response.response_type === "number") {
        value = Number.parseFloat(value)
      } else if (response.response_type === "boolean") {
        value = value === "true"
      }

      responsesBySection[response.section_key][response.question_id] = value
    })

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: id,
        responses: responsesBySection,
        totalResponses: responses.length,
      },
    })
  } catch (error) {
    console.error("[v0] Get assessment data error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve assessment data",
      },
      { status: 500 },
    )
  }
}
