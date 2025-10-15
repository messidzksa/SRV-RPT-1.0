const express = require("express");
const serviceReportRoutes = require("./routers/formRouter");
const customerRoutes = require("./routers/customerRouter");
const spareRoutes = require("./routers/sparePartsRouter");
const connectDB = require("./db");
require("dotenv").config();
const morgan = require("morgan");
const userRouter = require("./routers/userRouter");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./utils/globalErrorHandler");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");
const app = express();
connectDB()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => {
    console.error("DB Connection failed:", err);
    process.exit(1);
  });
// Middleware
// Allow requests from your frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(morgan("dev"));
// Logging
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/spares", spareRoutes);
app.use("/api/v1", serviceReportRoutes);
// Error handling
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running locally on http://localhost:${PORT}`);
  });
}
module.exports = app;
