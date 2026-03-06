require("dotenv").config();
const { client, deployment } = require("./config/azureOpenAIClient");

async function verifyDeployment() {
  console.log(`\n🔍 Verifying Azure OpenAI Deployment: "${deployment}"...`);
  console.log(`📍 Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);

  try {
    const response = await client.chat.completions.create({
      model: deployment, // Deployment name
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 10,
    });

    console.log("✅ Success! Deployment found and responding.");
    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("\n❌ Error: Managed to reach Azure but deployment failed.");
    console.error("Status:", error.status);
    console.error("Message:", error.message);

    if (error.response) {
      console.error(
        "Error Body:",
        JSON.stringify(error.response.data || error.response, null, 2),
      );
    } else {
      console.error("Error Details:", error);
    }

    if (error.status === 404) {
      console.error(
        "\nTIP: The 404 usually means the DEPLOYMENT NAME in your .env doesn't match the deployment in Azure Portal.",
      );
    }
  }
}

verifyDeployment();
