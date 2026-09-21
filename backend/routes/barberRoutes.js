const express = require("express");

const {
  getBarbers,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
} = require("../controllers/barberController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getBarbers);

router.get("/:id", authenticateToken, getBarberById);

router.post("/", authenticateToken, createBarber);

router.put("/:id", authenticateToken, updateBarber);

router.delete("/:id", authenticateToken, deleteBarber);

module.exports = router;
