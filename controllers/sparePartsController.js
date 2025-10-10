const fs = require("fs");
const XLSX = require("xlsx");
const Spare = require("../models/sparePartsModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ---------------- CREATE SINGLE SPARE ----------------
exports.createSpare = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new AppError("Name is required", 400));
  }

  const existing = await Spare.findOne({ name });
  if (existing) {
    return next(new AppError("A spare with this name already exists", 400));
  }

  // Code auto-generated in model
  const spare = await Spare.create({ name });

  res.status(201).json({
    status: "success",
    data: {
      spare: {
        id: spare._id,
        name: spare.name,
        code: spare.code,
      },
    },
  });
});

// ---------------- BULK UPLOAD (CSV or EXCEL) ----------------
exports.uploadSpares = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "No file uploaded",
    });
  }

  const filePath = req.file.path;
  let rows = [];

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (err) {
    fs.unlinkSync(filePath);
    return res.status(400).json({
      status: "fail",
      message: "Invalid file format. Please upload a valid CSV or Excel file.",
    });
  }

  if (!rows.length) {
    fs.unlinkSync(filePath);
    return res.status(400).json({
      status: "fail",
      message: "Empty file. Please include at least one row.",
    });
  }

  const createdSpares = [];
  const skippedRows = [];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) {
      skippedRows.push({ row, reason: "Missing name" });
      continue;
    }

    const existing = await Spare.findOne({ name });
    if (existing) {
      skippedRows.push({ row, reason: "Duplicate name in DB" });
      continue;
    }

    const spare = await Spare.create({ name });
    createdSpares.push(spare);
  }

  // Clean temp file
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.warn("⚠️ Could not delete temp file:", err.message);
  }

  res.status(201).json({
    status: "success",
    results: createdSpares.length,
    skipped: skippedRows.length,
    spares: createdSpares.map((s) => ({
      name: s.name,
      code: s.code,
    })),
    skippedRows,
  });
});

// ---------------- GET ALL SPARES ----------------
exports.getSpares = catchAsync(async (req, res, next) => {
  const spares = await Spare.find().select("name code createdAt");

  res.status(200).json({
    status: "success",
    results: spares.length,
    spares,
  });
});

// ---------------- GET SINGLE SPARE ----------------
// ---------------- GET SINGLE SPARE ----------------
exports.getSpareById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let spare;

  // Check if it's a valid Mongo ObjectId (24 hex chars)
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    spare = await Spare.findById(id).select("name code createdAt");
  } else {
    // Otherwise, search by your custom code
    spare = await Spare.findOne({ code: id.toUpperCase() }).select(
      "name code createdAt"
    );
  }

  if (!spare) {
    return next(new AppError(`No spare found with ID or code: ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: { spare },
  });
});

// ---------------- UPDATE SPARE ----------------
exports.updateSpare = catchAsync(async (req, res, next) => {
  const spare = await Spare.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!spare) {
    return next(new AppError("No spare found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { spare },
  });
});

// ---------------- DELETE SPARE ----------------
exports.deleteSpare = catchAsync(async (req, res, next) => {
  const spare = await Spare.findByIdAndDelete(req.params.id);

  if (!spare) {
    return next(new AppError("No spare found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
