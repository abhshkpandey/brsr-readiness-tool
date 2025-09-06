// Assessment model
const db = require("../lib/database")

class Assessment {
  static async create(userId, { title = "BRSR Assessment", reportingPeriod = "FY 2024-25" } = {}) {
    const query = `
      INSERT INTO assessments (user_id, title, reporting_period)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result = await db.query(query, [userId, title, reportingPeriod])
    return result.rows[0]
  }

  static async findByUserId(userId) {
    const query = `
      SELECT a.*, 
             COUNT(ar.id) as total_responses,
             AVG(ss.completion_percentage) as avg_completion
      FROM assessments a
      LEFT JOIN assessment_responses ar ON a.id = ar.assessment_id
      LEFT JOIN section_scores ss ON a.id = ss.assessment_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `

    const result = await db.query(query, [userId])
    return result.rows
  }

  static async findById(id) {
    const query = "SELECT * FROM assessments WHERE id = $1"
    const result = await db.query(query, [id])
    return result.rows[0]
  }

  static async updateStatus(id, status) {
    const completedAt = status === "completed" ? "CURRENT_TIMESTAMP" : "NULL"
    const query = `
      UPDATE assessments 
      SET status = $2, completed_at = ${completedAt}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await db.query(query, [id, status])
    return result.rows[0]
  }

  static async updateScores(id, overallScore, completionPercentage) {
    const query = `
      UPDATE assessments 
      SET overall_score = $2, completion_percentage = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await db.query(query, [id, overallScore, completionPercentage])
    return result.rows[0]
  }

  static async delete(id) {
    const query = "DELETE FROM assessments WHERE id = $1"
    await db.query(query, [id])
  }
}

module.exports = Assessment
