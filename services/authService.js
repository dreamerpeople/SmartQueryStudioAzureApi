/**
 * services/authService.js
 *
 * Encapsulates Microsoft Entra ID Client Credentials Flow (App-only).
 * Uses MSAL's built-in in-memory caching for token reuse and auto-refresh.
 */

const msal = require("@azure/msal-node");
require("dotenv").config();

/** @type {msal.Configuration} */
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message) {
        // console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Info,
    },
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Acquires an access token using Client Credentials flow.
 *
 * @param {string[]} scopes - List of scopes to request.
 * @returns {Promise<msal.AuthenticationResult>}
 */
async function getAccessToken(
  scopes = ["https://graph.microsoft.com/.default"],
) {
  const clientCredentialRequest = {
    scopes,
  };
  
  try {
    const response = await cca.acquireTokenByClientCredential(
      clientCredentialRequest,
    );
    return response;
  } catch (error) {
    console.error(
      "[AuthService Error] Failed to acquire token:",
      error.message,
    );
    throw error;
  }
}

module.exports = {
  getAccessToken,
};
