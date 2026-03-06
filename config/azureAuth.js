/**
 * config/azureAuth.js
 *
 * Configures MSAL (Microsoft Authentication Library) for Entra ID auth.
 */

const msal = require("@azure/msal-node");

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || "common"}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (!containsPii) console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Info,
    },
  },
};

const pca = new msal.ConfidentialClientApplication(msalConfig);

module.exports = { pca, msalConfig };
