const express = require("express");

const {
  getDashboardReport,
  getSalesReport,
  getServiceSalesReport,
  getPaymentMethodReport,
  getAppointmentReport,
} = require("../controllers/reportController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// DASHBOARD
router.get("/dashboard", authenticateToken, getDashboardReport);

// SALES
router.get("/sales", authenticateToken, getSalesReport);

// SERVICE SALES
router.get("/services", authenticateToken, getServiceSalesReport);

// PAYMENT METHODS
router.get("/payments", authenticateToken, getPaymentMethodReport);

// APPOINTMENTS
router.get("/appointments", authenticateToken, getAppointmentReport);

module.exports = router;
