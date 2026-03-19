// This file is automatically detected by react-scripts
// It overrides the local development server headers that block Firebase OAuth popups

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  });
};
