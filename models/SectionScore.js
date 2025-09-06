// Section Score model
const db = require("../lib/database")

class SectionScore {
  static async upsert(assessmentId, sectionKey, sectionTitle, score, completedQuestions, totalQuestions) {
    const completionPercentage = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
    const isComplete = completedQuestions === totalQuestions

    const query = `
      INSERT INTO section_scores (assessment_id, section_key, section_title, score, completed_questions, total_questions, completion_percentage, is_complete)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (assessment_id, section_key)
      DO UPDATE SET 
        score = EXCLUDED.score,
        completed_questions = EXCLUDED.completed_questions,
        completion_percentage = EXCLUDED.completion_percentage,
        is_complete = EXCLUDED.is_complete,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await db.query(query, [
      assessmentId,
      sectionKey,
      sectionTitle,
      score,
      completedQuestions,
      totalQuestions,
      completionPercentage,
      isComplete,
    ])
    return result.rows[0]
  }

  static async findByAssessmentId(assessmentId) {
    const query = `
      SELECT * FROM section_scores 
      WHERE assessment_id = $1 
      ORDER BY section_key
    `

    const result = await db.query(query, [assessmentId])
    return result.rows
  }

  static async findBySection(assessmentId, sectionKey) {
    const query = `
      SELECT * FROM section_scores 
      WHERE assessment_id = $1 AND section_key = $2
    `

    const result = await db.query(query, [assessmentId, sectionKey])
    return result.rows[0]
  }
}

module.exports = SectionScore
