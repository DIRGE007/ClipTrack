const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const customerRoutes = require("./routes/customerRoutes");
const barberRoutes = require("./routes/barberRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// AUTH
app.use("/api/auth", authRoutes);

// CUSTOMERS
app.use("/api/customers", customerRoutes);

// BARBERS
app.use("/api/barbers", barberRoutes);

// SERVICES
app.use("/api/services", serviceRoutes);

// APPOINTMENTS
app.use("/api/appointments", appointmentRoutes);

// PAYMENTS
app.use("/api/payments", paymentRoutes);

// TRANSACTIONS
app.use("/api/transactions", transactionRoutes);

// REPORTS
app.use("/api/reports", reportRoutes);

// HOME
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ClipTrack Backend API is running!",
  });
});

// TEST DATABASE
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "MySQL database connected successfully!",
      data: rows,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`ClipTrack Backend running on port ${PORT}`);
});
