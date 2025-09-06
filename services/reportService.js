// Report generation service for BRSR assessments
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")
const { createCanvas } = require("canvas")
const ChartJSNodeCanvas = require("chartjs-node-canvas")

class ReportService {
  constructor() {
    this.chartRenderer = new ChartJSNodeCanvas({
      width: 800,
      height: 400,
      backgroundColour: "white",
    })
  }

  async generateReport(assessment, responses, sectionScores, insights, options = {}) {
    const { format = "pdf", includeCharts = true, includeRecommendations = true, includeRawData = false } = options

    switch (format) {
      case "pdf":
        return this.generatePDFReport(assessment, responses, sectionScores, insights, {
          includeCharts,
          includeRecommendations,
          includeRawData,
        })
      case "excel":
        return this.generateExcelReport(assessment, responses, sectionScores)
      case "json":
        return this.generateJSONReport(assessment, responses, sectionScores, insights)
      default:
        throw new Error(`Unsupported report format: ${format}`)
    }
  }

  async generatePDFReport(assessment, responses, sectionScores, insights, options) {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `BRSR Assessment Report - ${assessment.title}`,
        Author: "BRSR Assessment Tool",
        Subject: "Business Responsibility and Sustainability Report",
        Keywords: "ESG, BRSR, Sustainability, Assessment",
      },
    })

    const fileName = `brsr-report-${assessment.id}-${Date.now()}.pdf`
    const filePath = path.join(process.cwd(), "public", "reports", fileName)

    // Ensure reports directory exists
    const reportsDir = path.dirname(filePath)
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // Cover Page
    await this.addCoverPage(doc, assessment)

    // Executive Summary
    doc.addPage()
    await this.addExecutiveSummary(doc, assessment, sectionScores, insights)

    // Section Details
    doc.addPage()
    await this.addSectionDetails(doc, sectionScores, responses)

    // Charts (if requested)
    if (options.includeCharts) {
      doc.addPage()
      await this.addChartsToReport(doc, sectionScores, assessment)
    }

    // Recommendations (if requested)
    if (options.includeRecommendations && insights.recommendations.length > 0) {
      doc.addPage()
      await this.addRecommendations(doc, insights)
    }

    // Raw Data (if requested)
    if (options.includeRawData) {
      doc.addPage()
      await this.addRawData(doc, responses)
    }

    // Footer on all pages
    this.addFooter(doc)

    doc.end()

    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        resolve({
          fileName,
          filePath,
          downloadUrl: `/reports/${fileName}`,
          fileSize: fs.statSync(filePath).size,
        })
      })
      stream.on("error", reject)
    })
  }

  async addCoverPage(doc, assessment) {
    // Company logo placeholder
    doc.fontSize(24).fillColor("#15803d").text("BRSR Assessment Report", 50, 100, { align: "center" })

    doc
      .fontSize(18)
      .fillColor("#374151")
      .text(assessment.title || "Business Responsibility & Sustainability Report", 50, 150, { align: "center" })

    // Assessment details
    doc
      .fontSize(12)
      .fillColor("#6b7280")
      .text(`Report Generated: ${new Date().toLocaleDateString()}`, 50, 200, { align: "center" })
      .text(`Reporting Period: ${assessment.reporting_period || "FY 2024-25"}`, 50, 220, { align: "center" })
      .text(`Assessment ID: ${assessment.id}`, 50, 240, { align: "center" })

    // Overall score circle
    const centerX = doc.page.width / 2
    const centerY = 350
    const radius = 80

    doc.circle(centerX, centerY, radius).stroke("#15803d")

    doc
      .fontSize(36)
      .fillColor("#15803d")
      .text(`${Math.round(assessment.overall_score || 0)}`, centerX - 30, centerY - 20)
      .fontSize(14)
      .text("Overall Score", centerX - 40, centerY + 10)

    // Status
    const statusColor = assessment.status === "completed" ? "#15803d" : "#f59e0b"
    doc
      .fontSize(14)
      .fillColor(statusColor)
      .text(`Status: ${assessment.status?.toUpperCase() || "IN PROGRESS"}`, 50, 480, { align: "center" })
  }

  async addExecutiveSummary(doc, assessment, sectionScores, insights) {
    doc.fontSize(20).fillColor("#374151").text("Executive Summary", 50, 50)

    doc
      .fontSize(12)
      .fillColor("#6b7280")
      .text(
        `This report provides a comprehensive assessment of ${assessment.title || "your organization"}'s performance across key ESG (Environmental, Social, and Governance) metrics as defined by the BRSR framework.`,
        50,
        90,
        {
          width: 500,
          align: "justify",
        },
      )

    // Key metrics
    let yPosition = 140
    doc.fontSize(16).fillColor("#374151").text("Key Performance Indicators", 50, yPosition)

    yPosition += 30
    const completedSections = sectionScores.filter((s) => s.is_complete).length
    const totalSections = sectionScores.length

    const metrics = [
      { label: "Overall ESG Score", value: `${Math.round(assessment.overall_score || 0)}/100` },
      { label: "Assessment Completion", value: `${Math.round(assessment.completion_percentage || 0)}%` },
      { label: "Sections Completed", value: `${completedSections}/${totalSections}` },
      {
        label: "Total Responses",
        value: Object.keys(responses).reduce((sum, section) => sum + Object.keys(responses[section] || {}).length, 0),
      },
    ]

    metrics.forEach((metric) => {
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(`${metric.label}:`, 70, yPosition)
        .fillColor("#15803d")
        .text(metric.value, 250, yPosition)
      yPosition += 20
    })

    // Performance highlights
    yPosition += 20
    doc.fontSize(16).fillColor("#374151").text("Performance Highlights", 50, yPosition)

    yPosition += 30
    if (insights.strengths.length > 0) {
      doc.fontSize(14).fillColor("#15803d").text("Strengths:", 70, yPosition)
      yPosition += 20

      insights.strengths.slice(0, 3).forEach((strength) => {
        doc
          .fontSize(11)
          .fillColor("#374151")
          .text(`• ${strength.message} (Score: ${Math.round(strength.score)})`, 90, yPosition)
        yPosition += 15
      })
    }

    yPosition += 10
    if (insights.improvements.length > 0) {
      doc.fontSize(14).fillColor("#dc2626").text("Areas for Improvement:", 70, yPosition)
      yPosition += 20

      insights.improvements.slice(0, 3).forEach((improvement) => {
        doc
          .fontSize(11)
          .fillColor("#374151")
          .text(`• ${improvement.message} (Score: ${Math.round(improvement.score)})`, 90, yPosition)
        yPosition += 15
      })
    }
  }

  async addSectionDetails(doc, sectionScores, responses) {
    doc.fontSize(20).fillColor("#374151").text("Section Performance Details", 50, 50)

    let yPosition = 90
    const pageHeight = doc.page.height - 100

    sectionScores.forEach((section, index) => {
      if (yPosition > pageHeight - 150) {
        doc.addPage()
        yPosition = 50
      }

      // Section header
      doc.fontSize(16).fillColor("#15803d").text(section.section_title, 50, yPosition)

      yPosition += 25

      // Score and completion
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(`Score: ${Math.round(section.score)}/100`, 70, yPosition)
        .text(`Completion: ${Math.round(section.completion_percentage)}%`, 200, yPosition)
        .text(`Questions: ${section.completed_questions}/${section.total_questions}`, 350, yPosition)

      yPosition += 20

      // Progress bar
      const barWidth = 400
      const barHeight = 10
      const completionWidth = (section.completion_percentage / 100) * barWidth

      doc.rect(70, yPosition, barWidth, barHeight).stroke("#e5e7eb")

      doc.rect(70, yPosition, completionWidth, barHeight).fill("#15803d")

      yPosition += 30

      // Sample responses (if available)
      const sectionResponses = responses[section.section_key]
      if (sectionResponses && Object.keys(sectionResponses).length > 0) {
        doc
          .fontSize(11)
          .fillColor("#6b7280")
          .text(`Sample responses: ${Object.keys(sectionResponses).length} questions answered`, 70, yPosition)
        yPosition += 15
      }

      yPosition += 20
    })
  }

  async addChartsToReport(doc, sectionScores, assessment) {
    doc.fontSize(20).fillColor("#374151").text("Performance Analytics", 50, 50)

    try {
      // Section scores chart
      const chartConfig = {
        type: "bar",
        data: {
          labels: sectionScores.map((s) => s.section_title.replace(/&/g, "and")),
          datasets: [
            {
              label: "Section Scores",
              data: sectionScores.map((s) => Math.round(s.score)),
              backgroundColor: "#15803d",
              borderColor: "#166534",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Section Performance Scores",
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
        },
      }

      const chartBuffer = await this.chartRenderer.renderToBuffer(chartConfig)
      doc.image(chartBuffer, 50, 100, { width: 500 })

      // Completion percentage pie chart
      doc.addPage()
      const completedSections = sectionScores.filter((s) => s.is_complete).length
      const incompleteSections = sectionScores.length - completedSections

      const pieConfig = {
        type: "pie",
        data: {
          labels: ["Completed Sections", "Incomplete Sections"],
          datasets: [
            {
              data: [completedSections, incompleteSections],
              backgroundColor: ["#15803d", "#e5e7eb"],
              borderColor: ["#166534", "#d1d5db"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: "Assessment Completion Status",
            },
          },
        },
      }

      const pieBuffer = await this.chartRenderer.renderToBuffer(pieConfig)
      doc.image(pieBuffer, 50, 50, { width: 400 })
    } catch (error) {
      console.error("[v0] Chart generation error:", error)
      doc.fontSize(12).fillColor("#dc2626").text("Charts could not be generated due to technical limitations.", 50, 100)
    }
  }

  async addRecommendations(doc, insights) {
    doc.fontSize(20).fillColor("#374151").text("Recommendations for Improvement", 50, 50)

    let yPosition = 90

    if (insights.recommendations.length === 0) {
      doc
        .fontSize(12)
        .fillColor("#6b7280")
        .text(
          "No specific recommendations available. Your performance is generally strong across all areas.",
          50,
          yPosition,
        )
      return
    }

    insights.recommendations.forEach((rec, index) => {
      if (yPosition > doc.page.height - 150) {
        doc.addPage()
        yPosition = 50
      }

      // Priority indicator
      const priorityColor = rec.priority === "Critical" ? "#dc2626" : rec.priority === "High" ? "#f59e0b" : "#15803d"

      doc
        .fontSize(14)
        .fillColor(priorityColor)
        .text(`${index + 1}. ${rec.section} - ${rec.priority} Priority`, 50, yPosition)

      yPosition += 20

      doc.fontSize(12).fillColor("#374151").text(`Action: ${rec.action}`, 70, yPosition, { width: 450 })

      yPosition += 20

      doc.fontSize(11).fillColor("#6b7280").text(`Expected Impact: ${rec.impact}`, 70, yPosition, { width: 450 })

      yPosition += 30
    })
  }

  async addRawData(doc, responses) {
    doc.fontSize(20).fillColor("#374151").text("Raw Assessment Data", 50, 50)

    let yPosition = 90

    Object.entries(responses).forEach(([sectionKey, sectionData]) => {
      if (yPosition > doc.page.height - 100) {
        doc.addPage()
        yPosition = 50
      }

      doc.fontSize(16).fillColor("#15803d").text(sectionKey.toUpperCase(), 50, yPosition)

      yPosition += 25

      Object.entries(sectionData).forEach(([questionId, value]) => {
        if (yPosition > doc.page.height - 50) {
          doc.addPage()
          yPosition = 50
        }

        doc.fontSize(10).fillColor("#374151").text(`${questionId}: ${value}`, 70, yPosition)
        yPosition += 12
      })

      yPosition += 15
    })
  }

  addFooter(doc) {
    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i)

      doc
        .fontSize(8)
        .fillColor("#9ca3af")
        .text(
          `Generated by BRSR Assessment Tool | Page ${i + 1} of ${pages.count} | ${new Date().toLocaleDateString()}`,
          50,
          doc.page.height - 30,
          { align: "center" },
        )
    }
  }

  async generateExcelReport(assessment, responses, sectionScores) {
    // Excel generation would require additional libraries like 'exceljs'
    // For now, return a structured data format that could be converted to Excel
    const workbookData = {
      worksheets: [
        {
          name: "Summary",
          data: [
            ["Assessment Title", assessment.title],
            ["Overall Score", assessment.overall_score],
            ["Completion Percentage", assessment.completion_percentage],
            ["Status", assessment.status],
            ["Generated Date", new Date().toISOString()],
          ],
        },
        {
          name: "Section Scores",
          data: [
            ["Section", "Title", "Score", "Completion %", "Completed Questions", "Total Questions"],
            ...sectionScores.map((section) => [
              section.section_key,
              section.section_title,
              section.score,
              section.completion_percentage,
              section.completed_questions,
              section.total_questions,
            ]),
          ],
        },
        {
          name: "Raw Data",
          data: this.flattenResponsesForExcel(responses),
        },
      ],
    }

    const fileName = `brsr-data-${assessment.id}-${Date.now()}.json`
    const filePath = path.join(process.cwd(), "public", "reports", fileName)

    fs.writeFileSync(filePath, JSON.stringify(workbookData, null, 2))

    return {
      fileName,
      filePath,
      downloadUrl: `/reports/${fileName}`,
      fileSize: fs.statSync(filePath).size,
    }
  }

  async generateJSONReport(assessment, responses, sectionScores, insights) {
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType: "BRSR Assessment",
        version: "1.0",
      },
      assessment: {
        id: assessment.id,
        title: assessment.title,
        reportingPeriod: assessment.reporting_period,
        status: assessment.status,
        overallScore: assessment.overall_score,
        completionPercentage: assessment.completion_percentage,
      },
      sectionScores,
      responses,
      insights,
      summary: {
        totalSections: sectionScores.length,
        completedSections: sectionScores.filter((s) => s.is_complete).length,
        totalResponses: Object.values(responses).reduce((sum, section) => sum + Object.keys(section).length, 0),
        averageSectionScore:
          sectionScores.reduce((sum, s) => sum + Number.parseFloat(s.score), 0) / sectionScores.length,
      },
    }

    const fileName = `brsr-report-${assessment.id}-${Date.now()}.json`
    const filePath = path.join(process.cwd(), "public", "reports", fileName)

    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2))

    return {
      fileName,
      filePath,
      downloadUrl: `/reports/${fileName}`,
      fileSize: fs.statSync(filePath).size,
    }
  }

  flattenResponsesForExcel(responses) {
    const flattened = [["Section", "Question ID", "Response Value"]]

    Object.entries(responses).forEach(([sectionKey, sectionData]) => {
      Object.entries(sectionData).forEach(([questionId, value]) => {
        flattened.push([sectionKey, questionId, value])
      })
    })

    return flattened
  }
}

module.exports = ReportService
