const app = require("../app");

// Export as a serverless function handler
module.exports = (req, res) => {
  return app(req, res);
};
