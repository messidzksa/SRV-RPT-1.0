// api/index.js
const app = require("../app");

// Export Express app as a serverless function handler
module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error("❌ Serverless function error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
