const express = require("express");

const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getCustomers);

router.get("/:id", authenticateToken, getCustomerById);

router.post("/", authenticateToken, createCustomer);

router.put("/:id", authenticateToken, updateCustomer);

router.delete("/:id", authenticateToken, deleteCustomer);

module.exports = router;
