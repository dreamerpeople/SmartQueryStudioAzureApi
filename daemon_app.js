/**
 * @file daemon_app.js
 * @description Secure Express API entry point using Microsoft Entra ID Client Credentials Flow.
 * Designed for service-to-service communication and daemon applications.
 */


require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { injectAppToken } = require("./middleware/tokenMiddleware");
const queryRouter = require("./routes/query");

const app = express();
const PORT = process.env.PORT || 4045;

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

/**
 * Health check endpoint for the daemon API.
 * @name GET /health
 * @function
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});


/**
 * Protected endpoint demonstrating application-level authentication.
 * Attaches MSAL token info to the response.
 * 
 * @name GET /api/protected
 * @function
 */
app.get("/api/protected", injectAppToken, (req, res) => {
  const { accessToken, expiresOn, scopes } = req.appToken;

  res.json({
    message: "Succesfully accessed protected data using App-only Identity.",
    auth_info: {
      type: "Client Credentials (Daemon)",
      scopes: scopes,
      expires_on: expiresOn,
      token_preview: `${accessToken.substring(0, 15)}...[REDACTED]`,
      full_token_demo_only: accessToken,
    },
    data: {
      id: "SQS-001",
      val: "This data is secured by Entra ID Application Identity.",
      timestamp: Date.now(),
    },
  });
});

app.get("/api/user", (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.user || req.session.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});
app.use("/api/query", injectAppToken, queryRouter);
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(`[Server Error] ${new Date().toISOString()}:`, err.stack);
  res.status(500).json({
    type: "error",
    message: "Internal server error.",
    debug: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(
    `\n🚀 Secure Client Credentials API running at http://localhost:${PORT}`,
  );
  console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📍 Protected endpoint: http://localhost:${PORT}/api/protected\n`,
  );

  if (!process.env.AZURE_CLIENT_SECRET) {
    console.warn("⚠️  WARNING: AZURE_CLIENT_SECRET is not set in .env!");
  }
});
