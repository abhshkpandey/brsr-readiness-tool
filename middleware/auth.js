// Authentication middleware
const AuthService = require("../lib/auth")

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      })
    }

    const user = await AuthService.getUserFromToken(token)
    req.user = user
    next()
  } catch (error) {
    console.error("[v0] Auth middleware error:", error.message)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = AuthService.extractTokenFromHeader(authHeader)

    if (token) {
      const user = await AuthService.getUserFromToken(token)
      req.user = user
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}

module.exports = {
  authMiddleware,
  optionalAuth,
}
