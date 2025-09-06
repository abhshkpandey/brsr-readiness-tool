// Report download endpoint
import { NextResponse } from "next/server"
import { createReadStream } from "fs"
import { stat } from "fs/promises"
const AuthService = require("../../../../../lib/auth")
const Assessment = require("../../../../../models/Assessment")
const Report = require("../../../../../models/Report")

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

    // Get report
    const report = await Report.findById(id)
    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 },
      )
    }

    // Verify assessment ownership
    const assessment = await Assessment.findById(report.assessment_id)
    if (!assessment || assessment.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        { status: 403 },
      )
    }

    // Check if report has expired
    if (new Date() > new Date(report.expires_at)) {
      return NextResponse.json(
        {
          success: false,
          message: "Report has expired",
        },
        { status: 410 },
      )
    }

    // Check if file exists
    try {
      await stat(report.file_path)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Report file not found",
        },
        { status: 404 },
      )
    }

    // Increment download count
    await Report.incrementDownloadCount(id)

    // Determine content type based on report type
    const contentTypes = {
      pdf: "application/pdf",
      excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      json: "application/json",
    }

    const contentType = contentTypes[report.report_type] || "application/octet-stream"
    const fileName = `brsr-report-${assessment.id}.${report.report_type}`

    // Stream the file
    const fileStream = createReadStream(report.file_path)

    return new NextResponse(fileStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": report.file_size.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Report download error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to download report",
      },
      { status: 500 },
    )
  }
}
