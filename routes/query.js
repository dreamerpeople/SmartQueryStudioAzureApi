/**
 * @file routes/query.js
 * @description API routes for AI-powered data queries and visualizations.
 */

const express = require("express");
const { handleQuery } = require("../controllers/queryController");
const router = express.Router();

/**
 * Handle natural language queries for data and visualizations.
 * 
 * @name POST /api/query
 * @function
 */
router.post("/", handleQuery);


module.exports = router;
