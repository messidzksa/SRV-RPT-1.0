const fs = require("fs");
const XLSX = require("xlsx");
const Customer = require("../models/customerModel");
const Region = require("../models/regionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ---------------- CREATE CUSTOMER ----------------
exports.createCustomer = catchAsync(async (req, res, next) => {
  const { name, regionCode } = req.body;

  const region = await Region.findOne({ code: regionCode.toUpperCase() });
  if (!region) return next(new AppError("Invalid region code", 404));

  const customer = await Customer.create({
    name,
    region: region._id,
  });

  res.status(201).json({
    status: "success",
    data: { customer },
  });
});
// ---------------- BULK UPLOAD CUSTOMERS ----------------
exports.uploadCustomers = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const filePath = req.file.path;

  try {
    // Read workbook
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      fs.unlinkSync(filePath);
      return next(new AppError("Uploaded file is empty", 400));
    }

    let added = 0;
    let skipped = 0;

    for (const row of data) {
      const name = row.name?.trim();
      const regionCode = row.regionCode?.trim()?.toUpperCase();

      if (!name || !regionCode) {
        skipped++;
        continue;
      }

      const region = await Region.findOne({ code: regionCode });
      if (!region) {
        skipped++;
        continue;
      }

      // Create a unique customerId format
      const customerId = `CUS-${regionCode}-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0")}`;

      // Avoid duplicates (by name)
      const existing = await Customer.findOne({ name });
      if (existing) {
        skipped++;
        continue;
      }

      await Customer.create({
        name,
        region: region._id,
        customerId,
      });

      added++;
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      status: "success",
      message: "File processed successfully",
      results: { added, skipped, total: data.length },
    });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    next(new AppError("Error processing file", 500));
  }
});

// ---------------- GET ALL CUSTOMERS ----------------
exports.getCustomers = catchAsync(async (req, res, next) => {
  const customers = await Customer.find({})
    .populate("region", "name code")
    .select("name customerId region");

  res.status(200).json({
    status: "success",
    results: customers.length,
    customers,
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

  const customer = await Customer.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!customer) return next(new AppError("No customer found", 404));

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
