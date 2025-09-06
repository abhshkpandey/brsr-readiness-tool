// Individual assessment endpoints
import { NextResponse } from "next/server"
const AuthService = require("../../../../lib/auth")
const Assessment = require("../../../../models/Assessment")
const AssessmentResponse = require("../../../../models/AssessmentResponse")
const SectionScore = require("../../../../models/SectionScore")

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

    // Get assessment
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

    // Get responses and section scores
    const responses = await AssessmentResponse.findByAssessmentId(id)
    const sectionScores = await SectionScore.findByAssessmentId(id)

    // Group responses by section
    const responsesBySection = {}
    responses.forEach((response) => {
      if (!responsesBySection[response.section_key]) {
        responsesBySection[response.section_key] = {}
      }
      responsesBySection[response.section_key][response.question_id] = {
        value: response.response_value,
        type: response.response_type,
        unit: response.unit,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        responses: responsesBySection,
        sectionScores,
      },
    })
  } catch (error) {
    console.error("[v0] Get assessment error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve assessment",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request, { params }) {
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
    const { title, reportingPeriod, status } = await request.json()

    // Get assessment
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

    // Update assessment (implement update method in Assessment model)
    // For now, just update status if provided
    let updatedAssessment = assessment
    if (status) {
      updatedAssessment = await Assessment.updateStatus(id, status)
    }

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully",
      data: {
        assessment: updatedAssessment,
      },
    })
  } catch (error) {
    console.error("[v0] Update assessment error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update assessment",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request, { params }) {
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

    // Get assessment
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

    // Delete assessment (cascade will handle related records)
    await Assessment.delete(id)

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete assessment error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete assessment",
      },
      { status: 500 },
    )
  }
}
