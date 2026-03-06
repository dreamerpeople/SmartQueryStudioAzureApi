const passport = require("passport");

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Since we are using MSAL manually in routes for better control over the OIDC flow,
// we just need passport for session serialization here.
module.exports = passport;
