// routes/customerRoutes.js
const express = require("express");
const multer = require("multer");
const customerController = require("../controllers/customerController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect, authController.restrictTo("VXR"));

const upload = multer({ dest: "uploads/" });
router.post("/", customerController.createCustomer);
router.post(
  "/upload-csv",
  upload.single("file"),
  customerController.uploadCustomers
);
router.get("/", customerController.getCustomers);
router.get("/region", customerController.getRegion);
router.post("/createRegion", customerController.createRegion);
router.get("/:id", customerController.getCustomerById);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
