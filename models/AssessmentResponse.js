// Assessment Response model
const db = require("../lib/database")

class AssessmentResponse {
  static async upsert(assessmentId, questionId, sectionKey, responseValue, responseType, unit = null) {
    const query = `
      INSERT INTO assessment_responses (assessment_id, question_id, section_key, response_value, response_type, unit)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (assessment_id, question_id)
      DO UPDATE SET 
        response_value = EXCLUDED.response_value,
        response_type = EXCLUDED.response_type,
        unit = EXCLUDED.unit,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await db.query(query, [assessmentId, questionId, sectionKey, responseValue, responseType, unit])
    return result.rows[0]
  }

  static async findByAssessmentId(assessmentId) {
    const query = `
      SELECT * FROM assessment_responses 
      WHERE assessment_id = $1 
      ORDER BY section_key, question_id
    `

    const result = await db.query(query, [assessmentId])
    return result.rows
  }

  static async findBySection(assessmentId, sectionKey) {
    const query = `
      SELECT * FROM assessment_responses 
      WHERE assessment_id = $1 AND section_key = $2
      ORDER BY question_id
    `

    const result = await db.query(query, [assessmentId, sectionKey])
    return result.rows
  }

  static async deleteByAssessment(assessmentId) {
    const query = "DELETE FROM assessment_responses WHERE assessment_id = $1"
    await db.query(query, [assessmentId])
  }
}

module.exports = AssessmentResponse
