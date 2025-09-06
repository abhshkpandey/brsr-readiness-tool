import { NextResponse } from "next/server"
const AuthService = require("../../../lib/auth")
const Assessment = require("../../../models/Assessment")
const AssessmentResponse = require("../../../models/AssessmentResponse")
const SectionScore = require("../../../models/SectionScore")
const ScoringService = require("../../../services/scoringService")
const ValidationService = require("../../../services/validationService")

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
    const { assessmentId, sectionKey, formData, isComplete } = body

    console.log("[v0] Assessment data received:", {
      userId: user.id,
      assessmentId,
      section: sectionKey,
      questionsAnswered: Object.keys(formData).length,
      isComplete,
    })

    // Validation
    const validationErrors = ValidationService.validateSectionData(sectionKey, formData)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors: validationErrors,
          message: "Validation failed",
        },
        { status: 400 },
      )
    }

    // Get or create assessment
    let assessment
    if (assessmentId) {
      assessment = await Assessment.findById(assessmentId)
      if (!assessment || assessment.user_id !== user.id) {
        return NextResponse.json(
          {
            success: false,
            message: "Assessment not found or access denied",
          },
          { status: 404 },
        )
      }
    } else {
      assessment = await Assessment.create(user.id)
    }

    // Save responses
    const savedResponses = []
    for (const [questionId, value] of Object.entries(formData)) {
      if (value !== undefined && value !== null && value !== "") {
        const { responseType, unit } = ValidationService.getQuestionMetadata(questionId)

        const response = await AssessmentResponse.upsert(
          assessment.id,
          questionId,
          sectionKey,
          String(value),
          responseType,
          unit,
        )
        savedResponses.push(response)
      }
    }

    // Calculate section score
    const sectionResponses = await AssessmentResponse.findBySection(assessment.id, sectionKey)
    const sectionMetadata = ScoringService.getSectionMetadata(sectionKey)
    const sectionScore = ScoringService.calculateSectionScore(sectionKey, sectionResponses)

    // Update section score
    await SectionScore.upsert(
      assessment.id,
      sectionKey,
      sectionMetadata.title,
      sectionScore,
      sectionResponses.length,
      sectionMetadata.totalQuestions,
    )

    // Calculate overall assessment score
    const allSectionScores = await SectionScore.findByAssessmentId(assessment.id)
    const overallScore = ScoringService.calculateOverallScore(allSectionScores)
    const completionPercentage = ScoringService.calculateCompletionPercentage(allSectionScores)

    // Update assessment
    await Assessment.updateScores(assessment.id, overallScore, completionPercentage)

    if (isComplete && completionPercentage === 100) {
      await Assessment.updateStatus(assessment.id, "completed")
    } else if (completionPercentage > 0) {
      await Assessment.updateStatus(assessment.id, "in_progress")
    }

    // Prepare section progress for response
    const sectionProgress = {}
    for (const sectionScore of allSectionScores) {
      sectionProgress[sectionScore.section_key] = {
        score: Number.parseFloat(sectionScore.score),
        completed: sectionScore.is_complete,
        completionPercentage: Number.parseFloat(sectionScore.completion_percentage),
      }
    }

    return NextResponse.json({
      success: true,
      message: isComplete ? "Section completed successfully" : "Section saved successfully",
      data: {
        assessmentId: assessment.id,
        sectionScore: Number.parseFloat(sectionScore.toFixed(2)),
        overallScore: Number.parseFloat(overallScore.toFixed(2)),
        completedQuestions: savedResponses.length,
        totalQuestions: sectionMetadata.totalQuestions,
        completionPercentage: Number.parseFloat(completionPercentage.toFixed(2)),
        sectionProgress,
        nextSteps: completionPercentage === 100 ? ["Generate Report", "View Analytics"] : ["Continue Assessment"],
      },
    })
  } catch (error) {
    console.error("[v0] Assessment processing failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process assessment data",
      },
      { status: 500 },
    )
  }
}
