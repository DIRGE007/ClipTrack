const db = require("../config/db");

// ==========================================
// GET ALL SERVICES
// ==========================================
const getServices = async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT
        id,
        name,
        category,
        duration,
        price,
        status,
        description,
        created_at
      FROM services
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get services.",
      error: error.message,
    });
  }
};

// ==========================================
// GET SERVICE BY ID
// ==========================================
const getServiceById = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);

    if (!Number.isInteger(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const [services] = await db.query(
      `
      SELECT
        id,
        name,
        category,
        duration,
        price,
        status,
        description,
        created_at
      FROM services
      WHERE id = ?
      `,
      [serviceId],
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.json({
      success: true,
      data: services[0],
    });
  } catch (error) {
    console.error("Get service by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get service.",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE SERVICE
// ==========================================
const createService = async (req, res) => {
  try {
    const { name, category, duration, price, status, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required.",
      });
    }

    const serviceDuration = Number(duration);
    const servicePrice = Number(price);

    if (!Number.isFinite(serviceDuration) || serviceDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid service duration is required.",
      });
    }

    if (!Number.isFinite(servicePrice) || servicePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid service price is required.",
      });
    }

    const serviceStatus = status === "Inactive" ? "Inactive" : "Active";

    const [result] = await db.query(
      `
      INSERT INTO services
      (
        name,
        category,
        duration,
        price,
        status,
        description
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        category ? category.trim() : null,
        serviceDuration,
        servicePrice,
        serviceStatus,
        description ? description.trim() : null,
      ],
    );

    const [services] = await db.query(
      `
      SELECT
        id,
        name,
        category,
        duration,
        price,
        status,
        description,
        created_at
      FROM services
      WHERE id = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: services[0],
    });
  } catch (error) {
    console.error("Create service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create service.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SERVICE
// ==========================================
const updateService = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);

    const { name, category, duration, price, status, description } = req.body;

    if (!Number.isInteger(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required.",
      });
    }

    if (status !== "Active" && status !== "Inactive") {
      return res.status(400).json({
        success: false,
        message: "Invalid service status.",
      });
    }

    const serviceDuration = Number(duration);
    const servicePrice = Number(price);

    if (!Number.isFinite(serviceDuration) || serviceDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid service duration is required.",
      });
    }

    if (!Number.isFinite(servicePrice) || servicePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid service price is required.",
      });
    }

    const [existingService] = await db.query(
      `
      SELECT id
      FROM services
      WHERE id = ?
      `,
      [serviceId],
    );

    if (existingService.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    await db.query(
      `
      UPDATE services
      SET
        name = ?,
        category = ?,
        duration = ?,
        price = ?,
        status = ?,
        description = ?
      WHERE id = ?
      `,
      [
        name.trim(),
        category ? category.trim() : null,
        serviceDuration,
        servicePrice,
        status,
        description ? description.trim() : null,
        serviceId,
      ],
    );

    const [updatedServices] = await db.query(
      `
      SELECT
        id,
        name,
        category,
        duration,
        price,
        status,
        description,
        created_at
      FROM services
      WHERE id = ?
      `,
      [serviceId],
    );

    res.json({
      success: true,
      message: "Service updated successfully.",
      data: updatedServices[0],
    });
  } catch (error) {
    console.error("Update service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update service.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE SERVICE
// ==========================================
const deleteService = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);

    if (!Number.isInteger(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const [result] = await db.query(
      `
      DELETE FROM services
      WHERE id = ?
      `,
      [serviceId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Service cannot be deleted because it has related appointments or payments.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete service.",
      error: error.message,
    });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
