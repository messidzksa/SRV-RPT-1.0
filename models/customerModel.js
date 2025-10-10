const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A customer must have a name"],
      trim: true,
    },
    customerId: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: [true, "A customer must belong to a region"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


customerSchema.pre("save", async function (next) {
  if (this.customerId) return next(); // Skip if already exists

  const Region = mongoose.model("Region");
  const region = await Region.findById(this.region).select("code");
  if (!region) return next(new Error("Invalid region reference"));

  const now = new Date();
  const dateCode = now.toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20251009

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayCount = await mongoose.model("Customer").countDocuments({
    region: this.region,
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(todayCount + 1).padStart(4, "0");
  this.customerId = `CUS-${region.code}-${dateCode}-${sequence}`;

  next();
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
