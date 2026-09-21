const express = require("express");

const {
  getTransactions,
  getTransactionById,
} = require("../controllers/transactionController");

const router = express.Router();

// GET ALL TRANSACTIONS
router.get("/", getTransactions);

// GET TRANSACTION BY ID
router.get("/:id", getTransactionById);

module.exports = router;
