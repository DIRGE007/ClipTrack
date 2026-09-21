const express = require("express");

const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getAppointments);

router.get("/:id", authenticateToken, getAppointmentById);

router.post("/", authenticateToken, createAppointment);

router.put("/:id", authenticateToken, updateAppointment);

router.patch("/:id/status", authenticateToken, updateAppointmentStatus);

router.delete("/:id", authenticateToken, deleteAppointment);

module.exports = router;
