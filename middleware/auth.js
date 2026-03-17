/**
 * @file middleware/auth.js
 * @description Middleware for handling dual-mode authentication: API Key and interactive session.
 */

module.exports = {
  /**
   * Middleware to ensure the request is authenticated.
   * Checks for a valid API key in the 'x-api-key' header first, 
   * then falls back to checking for a valid interactive user session.
   * 
   * @param {import("express").Request} req - Express request object.
   * @param {import("express").Response} res - Express response object.
   * @param {import("express").NextFunction} next - Express next middleware function.
   */
  ensureAuthenticated: (req, res, next) => {

    // 1. Check for API Key (Silent Auth / Behind the scenes)
    const apiKey = req.headers["x-api-key"];
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (apiKey && expectedKey && apiKey === expectedKey) {
      // Create a dummy user session if it doesn't exist
      if (!req.session.user) {
        req.session.user = {
          name: "Service Account",
          username: "service_account@internal",
          isService: true,
        };
      }
      return next();
    }

    // 2. Check for interactive session
    if (req.session && req.session.user) {
      return next();
    }

    res
      .status(401)
      .json({
        error:
          "Not authenticated. Please log in via Microsoft or provide an API Key.",
      });
  },
};
