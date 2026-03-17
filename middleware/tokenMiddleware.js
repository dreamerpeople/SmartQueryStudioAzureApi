/**
 * @file middleware/tokenMiddleware.js
 * @description Middleware to ensure a valid application token is present for protected routes.
 * Retrieves a token using MSAL client credentials flow and attaches it to the request object.
 */

const { getAccessToken } = require("../services/authService");

/**
 * Middleware that retrieves an access token and attaches it to the request object.
 * 
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 */
async function injectAppToken(req, res, next) {

  try {
    const tokenResponse = await getAccessToken();

    req.appToken = {
      accessToken: tokenResponse.accessToken,
      expiresOn: tokenResponse.expiresOn,
      scopes: tokenResponse.scopes,
    };

    next();
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: "Security error: Could not obtain application identity token.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

module.exports = {
  injectAppToken,
};
