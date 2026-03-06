require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const queryRouter = require("./routes/query");
const authRouter = require("./routes/auth");
const { ensureAuthenticated } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 4041; // Using 4041 to avoid conflict with the GitHub version

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  }),
);
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "azure_smart_query_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    provider: "Azure",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/api/query", ensureAuthenticated, queryRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ type: "error", message: "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `✅  Microsoft-Integrated SmartQueryStudio API running on http://localhost:${PORT}`,
  );
  console.log(
    `   Azure OpenAI Config: ${process.env.AZURE_OPENAI_ENDPOINT ? "✔ set" : "✖ NOT CONFIGURED"}`,
  );
  console.log(
    `   Microsoft Entra ID Config: ${process.env.AZURE_CLIENT_ID ? "✔ set" : "✖ NOT CONFIGURED"}`,
  );
});
