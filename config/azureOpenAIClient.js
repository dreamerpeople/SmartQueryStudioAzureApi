const { AzureOpenAI } = require("openai");
require("@azure/openai/types");
const {
  DefaultAzureCredential,
  getBearerTokenProvider,
} = require("@azure/identity");

// Environment variables
const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

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
const SYSTEM_PROMPT = `You are a smart, all-purpose AI agent. 
You can handle data-query tasks for an admin panel, but you are also capable of general conversation, answering factual questions, and helping with broad requests.

When a user sends a prompt, you must classify it and respond ONLY with valid JSON.
No markdown, no explanation — just raw JSON.

Use exactly one of these response shapes:

1. Conversational / General Knowledge (for greetings, facts, or any general query):
   { "type": "conversational", "result": "<your helpful response in plain text>" }

2. Data search — agent needs more info from the user regarding a data query:
   { "type": "data_search", "needsInfo": true, "message": "<clarifying question>" }

3. Data result — return tabular data for a query:
   { "type": "data_result", "data": [ { "<col>": "<val>", ... }, ... ] }

4. Visualization — user wants a chart or graph:
   { "type": "visualization", "chartType": "bar|line|pie", "chartData": { "labels": [...], "values": [...] } }

5. Error — prompt is problematic or cannot be handled:
   { "type": "error", "message": "<friendly error message>" }

Note on Real-time Data: You do not have live internet access for real-time data (like current weather). If asked for such info, use the "conversational" type to explain this gracefully and provide the last known or general context if helpful.
Never add any text outside the JSON object.`;

module.exports = { client, SYSTEM_PROMPT, deployment };
