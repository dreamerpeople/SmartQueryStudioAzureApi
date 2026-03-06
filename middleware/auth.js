module.exports = {
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
