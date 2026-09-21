const db = require("../config/db");

// ==========================================
// GET ALL CUSTOMERS
// WITH APPOINTMENT INFORMATION
// ==========================================

const getCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT
        c.id,
        c.name,
        c.phone,
        c.address,
        c.created_at,

        a.id AS appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status AS appointment_status,

        b.id AS barber_id,
        b.name AS barber_name,

        s.id AS service_id,
        s.name AS service_name,
        s.price AS service_price

      FROM customers c

      LEFT JOIN appointments a
        ON a.id = (
          SELECT a2.id
          FROM appointments a2
          WHERE a2.customer_id = c.id
          ORDER BY
            a2.appointment_date DESC,
            a2.appointment_time DESC,
            a2.id DESC
          LIMIT 1
        )

      LEFT JOIN barbers b
        ON a.barber_id = b.id

      LEFT JOIN services s
        ON a.service_id = s.id

      ORDER BY c.id DESC
    `);

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customers.",
      error: error.message,
    });
  }
};

// ==========================================
// GET CUSTOMER BY ID
// WITH APPOINTMENT INFORMATION
// ==========================================

const getCustomerById = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const [customers] = await db.query(
      `
      SELECT
        c.id,
        c.name,
        c.phone,
        c.address,
        c.created_at,

        a.id AS appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status AS appointment_status,

        b.id AS barber_id,
        b.name AS barber_name,

        s.id AS service_id,
        s.name AS service_name,
        s.price AS service_price

      FROM customers c

      LEFT JOIN appointments a
        ON a.id = (
          SELECT a2.id
          FROM appointments a2
          WHERE a2.customer_id = c.id
          ORDER BY
            a2.appointment_date DESC,
            a2.appointment_time DESC,
            a2.id DESC
          LIMIT 1
        )

      LEFT JOIN barbers b
        ON a.barber_id = b.id

      LEFT JOIN services s
        ON a.service_id = s.id

      WHERE c.id = ?
      `,
      [customerId],
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    res.json({
      success: true,
      data: customers[0],
    });
  } catch (error) {
    console.error("Get customer by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customer.",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE CUSTOMER
// ==========================================

const createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO customers
      (
        name,
        phone,
        address
      )
      VALUES (?, ?, ?)
      `,
      [
        name.trim(),
        phone ? phone.trim() : null,
        address ? address.trim() : null,
      ],
    );

    const [customers] = await db.query(
      `
        SELECT
          id,
          name,
          phone,
          address,
          created_at
        FROM customers
        WHERE id = ?
        `,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: customers[0],
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE CUSTOMER
// ==========================================

const updateCustomer = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    const { name, phone, address } = req.body;

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    const [existingCustomer] = await db.query(
      `
        SELECT id
        FROM customers
        WHERE id = ?
        `,
      [customerId],
    );

    if (existingCustomer.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    await db.query(
      `
      UPDATE customers
      SET
        name = ?,
        phone = ?,
        address = ?
      WHERE id = ?
      `,
      [
        name.trim(),
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        customerId,
      ],
    );

    const [updatedCustomers] = await db.query(
      `
        SELECT
          id,
          name,
          phone,
          address,
          created_at
        FROM customers
        WHERE id = ?
        `,
      [customerId],
    );

    res.json({
      success: true,
      message: "Customer updated successfully.",
      data: updatedCustomers[0],
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE CUSTOMER
// ==========================================

const deleteCustomer = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get customer payments
      const [payments] = await connection.query(
        `
          SELECT id
          FROM payments
          WHERE customer_id = ?
          `,
        [customerId],
      );

      const paymentIds = payments.map((payment) => payment.id);

      // Delete transactions
      if (paymentIds.length > 0) {
        await connection.query(
          `
          DELETE FROM transactions
          WHERE payment_id IN (?)
          `,
          [paymentIds],
        );
      }

      // Delete payments
      await connection.query(
        `
        DELETE FROM payments
        WHERE customer_id = ?
        `,
        [customerId],
      );

      // Delete appointments
      await connection.query(
        `
        DELETE FROM appointments
        WHERE customer_id = ?
        `,
        [customerId],
      );

      // Delete customer
      const [result] = await connection.query(
        `
          DELETE FROM customers
          WHERE id = ?
          `,
        [customerId],
      );

      if (result.affectedRows === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }

      await connection.commit();

      res.json({
        success: true,
        message: "Customer deleted successfully.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete customer.",
      error: error.message,
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
