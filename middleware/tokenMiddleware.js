/**
 * middleware/tokenMiddleware.js
 *
 * Middleware to ensure a valid application token is present for protected routes.
 */

const { getAccessToken } = require("../services/authService");

/**
 * Middleware that retrieves an access token and attaches it to the request object.
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
