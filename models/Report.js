// Report model for tracking generated reports
const db = require("../lib/database")

class Report {
  static async create(assessmentId, reportType, filePath, fileSize) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiration

    const query = `
      INSERT INTO reports (assessment_id, report_type, file_path, file_size, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await db.query(query, [assessmentId, reportType, filePath, fileSize, expiresAt])
    return result.rows[0]
  }

  static async findById(id) {
    const query = "SELECT * FROM reports WHERE id = $1"
    const result = await db.query(query, [id])
    return result.rows[0]
  }

  static async findByAssessmentId(assessmentId) {
    const query = `
      SELECT * FROM reports 
      WHERE assessment_id = $1 
      ORDER BY generated_at DESC
    `
    const result = await db.query(query, [assessmentId])
    return result.rows
  }

  static async incrementDownloadCount(id) {
    const query = `
      UPDATE reports 
      SET download_count = download_count + 1 
      WHERE id = $1
      RETURNING *
    `
    const result = await db.query(query, [id])
    return result.rows[0]
  }

  static async deleteExpired() {
    const query = "DELETE FROM reports WHERE expires_at < CURRENT_TIMESTAMP"
    const result = await db.query(query)
    return result.rowCount
  }

  static async delete(id) {
    const query = "DELETE FROM reports WHERE id = $1"
    await db.query(query, [id])
  }
}

module.exports = Report
