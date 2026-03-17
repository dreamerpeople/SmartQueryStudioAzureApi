/**
 * @file config/passport.js
 * @description Configures Passport.js for session management.
 * Provides serialization and deserialization of user objects for persistent login sessions.
 */

const passport = require("passport");

/**
 * Serializes user information into the session.
 * @param {Object} user - The user object to serialize.
 * @param {function} done - Passport callback.
 */
passport.serializeUser((user, done) => {
  done(null, user);
});

/**
 * Deserializes user information from the session.
 * @param {Object} obj - The object from the session.
 * @param {function} done - Passport callback.
 */
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Since we are using MSAL manually in routes for better control over the OIDC flow,
// we just need passport for session serialization here.
module.exports = passport;

