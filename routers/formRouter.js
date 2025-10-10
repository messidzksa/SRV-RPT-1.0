const express = require("express");
const router = express.Router();
const serviceReportService = require("../services/FormService");
const { protect } = require("../controllers/authController");

router.get("/", (req, res) => {
  res.send("Service Report API active 🚀");
});

router.use(protect);

router.post("/reports", serviceReportService.createServiceReport);

router.get("/reports", serviceReportService.getAllServiceReports);

router.get("/reports/:id", serviceReportService.getReport);

module.exports = router;
