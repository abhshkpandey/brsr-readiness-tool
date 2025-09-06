import { NextResponse } from "next/server"
const AuthService = require("../../../lib/auth")
const Assessment = require("../../../models/Assessment")
const AssessmentResponse = require("../../../models/AssessmentResponse")
const SectionScore = require("../../../models/SectionScore")
const Report = require("../../../models/Report")
const ReportService = require("../../../services/reportService")
const ScoringService = require("../../../services/scoringService")

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
    const body = await request.json()
    const {
      assessmentId,
      format = "pdf",
      includeCharts = true,
      includeRecommendations = true,
      includeRawData = false,
    } = body

    console.log("[v0] Report generation requested:", {
      userId: user.id,
      assessmentId,
      format,
      options: { includeCharts, includeRecommendations, includeRawData },
    })

    // Verify assessment ownership
    const assessment = await Assessment.findById(assessmentId)
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
    const responses = await AssessmentResponse.findByAssessmentId(assessmentId)
    const sectionScores = await SectionScore.findByAssessmentId(assessmentId)

    // Group responses by section
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

    // Generate insights
    const insights = ScoringService.generateInsights(sectionScores, responses)

    // Generate report
    const reportService = new ReportService()
    const reportResult = await reportService.generateReport(assessment, responsesBySection, sectionScores, insights, {
      format,
      includeCharts,
      includeRecommendations,
      includeRawData,
    })

    // Save report record to database
    const reportRecord = await Report.create(assessmentId, format, reportResult.filePath, reportResult.fileSize)

    console.log("[v0] Report generated successfully:", {
      reportId: reportRecord.id,
      fileName: reportResult.fileName,
      fileSize: reportResult.fileSize,
    })

    return NextResponse.json({
      success: true,
      message: "Report generated successfully",
      data: {
        reportId: reportRecord.id,
        fileName: reportResult.fileName,
        downloadUrl: reportResult.downloadUrl,
        fileSize: reportResult.fileSize,
        format: format,
        generatedAt: reportRecord.generated_at,
        expiresAt: reportRecord.expires_at,
      },
    })
  } catch (error) {
    console.error("[v0] Report generation failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate report",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
