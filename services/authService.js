/**
 * @file services/authService.js
 * @description Encapsulates Microsoft Entra ID Client Credentials Flow for app-only authentication.
 * Uses MSAL's built-in in-memory caching for token reuse and auto-refresh.
 */


const msal = require("@azure/msal-node");
require("dotenv").config();

/**
 * MSAL Configuration for app-only authentication.
 * @type {msal.Configuration}
 */
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      /**
       * Logger callback for MSAL events.
       * @param {number} loglevel - The log level.
       * @param {string} message - The log message.
       */
      loggerCallback(loglevel, message) {
        // console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Info,
    },
  },
};


/**
 * Confidential Client Application instance for service-to-service calls.
 * @type {msal.ConfidentialClientApplication}
 */
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
