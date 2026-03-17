/**
 * @file config/azureOpenAIClient.js
 * @description Initializes and configures the Azure OpenAI client.
 * Supports both API Key and Entra ID (Managed Identity/Service Principal) authentication.
 * Defines system prompts used for AI orchestration and response structuring.
 */

const { AzureOpenAI } = require("openai");

require("@azure/openai/types");
const {
  DefaultAzureCredential,
  getBearerTokenProvider,
} = require("@azure/identity");

// Environment variables
/** @type {string} Azure OpenAI Endpoint URL */
const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");

/** @type {string|undefined} Azure OpenAI API Key (optional if using Entra ID) */
const apiKey = process.env.AZURE_OPENAI_API_KEY;

/** @type {string} Deployment name for the OpenAI model (e.g., 'gpt-4o') */
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";


/**
 * The initialized Azure OpenAI client instance.
 * @type {AzureOpenAI}
 */
let client;

if (apiKey) {
  // Use API Key if provided
  client = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment,
    apiVersion: "2024-08-01-preview",
  });
} else {
  // Otherwise, use Entra ID Managed Identity / Default Azure Credential
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureContext = new DefaultAzureCredential();
  const tokenProvider = getBearerTokenProvider(azureContext, scope);

  client = new AzureOpenAI({
    endpoint,
    azureADTokenProvider: tokenProvider,
    deployment,
    apiVersion: "2024-05-01-preview",
  });
}


// ── System prompt ─────────────────────────────────────────────────────────────
/**
 * System prompt for the primary AI agent.
 * Defines the capabilities and JSON response format for processing user queries.
 * @constant {string}
 */
const SYSTEM_PROMPT = `
You are a smart AI agent for an admin analytics panel.
... (Rest of content unchanged)
`;


// ── Response Helper Prompt ───────────────────────────────────────────────────
/**
 * Response helper prompt for the formatting agent.
 * Guides the AI in polishing and structuring the final response into a consistent schema.
 * @constant {string}
 */
const RESPONSE_HELPER_PROMPT = `
You are a Response Structuring Assistant for an AI Admin Panel.
... (Rest of content unchanged)
`;


module.exports = {
  client,
  SYSTEM_PROMPT,
  RESPONSE_HELPER_PROMPT,
  deployment,
};
