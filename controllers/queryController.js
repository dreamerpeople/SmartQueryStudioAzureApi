/**
 * @file controllers/queryController.js
 * @description Controller for handling AI-powered search queries and visualization requests.
 * Orchestrates calls between the Azure OpenAI primary agent and the response structuring helper.
 */

const {

  client,
  SYSTEM_PROMPT,
  RESPONSE_HELPER_PROMPT,
  deployment,
} = require("../config/azureOpenAIClient");
const axios = require("axios");
const { executeSql } = require("../services/dremioService");
const { getDynamicSchemaContext } = require("../services/schemaService");

/**
 * Fetches current weather data for a given city using Open-Meteo API.
 * Performs geocoding first to retrieve coordinates.
 * 
 * @param {string} city - The name of the city.
 * @returns {Promise<{city: string, temperature: number, windspeed: number}>} Weather data object.
 * @throws {Error} If the city is not found or API call fails.
 */
async function getWeather(city) {
  // Step 1: Get coordinates
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;
  const geoRes = await axios.get(geoUrl);
  if (!geoRes.data.results || geoRes.data.results.length === 0) {
    throw new Error("City not found");
  }
  const { latitude, longitude, name } = geoRes.data.results[0];
  // Step 2: Get weather
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const weatherRes = await axios.get(weatherUrl);
  const weather = weatherRes.data.current_weather;
  return {
    city: name,
    temperature: weather.temperature,
    windspeed: weather.windspeed,
  };
}

/**
 * Fetches top news headlines based on a query, category, or location.
 * Requires NEWS_API_KEY in .env.
 * 
 * @param {string} [query] - Search term for news (e.g., "AI", "Economy").
 * @param {string} [category] - News category (e.g., "technology", "business").
 * @param {string} [location] - Location for news (e.g., "Dhaka", "London").
 * @returns {Promise<Array<{title: string, source: string, url: string, description: string}>>} Array of articles.
 */
async function getNews(query, category, location) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error("NEWS_API_KEY is missing in configuration.");
  }

  let fullQuery = query || "";
  if (location) {
    fullQuery = fullQuery ? `${fullQuery} in ${location}` : location;
  }

  // Use /everything if we have a specific search query or location
  // Otherwise, use /top-headlines for general categories
  let url;
  if (fullQuery) {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(fullQuery)}&sortBy=publishedAt&apiKey=${apiKey}`;
  } else {
    url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
    if (category) url += `&category=${category}`;
  }

  const response = await axios.get(url);
  
  if (response.data.status !== "ok") {
    throw new Error(response.data.message || "Failed to fetch news.");
  }

  return response.data.articles.slice(0, 5).map(article => ({
    title: article.title,
    source: article.source.name,
    description: article.description,
    url: article.url,
  }));
}


/**
 * Passes original query and system agent result to the helper agent for structuring.
 * Ensures the final output adheres to the expected JSON schema for the frontend.
 * 
 * @param {string} userQuery - The original natural language query from the user.
 * @param {Object} systemResponse - The raw result from the primary AI logic or tool output.
 * @returns {Promise<Object>} Polished JSON response object.
 */
async function callResponseHelper(userQuery, systemResponse) {

  try {
    const helperResponse = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: RESPONSE_HELPER_PROMPT },
        {
          role: "user",
          content: `USER_QUERY: ${userQuery}\n\nSYSTEM_RESPONSE: ${JSON.stringify(
            systemResponse,
          )}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const raw = helperResponse.choices[0]?.message?.content;
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Response Helper Error]", err?.message || err);
    // Fallback to raw system response if helper fails
    return systemResponse;
  }
}

/**
 * Main entry point for processing AI queries.
 * 
 * Flow:
 * 1. Primary AI Agent classifies and processes the query.
 * 2. If a tool is requested (e.g., weather), it executes the tool.
 * 3. Results are sent to a secondary Response Helper agent for final formatting.
 * 
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 */
const handleQuery = async (req, res) => {

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      type: "error",
      message: "Prompt is required and must be a non-empty string.",
    });
  }

  try {
    console.log("Original Prompt:", prompt);

    // Inject Dynamic Schema Here
    const dynamicSchema = await getDynamicSchemaContext();
    const finalSystemPrompt = SYSTEM_PROMPT.replace("{{DYNAMIC_SCHEMA}}", dynamicSchema);

    // STEP 1: Main System Agent Logic
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    let systemResult;

    try {
      systemResult = JSON.parse(raw);
    } catch {
      systemResult = { type: "conversational", result: raw };
    }

    // STEP 2: Handle Tools inside the Logic Phase
    if (systemResult.type === "tool_request") {
      if (systemResult.tool === "weather") {
        const city = systemResult?.params?.city;
        if (!city) {
          systemResult = {
            type: "error",
            message: "City is required for weather lookup.",
          };
        } else {
          try {
            const weather = await getWeather(city);
            systemResult = {
              type: "tool_output",
              tool: "weather",
              data: weather,
            };
          } catch (err) {
            console.error("Weather API error:", err.message);
            systemResult = {
              type: "error",
              message: "Unable to fetch weather data right now.",
            };
          }
        }
      } else if (systemResult.tool === "dremio") {
        const sql = systemResult?.params?.sql;
        if (!sql) {
          systemResult = {
            type: "error",
            message: "SQL query is required for Dremio tool.",
          };
        } else {
          try {
            const dataResult = await executeSql(sql);
            systemResult = {
              type: "tool_output",
              tool: "dremio",
              data: dataResult.rows,
              query: dataResult.query, // Pass the query back for the response helper
            };
          } catch (err) {
            console.error("Dremio SQL error:", err.message);
            systemResult = {
              type: "error",
              message: "Unable to query database right now.",
            };
          }
        }
      } else if (systemResult.tool === "news") {
        const { query, category, location } = systemResult?.params || {};
        try {
          const news = await getNews(query, category, location);
          systemResult = {
            type: "tool_output",
            tool: "news",
            data: news,
          };
        } catch (err) {
          console.error("News API error:", err.message);
          systemResult = {
            type: "error",
            message: err.message.includes("NEWS_API_KEY") 
              ? "News service not configured. Please add NEWS_API_KEY to .env." 
              : "Unable to fetch news data right now.",
          };
        }
      } else {
        systemResult = {
          type: "error",
          message: `Unsupported tool: ${systemResult.tool}`,
        };
      }
    }

    // STEP 3: Pass everything to the Response Helper Agent
    console.log("System Result:", systemResult);
    const finalResponse = await callResponseHelper(prompt, systemResult);
    console.log("Final Response:", finalResponse);

    return res.json(finalResponse);
  } catch (err) {
    console.error("[Azure OpenAI Error]", err?.message || err);

    if (err?.status === 401) {
      return res.status(500).json({
        type: "error",
        message:
          "Azure OpenAI credentials missing or invalid. Check your .env file.",
      });
    }

    return res.status(500).json({
      type: "error",
      message: "The Azure AI Agent encountered an unexpected error.",
    });
  }
};

module.exports = { handleQuery };
