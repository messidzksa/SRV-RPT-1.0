const mongoose = require("mongoose");

const spareSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A spare must have a name"],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      index: true,
    },
  },
  { timestamps: true }
);


spareSchema.pre("save", async function (next) {
  if (this.code) return next(); 

  const date = new Date();
  const dateCode = date.toISOString().slice(0, 10).replace(/-/g, ""); // 20251009

  // Count existing spares created today
  const todayStart = new Date(date.setHours(0, 0, 0, 0));
  const todayEnd = new Date(date.setHours(23, 59, 59, 999));

  const todayCount = await mongoose.model("Spare").countDocuments({
    createdAt: { $gte: todayStart, $lt: todayEnd },
  });

  const sequence = String(todayCount + 1).padStart(4, "0");
  this.code = `SPR-${dateCode}-${sequence}`;

  next();
});

const Spare = mongoose.model("Spare", spareSchema);
module.exports = Spare;
