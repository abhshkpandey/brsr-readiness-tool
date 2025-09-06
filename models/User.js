// User model
const db = require("../lib/database")
const bcrypt = require("bcryptjs")

class User {
  static async create({ email, password, companyName, industry, companySize }) {
    const passwordHash = await bcrypt.hash(password, 12)

    const query = `
      INSERT INTO users (email, password_hash, company_name, industry, company_size)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, company_name, industry, company_size, created_at
    `

    const result = await db.query(query, [email, passwordHash, companyName, industry, companySize])
    return result.rows[0]
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1 AND is_active = true"
    const result = await db.query(query, [email])
    return result.rows[0]
  }

  static async findById(id) {
    const query =
      "SELECT id, email, company_name, industry, company_size, created_at FROM users WHERE id = $1 AND is_active = true"
    const result = await db.query(query, [id])
    return result.rows[0]
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  static async updateProfile(id, { companyName, industry, companySize }) {
    const query = `
      UPDATE users 
      SET company_name = $2, industry = $3, company_size = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, company_name, industry, company_size, updated_at
    `

    const result = await db.query(query, [id, companyName, industry, companySize])
    return result.rows[0]
  }
}

module.exports = User
