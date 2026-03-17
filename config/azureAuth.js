/**
 * @file config/azureAuth.js
 * @description Configures MSAL (Microsoft Authentication Library) for Entra ID authentication.
 * Provides a confidential client application instance for server-side authentication flows.
 */


const msal = require("@azure/msal-node");

/**
 * MSAL Configuration object.
 * Defines the authentication parameters for Entra ID, including client credentials and authority.
 * @type {import("@azure/msal-node").Configuration}
 */
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || "common"}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      /**
       * Logger callback for MSAL events.
       * @param {number} loglevel - The log level.
       * @param {string} message - The log message.
       * @param {boolean} containsPii - Whether the message contains personally identifiable information.
       */
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Info,
    },
  },
};


/**
 * Confidential Client Application instance.
 * Used to acquire tokens for server-side flows.
 * @type {msal.ConfidentialClientApplication}
 */
const pca = new msal.ConfidentialClientApplication(msalConfig);


module.exports = { pca, msalConfig };
