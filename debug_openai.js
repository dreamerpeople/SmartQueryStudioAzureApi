require("dotenv").config();

async function debugOpenAI() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = "2024-02-01"; // GA version

  console.log(`\n🕵️ Debugging Azure OpenAI...`);
  console.log(`📍 Base Endpoint: ${endpoint}`);
  console.log(`🚀 Deployment: ${deployment}`);

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  console.log(`🔗 Request URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });

    console.log(`\nStatus: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log("Body:", JSON.stringify(data, null, 2));

    if (response.status === 200) {
      console.log(
        "\n✅ Manual FETCH succeeded! The issue might be SDK configuration.",
      );
    }
  } catch (error) {
    console.error("\n❌ Fetch failed:", error.message);
  }
}

debugOpenAI();
