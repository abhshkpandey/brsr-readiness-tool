// Analytics endpoint for detailed assessment insights
import { NextResponse } from "next/server"
const AuthService = require("../../../../lib/auth")
const Assessment = require("../../../../models/Assessment")
const AssessmentResponse = require("../../../../models/AssessmentResponse")
const SectionScore = require("../../../../models/SectionScore")
const ScoringService = require("../../../../services/scoringService")

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

    // Get assessment data
    const responses = await AssessmentResponse.findByAssessmentId(id)
    const sectionScores = await SectionScore.findByAssessmentId(id)

    // Generate insights
    const insights = ScoringService.generateInsights(sectionScores, responses)

    // Calculate trend data (mock for now - would need historical data)
    const trendData = {
      overallScore: [
        { month: "Jan", score: 65 },
        { month: "Feb", score: 68 },
        { month: "Mar", score: 72 },
        { month: "Apr", score: Number.parseFloat(assessment.overall_score) || 75 },
      ],
      sectionTrends: sectionScores.map((section) => ({
        section: section.section_key,
        trend: "improving", // Would calculate from historical data
        change: "+5.2%",
      })),
    }

    // Industry benchmarking
    const benchmarkData = {}
    sectionScores.forEach((section) => {
      benchmarkData[section.section_key] = {
        yourScore: Number.parseFloat(section.score),
        industryAverage: 75,
        topQuartile: 85,
        performance:
          Number.parseFloat(section.score) >= 85
            ? "Top Quartile"
            : Number.parseFloat(section.score) >= 75
              ? "Above Average"
              : Number.parseFloat(section.score) >= 60
                ? "Average"
                : "Below Average",
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          overallScore: Number.parseFloat(assessment.overall_score),
          completionPercentage: Number.parseFloat(assessment.completion_percentage),
          status: assessment.status,
        },
        sectionScores: sectionScores.map((section) => ({
          sectionKey: section.section_key,
          title: section.section_title,
          score: Number.parseFloat(section.score),
          completionPercentage: Number.parseFloat(section.completion_percentage),
          isComplete: section.is_complete,
        })),
        insights,
        trends: trendData,
        benchmarks: benchmarkData,
        totalResponses: responses.length,
      },
    })
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate analytics",
      },
      { status: 500 },
    )
  }
}
