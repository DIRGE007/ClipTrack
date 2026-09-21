const express = require("express");

const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getPayments);

router.get("/:id", authenticateToken, getPaymentById);

router.post("/", authenticateToken, createPayment);

router.put("/:id", authenticateToken, updatePayment);

router.delete("/:id", authenticateToken, deletePayment);

module.exports = router;
