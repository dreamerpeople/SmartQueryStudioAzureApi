const {
  client,
  SYSTEM_PROMPT,
  deployment,
} = require("../config/azureOpenAIClient");

/**
 * handleQuery
 * Logic for POST /api/query using Azure OpenAI
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
    // Azure OpenAI Chat Completion
    console.log(prompt);

    const events = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      // Note: response_format: { type: "json_object" } is supported in many versions
      response_format: { type: "json_object" },
    });

    const raw = events.choices[0]?.message?.content;

    let agentResponse;
    try {
      agentResponse = JSON.parse(raw);
    } catch {
      agentResponse = { type: "conversational", result: raw };
    }

    return res.json(agentResponse);
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
