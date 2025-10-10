// controllers/customerController.js
const fs = require("fs");
const XLSX = require("xlsx");
const Customer = require("../models/customerModel");
const Region = require("../models/regionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ---------------- CREATE SINGLE CUSTOMER ----------------
exports.createCustomer = catchAsync(async (req, res, next) => {
  const { name, regionCode } = req.body;

  if (!name || !regionCode) {
    return next(new AppError("Name and regionCode are required", 400));
  }

  const region = await Region.findOne({ code: regionCode.toUpperCase() });
  if (!region) {
    return next(new AppError(`No region found with code: ${regionCode}`, 404));
  }

  const existing = await Customer.findOne({ name, region: region._id });
  if (existing) {
    return next(new AppError("Customer already exists in this region", 400));
  }

  const customer = await Customer.create({
    name,
    region: region._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      customer: {
        customerId: customer.customerId,
        name: customer.name,
        region: region.name,
        regionCode: region.code,
      },
    },
  });
});

// ---------------- BULK UPLOAD (STRICT HEADERS) ----------------
exports.uploadCustomers = catchAsync(async (req, res, next) => {
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

  const createdCustomers = [];
  const skippedRows = [];

  for (const row of rows) {
    const name = row.name?.trim();
    const regionCode = row.regionCode?.trim();

    if (!name || !regionCode) {
      skippedRows.push({ row, reason: "Missing name or regionCode" });
      continue;
    }

    const region = await Region.findOne({ code: regionCode.toUpperCase() });
    if (!region) {
      skippedRows.push({ row, reason: `Region not found: ${regionCode}` });
      continue;
    }

    const existing = await Customer.findOne({ name, region: region._id });
    if (existing) {
      skippedRows.push({ row, reason: "Duplicate customer" });
      continue;
    }

    const customer = await Customer.create({
      name,
      region: region._id,
    });

    createdCustomers.push({
      customerId: customer.customerId,
      name: customer.name,
      region: region.name,
      regionCode: region.code,
    });
  }

  // Clean up temporary file
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.warn("⚠️ Could not delete temp file:", err.message);
  }

  res.status(201).json({
    status: "success",
    results: createdCustomers.length,
    skipped: skippedRows.length,
    customers: createdCustomers,
    skippedRows,
  });
});

// ---------------- GET ALL CUSTOMERS ----------------
exports.getCustomers = catchAsync(async (req, res, next) => {
  const customers = await Customer.find()
    .populate("region", "name code -_id")
    .select("name customerId region");

  const clean = customers.map((c) => ({
    customerId: c.customerId,
    name: c.name,
    region: c.region?.name || "N/A",
    regionCode: c.region?.code || "N/A",
  }));

  res.status(200).json({
    status: "success",
    results: clean.length,
    customers: clean,
  });
});

// ---------------- GET ONE CUSTOMER ----------------
exports.getCustomerById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let customer;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    customer = await Customer.findById(id)
      .populate("region", "name code -_id")
      .select("name customerId region");
  } else {
    customer = await Customer.findOne({ customerId: id })
      .populate("region", "name code -_id")
      .select("name customerId region");
  }

  if (!customer) {
    return next(
      new AppError(`No customer found with ID or customerId: ${id}`, 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      customer: {
        customerId: customer.customerId,
        name: customer.name,
        region: customer.region?.name,
        regionCode: customer.region?.code,
      },
    },
  });
});

// ---------------- UPDATE CUSTOMER ----------------
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let customer;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    customer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
  } else {
    customer = await Customer.findOneAndUpdate({ customerId: id }, req.body, {
      new: true,
      runValidators: true,
    });
  }

  if (!customer)
    return next(
      new AppError(`No customer found with ID or customerId: ${id}`, 404)
    );

  res.status(200).json({
    status: "success",
    data: {
      customer: {
        customerId: customer.customerId,
        name: customer.name,
      },
    },
  });
});

// ---------------- DELETE CUSTOMER ----------------
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let customer;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    customer = await Customer.findByIdAndDelete(id);
  } else {
    customer = await Customer.findOneAndDelete({ customerId: id });
  }

  if (!customer)
    return next(
      new AppError(`No customer found with ID or customerId: ${id}`, 404)
    );

  res.status(204).json({ status: "success", data: null });
});

// ---------------- CREATE REGION ----------------
exports.createRegion = catchAsync(async (req, res, next) => {
  const region = await Region.create(req.body);
  res.status(201).json({
    status: "success",
    data: { region },
  });
});

// ---------------- GET ALL REGIONS ----------------
exports.getRegion = catchAsync(async (req, res, next) => {
  const regions = await Region.find();
  res.status(200).json({
    status: "success",
    results: regions.length,
    data: { regions },
  });
});
