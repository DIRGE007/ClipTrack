const db = require("../config/db");

// ==========================================
// GET ALL APPOINTMENTS
// ==========================================

const getAppointments = async (req, res) => {
  try {
    const [appointments] = await db.query(`
      SELECT
        a.id,
        a.customer_id,
        c.name AS customer_name,

        a.barber_id,
        b.name AS barber_name,

        a.service_id,
        s.name AS service_name,
        s.price AS service_price,

        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at

      FROM appointments a

      INNER JOIN customers c
        ON a.customer_id = c.id

      INNER JOIN barbers b
        ON a.barber_id = b.id

      INNER JOIN services s
        ON a.service_id = s.id

      ORDER BY
        a.appointment_date DESC,
        a.appointment_time DESC,
        a.id DESC
    `);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Get appointments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get appointments.",
      error: error.message,
    });
  }
};

// ==========================================
// GET APPOINTMENT BY ID
// ==========================================

const getAppointmentById = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const [appointments] = await db.query(
      `
      SELECT
        a.id,
        a.customer_id,
        c.name AS customer_name,

        a.barber_id,
        b.name AS barber_name,

        a.service_id,
        s.name AS service_name,
        s.price AS service_price,

        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at

      FROM appointments a

      INNER JOIN customers c
        ON a.customer_id = c.id

      INNER JOIN barbers b
        ON a.barber_id = b.id

      INNER JOIN services s
        ON a.service_id = s.id

      WHERE a.id = ?
      `,
      [appointmentId],
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    res.json({
      success: true,
      data: appointments[0],
    });
  } catch (error) {
    console.error("Get appointment by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get appointment.",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE APPOINTMENT
// ==========================================

const createAppointment = async (req, res) => {
  try {
    const {
      customer_id,
      barber_id,
      service_id,
      appointment_date,
      appointment_time,
      status,
    } = req.body;

    // ------------------------------
    // VALIDATION
    // ------------------------------

    if (
      !customer_id ||
      !barber_id ||
      !service_id ||
      !appointment_date ||
      !appointment_time
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer, barber, service, date, and time are required.",
      });
    }

    const customerId = Number(customer_id);
    const barberId = Number(barber_id);
    const serviceId = Number(service_id);

    if (
      !Number.isInteger(customerId) ||
      !Number.isInteger(barberId) ||
      !Number.isInteger(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer, barber, or service ID.",
      });
    }

    // ------------------------------
    // CHECK CUSTOMER
    // ------------------------------

    const [customers] = await db.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
      `,
      [customerId],
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // ------------------------------
    // CHECK BARBER
    // ------------------------------

    const [barbers] = await db.query(
      `
      SELECT
        id,
        name,
        status
      FROM barbers
      WHERE id = ?
      `,
      [barberId],
    );

    if (barbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Barber not found.",
      });
    }

    if (barbers[0].status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Selected barber is unavailable.",
      });
    }

    // ------------------------------
    // CHECK SERVICE
    // ------------------------------

    const [services] = await db.query(
      `
      SELECT
        id,
        name,
        price,
        status
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

    if (services[0].status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Selected service is inactive.",
      });
    }

    // ------------------------------
    // CHECK BARBER SCHEDULE CONFLICT
    // ------------------------------

    const [existingAppointments] = await db.query(
      `
        SELECT id
        FROM appointments
        WHERE
          barber_id = ?
          AND appointment_date = ?
          AND appointment_time = ?
          AND status IN (
            'Pending',
            'Confirmed'
          )
        `,
      [barberId, appointment_date, appointment_time],
    );

    if (existingAppointments.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "The selected barber already has an appointment at this date and time.",
      });
    }

    // ------------------------------
    // APPOINTMENT STATUS
    // ------------------------------

    const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

    const appointmentStatus = allowedStatuses.includes(status)
      ? status
      : "Pending";

    // ------------------------------
    // INSERT APPOINTMENT
    // ------------------------------

    const [result] = await db.query(
      `
      INSERT INTO appointments
      (
        customer_id,
        barber_id,
        service_id,
        appointment_date,
        appointment_time,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        customerId,
        barberId,
        serviceId,
        appointment_date,
        appointment_time,
        appointmentStatus,
      ],
    );

    // ------------------------------
    // GET CREATED APPOINTMENT
    // ------------------------------

    const [appointments] = await db.query(
      `
      SELECT
        a.id,
        a.customer_id,
        c.name AS customer_name,

        a.barber_id,
        b.name AS barber_name,

        a.service_id,
        s.name AS service_name,
        s.price AS service_price,

        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at

      FROM appointments a

      INNER JOIN customers c
        ON a.customer_id = c.id

      INNER JOIN barbers b
        ON a.barber_id = b.id

      INNER JOIN services s
        ON a.service_id = s.id

      WHERE a.id = ?
      `,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully.",
      data: appointments[0],
    });
  } catch (error) {
    console.error("Create appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create appointment.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE APPOINTMENT
// ==========================================

const updateAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    const {
      customer_id,
      barber_id,
      service_id,
      appointment_date,
      appointment_time,
      status,
    } = req.body;

    if (!Number.isInteger(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    if (
      !customer_id ||
      !barber_id ||
      !service_id ||
      !appointment_date ||
      !appointment_time
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer, barber, service, date, and time are required.",
      });
    }

    const customerId = Number(customer_id);
    const barberId = Number(barber_id);
    const serviceId = Number(service_id);

    // ------------------------------
    // CHECK EXISTING APPOINTMENT
    // ------------------------------

    const [existingAppointment] = await db.query(
      `
        SELECT id
        FROM appointments
        WHERE id = ?
        `,
      [appointmentId],
    );

    if (existingAppointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // ------------------------------
    // CHECK CUSTOMER
    // ------------------------------

    const [customers] = await db.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
      `,
      [customerId],
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // ------------------------------
    // CHECK BARBER
    // ------------------------------

    const [barbers] = await db.query(
      `
      SELECT id, name, status
      FROM barbers
      WHERE id = ?
      `,
      [barberId],
    );

    if (barbers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Barber not found.",
      });
    }

    if (barbers[0].status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Selected barber is unavailable.",
      });
    }

    // ------------------------------
    // CHECK SERVICE
    // ------------------------------

    const [services] = await db.query(
      `
      SELECT id, name, price, status
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

    if (services[0].status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Selected service is inactive.",
      });
    }

    // ------------------------------
    // CHECK CONFLICT
    // ------------------------------

    const [conflicts] = await db.query(
      `
      SELECT id
      FROM appointments
      WHERE
        barber_id = ?
        AND appointment_date = ?
        AND appointment_time = ?
        AND status IN (
          'Pending',
          'Confirmed'
        )
        AND id != ?
      `,
      [barberId, appointment_date, appointment_time, appointmentId],
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "The selected barber already has an appointment at this date and time.",
      });
    }

    // ------------------------------
    // VALIDATE STATUS
    // ------------------------------

    const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

    const appointmentStatus = allowedStatuses.includes(status)
      ? status
      : "Pending";

    // ------------------------------
    // UPDATE
    // ------------------------------

    await db.query(
      `
      UPDATE appointments
      SET
        customer_id = ?,
        barber_id = ?,
        service_id = ?,
        appointment_date = ?,
        appointment_time = ?,
        status = ?
      WHERE id = ?
      `,
      [
        customerId,
        barberId,
        serviceId,
        appointment_date,
        appointment_time,
        appointmentStatus,
        appointmentId,
      ],
    );

    // ------------------------------
    // GET UPDATED APPOINTMENT
    // ------------------------------

    const [appointments] = await db.query(
      `
        SELECT
          a.id,
          a.customer_id,
          c.name AS customer_name,

          a.barber_id,
          b.name AS barber_name,

          a.service_id,
          s.name AS service_name,
          s.price AS service_price,

          a.appointment_date,
          a.appointment_time,
          a.status,
          a.created_at

        FROM appointments a

        INNER JOIN customers c
          ON a.customer_id = c.id

        INNER JOIN barbers b
          ON a.barber_id = b.id

        INNER JOIN services s
          ON a.service_id = s.id

        WHERE a.id = ?
        `,
      [appointmentId],
    );

    res.json({
      success: true,
      message: "Appointment updated successfully.",
      data: appointments[0],
    });
  } catch (error) {
    console.error("Update appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update appointment.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE APPOINTMENT
// ==========================================

const deleteAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const [result] = await db.query(
      `
      DELETE FROM appointments
      WHERE id = ?
      `,
      [appointmentId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    res.json({
      success: true,
      message: "Appointment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete appointment.",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE APPOINTMENT STATUS ONLY
// ===============================
const updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status.",
      });
    }

    const [appointmentRows] = await db.query(
      `
      SELECT id
      FROM appointments
      WHERE id = ?
      `,
      [appointmentId],
    );

    if (appointmentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    await db.query(
      `
      UPDATE appointments
      SET status = ?
      WHERE id = ?
      `,
      [status, appointmentId],
    );

    const [updatedRows] = await db.query(
      `
      SELECT
        a.id,
        a.customer_id,
        c.name AS customer_name,
        a.barber_id,
        b.name AS barber_name,
        a.service_id,
        s.name AS service_name,
        s.price AS service_price,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.created_at
      FROM appointments a
      INNER JOIN customers c
        ON a.customer_id = c.id
      INNER JOIN barbers b
        ON a.barber_id = b.id
      INNER JOIN services s
        ON a.service_id = s.id
      WHERE a.id = ?
      `,
      [appointmentId],
    );

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully.",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Update appointment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status.",
      error: error.message,
    });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};
