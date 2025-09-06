// Script to clean up expired reports
const Report = require("../models/Report")
const fs = require("fs")

async function cleanupExpiredReports() {
  try {
    console.log("[v0] Starting cleanup of expired reports...")

    // Get expired reports
    const expiredReports = await Report.findExpired()
    console.log(`[v0] Found ${expiredReports.length} expired reports`)

    let deletedFiles = 0
    let deletedRecords = 0

    for (const report of expiredReports) {
      try {
        // Delete file if it exists
        if (fs.existsSync(report.file_path)) {
          fs.unlinkSync(report.file_path)
          deletedFiles++
        }

        // Delete database record
        await Report.delete(report.id)
        deletedRecords++
      } catch (error) {
        console.error(`[v0] Error deleting report ${report.id}:`, error)
      }
    }

    console.log(`[v0] Cleanup completed: ${deletedFiles} files and ${deletedRecords} records deleted`)
  } catch (error) {
    console.error("[v0] Cleanup script error:", error)
  }
}

// Run cleanup
cleanupExpiredReports()
