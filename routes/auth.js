/**
 * @file routes/auth.js
 * @description Authentication routes for Microsoft Entra ID.
 * Handles interactive login, callback processing, silent app authentication, and session management.
 */

const express = require("express");

const { pca } = require("../config/azureAuth");
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4200";
const REDIRECT_URI =
  process.env.REDIRECT_URI || "http://localhost:4040/auth/callback";

/**
 * Initiates the Microsoft Entra ID authentication flow.
 * Redirects the user to the Microsoft login page.
 * 
 * @name GET /auth/microsoft
 * @function
 */
router.get("/microsoft", async (req, res) => {

  const authCodeUrlParameters = {
    scopes: ["user.read"],
    redirectUri: REDIRECT_URI,
  };

  try {
    const response = await pca.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(response);
  } catch (error) {
    console.error("Error getting auth code URL:", error);
    res.status(500).send("Error initiating Microsoft Login");
  }
});

/**
 * Silent application login using Microsoft Client Credentials flow.
 * Used for service-to-service authentication or backend-initiated operations.
 * 
 * @name POST /auth/app-login
 * @function
 */
router.post("/app-login", async (req, res) => {

  const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"], // Standard scope for app-only auth
  };

  try {
    const response = await pca.acquireTokenByClientCredential(
      clientCredentialRequest,
    );

    // Set a session for the application itself
    req.session.user = {
      name: "SmartQueryStudio App",
      username: `app_${process.env.AZURE_CLIENT_ID}@entra.id`,
      isApp: true,
      tenantId: response.tenantId,
    };

    res.json({
      success: true,
      message: "App authenticated successfully (behind the scenes)",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error in Client Credentials flow:", error);
    res.status(500).json({
      error: "Silent auth failed",
      message: error.message,
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      subError: error.subError,
    });
  }
});

/**
 * Authentication callback endpoint.
 * Processes the authorization code returned by Microsoft and acquires access tokens.
 * 
 * @name GET /auth/callback
 * @function
 */
router.get("/callback", async (req, res) => {

  const tokenRequest = {
    code: req.query.code,
    scopes: ["user.read"],
    redirectUri: REDIRECT_URI,
  };

  try {
    const response = await pca.acquireTokenByCode(tokenRequest);
    // Store user info in session
    req.session.user = {
      name: response.account.name,
      username: response.account.username,
      tenantId: response.tenantId,
    };
    res.redirect(`${FRONTEND_URL}/ai-query`);
  } catch (error) {
    console.error("Error acquiring token:", error);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

/**
 * Log out the current user and destroy the session.
 * 
 * @name GET /auth/logout
 * @function
 */
router.get("/logout", (req, res) => {

  req.session.destroy(() => {
    res.redirect(`${FRONTEND_URL}/login`);
  });
});

/**
 * Retrieve the current authenticated user's information.
 * 
 * @name GET /auth/user
 * @function
 */
router.get("/user", (req, res) => {

  if (req.session && req.session.user) {
    res.json(req.user || req.session.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

module.exports = router;
