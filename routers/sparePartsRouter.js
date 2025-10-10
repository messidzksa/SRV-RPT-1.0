const express = require("express");
const multer = require("multer");
const { protect, restrictTo } = require("../controllers/authController");
const spareController = require("../controllers/sparePartsController");
const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.use(protect, restrictTo("VXR"));
// Admin-only routes
// CRUD Routes
router.post("/", spareController.createSpare);
router.get("/", spareController.getSpares);
router.get("/:id", spareController.getSpareById);
router.put("/:id", spareController.updateSpare);
router.delete("/:id", spareController.deleteSpare);

// Bulk Upload
router.post("/upload-csv", upload.single("file"), spareController.uploadSpares);

module.exports = router;
