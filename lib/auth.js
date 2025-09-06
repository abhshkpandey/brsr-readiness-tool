// Authentication utilities
const jwt = require("jsonwebtoken")
const User = require("../models/User")

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d"

class AuthService {
  static generateTokens(userId) {
    const accessToken = jwt.sign({ userId, type: "access" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    const refreshToken = jwt.sign({ userId, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })

    return { accessToken, refreshToken }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error("Invalid or expired token")
    }
  }

  static async getUserFromToken(token) {
    try {
      const decoded = this.verifyToken(token)
      if (decoded.type !== "access") {
        throw new Error("Invalid token type")
      }

      const user = await User.findById(decoded.userId)
      if (!user) {
        throw new Error("User not found")
      }

      return user
    } catch (error) {
      throw error
    }
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
    return authHeader.substring(7)
  }
}

module.exports = AuthService
