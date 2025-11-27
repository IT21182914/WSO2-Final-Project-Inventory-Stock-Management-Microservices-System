const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { asgardeo } = require("../config/asgardeo.config");

/**
 * Asgardeo Authentication Middleware
 * Validates OAuth 2.0 access tokens from Asgardeo
 */

// Initialize JWKS client for token signature verification
const client = jwksClient({
  jwksUri: asgardeo.jwksUri || `${asgardeo.baseUrl}/oauth2/jwks`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// Get signing key from JWKS
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify and decode Asgardeo access token
 */
async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: asgardeo.audience,
        issuer: asgardeo.issuer,
        algorithms: ["RS256"],
        clockTolerance: asgardeo.tokenValidation.clockTolerance,
      },
      (err, decoded) => {
        if (err) {
          console.error("❌ [Token Verify] JWT verification failed:");
          console.error("  Error name:", err.name);
          console.error("  Error message:", err.message);
          return reject(err);
        }
        console.log("✅ [Token Verify] JWT decoded successfully");
        resolve(decoded);
      }
    );
  });
}

/**
 * Get user info from Asgardeo userinfo endpoint
 */
async function getUserInfo(accessToken) {
  try {
    const response = await axios.get(`${asgardeo.baseUrl}/oauth2/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user info:", error.message);
    return null;
  }
}

/**
 * Main authentication middleware
 */
const authenticateAsgardeo = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    console.log("🔐 [Asgardeo Auth] Incoming request");
    console.log("  Headers present:", !!req.headers);
    console.log(
      "  Authorization header:",
      authHeader ? `Bearer ${authHeader.substring(7, 50)}...` : "Missing"
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ [Asgardeo Auth] No Bearer token in header");
      return res.status(401).json({
        success: false,
        message: "No access token provided",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log("🔍 [Asgardeo Auth] Token extracted, length:", token.length);
    console.log(
      "🔍 [Asgardeo Auth] Token preview:",
      token.substring(0, 50) + "..."
    );

    // Verify token
    console.log("⚙️  [Asgardeo Auth] Starting token verification...");
    console.log("  Issuer:", asgardeo.issuer);
    console.log("  Audience:", asgardeo.audience);
    console.log("  JWKS URI:", asgardeo.jwksUri);

    const decoded = await verifyToken(token);
    console.log("✅ [Asgardeo Auth] Token verified successfully");
    console.log("  Subject:", decoded.sub);
    console.log("  Username:", decoded.username);

    // Get additional user info from userinfo endpoint
    const userInfo = await getUserInfo(token);

    // Attach user information to request
    req.user = {
      sub: decoded.sub,
      username: decoded.username || userInfo?.username,
      email: decoded.email || userInfo?.email,
      roles: decoded.groups || decoded.roles || [],
      scope: decoded.scope,
      ...userInfo,
    };

    req.accessToken = token;

    next();
  } catch (error) {
    console.error("❌ [Asgardeo Auth] Authentication failed");
    console.error("  Error name:", error.name);
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);

    if (error.name === "TokenExpiredError") {
      console.log("  Reason: Token has expired");
      return res.status(401).json({
        success: false,
        message: "Access token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      console.log("  Reason: JWT validation error -", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        code: "INVALID_TOKEN",
      });
    }

    console.log("  Reason: Unknown error");
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(
      (role) =>
        userRoles.includes(role) || userRoles.includes(role.toLowerCase())
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        requiredRoles: allowedRoles,
        userRoles: userRoles,
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      const userInfo = await getUserInfo(token);

      req.user = {
        sub: decoded.sub,
        username: decoded.username || userInfo?.username,
        email: decoded.email || userInfo?.email,
        roles: decoded.groups || decoded.roles || [],
        scope: decoded.scope,
        ...userInfo,
      };

      req.accessToken = token;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  authenticateAsgardeo,
  authorizeRoles,
  optionalAuth,
  verifyToken,
  getUserInfo,
};
