/**
 * Asgardeo Frontend Configuration
 *
 * Setup Instructions:
 * 1. Go to https://console.asgardeo.io
 * 2. Create a Single Page Application
 * 3. Configure authorized redirect URLs
 * 4. Copy Client ID to .env file
 */

// Get environment variables with proper fallbacks
const baseUrl = import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/kubestock";
const clientID = import.meta.env.VITE_ASGARDEO_CLIENT_ID || "";
const redirectURL = import.meta.env.VITE_APP_URL || "http://localhost:5173";

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log("🔧 Asgardeo Config:");
  console.log("  baseUrl:", baseUrl);
  console.log("  clientID:", clientID ? "Set ✓" : "Missing ✗");
  console.log("  redirectURL:", redirectURL);
}

if (!clientID) {
  console.error("❌ VITE_ASGARDEO_CLIENT_ID is not set in environment variables!");
}

export const asgardeoConfig = {
  // Your Asgardeo organization name (from yourorg.asgardeo.io)
  baseUrl: baseUrl,

  // Client ID from Asgardeo console
  clientID: clientID,

  // Redirect URLs
  signInRedirectURL: redirectURL,
  signOutRedirectURL: redirectURL,

  // OAuth scopes
  scope: ["openid", "profile", "email", "groups"],

  // Enable PKCE (recommended for SPAs)
  enablePKCE: true,

  // Response mode
  responseMode: "query",

  // Storage type
  storage: "sessionStorage",

  // Token validation
  validateIDTokenIssuer: true,

  // Clock tolerance for token validation (in seconds)
  clockTolerance: 60,
};

if (import.meta.env.DEV) {
  console.log("✅ Asgardeo Config:", {
    baseUrl: asgardeoConfig.baseUrl,
    clientID: asgardeoConfig.clientID ? "Set ✓" : "Missing ✗",
    signInRedirectURL: asgardeoConfig.signInRedirectURL,
  });
}

export default asgardeoConfig;
