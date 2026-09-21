const db = require("../config/db");

// GET ALL BARBERS
const getBarbers = async (req, res) => {
  try {
    const [barbers] = await db.query("SELECT * FROM barbers ORDER BY id DESC");

    res.json({
      success: true,
      data: barbers,
    });
  } catch (error) {
    console.error("Get barbers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get barbers.",
      error: error.message,
    });
  }
};

// GET BARBER BY ID
const getBarberById = async (req, res) => {
  try {
    const { id } = req.params;

    const [barbers] = await db.query("SELECT * FROM barbers WHERE id = ?", [
      id,
    ]);

    if (barbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Barber not found.",
      });
    }

    res.json({
      success: true,
      data: barbers[0],
    });
  } catch (error) {
    console.error("Get barber error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get barber.",
      error: error.message,
    });
  }
};

// CREATE BARBER
const createBarber = async (req, res) => {
  try {
    const { name, phone, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Barber name is required.",
      });
    }

    const barberStatus = status || "Available";

    if (!["Available", "Unavailable"].includes(barberStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid barber status.",
      });
    }

    const [result] = await db.query(
      `INSERT INTO barbers
      (name, phone, status)
      VALUES (?, ?, ?)`,
      [name.trim(), phone || null, barberStatus],
    );

    const [newBarber] = await db.query("SELECT * FROM barbers WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Barber created successfully.",
      data: newBarber[0],
    });
  } catch (error) {
    console.error("Create barber error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create barber.",
      error: error.message,
    });
  }
};

// UPDATE BARBER
const updateBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, phone, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Barber name is required.",
      });
    }

    if (!["Available", "Unavailable"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid barber status.",
      });
    }

    const [existingBarber] = await db.query(
      "SELECT * FROM barbers WHERE id = ?",
      [id],
    );

    if (existingBarber.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Barber not found.",
      });
    }

    await db.query(
      `UPDATE barbers
       SET name = ?, phone = ?, status = ?
       WHERE id = ?`,
      [name.trim(), phone || null, status, id],
    );

    const [updatedBarber] = await db.query(
      "SELECT * FROM barbers WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Barber updated successfully.",
      data: updatedBarber[0],
    });
  } catch (error) {
    console.error("Update barber error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update barber.",
      error: error.message,
    });
  }
};

// DELETE BARBER
const deleteBarber = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingBarber] = await db.query(
      "SELECT * FROM barbers WHERE id = ?",
      [id],
    );

    if (existingBarber.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Barber not found.",
      });
    }

    await db.query("DELETE FROM barbers WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Barber deleted successfully.",
    });
  } catch (error) {
    console.error("Delete barber error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete barber.",
      error: error.message,
    });
  }
};

module.exports = {
  getBarbers,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
};
