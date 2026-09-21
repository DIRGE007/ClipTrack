const db = require("../config/db");

// GET ALL PAYMENTS
const getPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.appointment_id,
        p.customer_id,
        c.name AS customer_name,
        p.barber_id,
        b.name AS barber_name,
        p.service_id,
        s.name AS service_name,
        p.price,
        p.amount_paid,
        p.change_amount,
        p.payment_method,
        p.status,
        p.payment_date,
        p.payment_time,
        p.created_at
      FROM payments p
      INNER JOIN customers c
        ON p.customer_id = c.id
      INNER JOIN barbers b
        ON p.barber_id = b.id
      INNER JOIN services s
        ON p.service_id = s.id
      ORDER BY p.id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments.",
      error: error.message,
    });
  }
};

// GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
  const paymentId = Number(req.params.id);

  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID.",
    });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.appointment_id,
        p.customer_id,
        c.name AS customer_name,
        p.barber_id,
        b.name AS barber_name,
        p.service_id,
        s.name AS service_name,
        p.price,
        p.amount_paid,
        p.change_amount,
        p.payment_method,
        p.status,
        p.payment_date,
        p.payment_time,
        p.created_at
      FROM payments p
      INNER JOIN customers c
        ON p.customer_id = c.id
      INNER JOIN barbers b
        ON p.barber_id = b.id
      INNER JOIN services s
        ON p.service_id = s.id
      WHERE p.id = ?
      `,
      [paymentId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment.",
      error: error.message,
    });
  }
};

// CREATE PAYMENT
const createPayment = async (req, res) => {
  const {
    appointment_id,
    customer_id,
    barber_id,
    service_id,
    price,
    amount_paid,
    payment_method,
    status = "Paid",
  } = req.body;

  const appointmentId =
    appointment_id === null ||
    appointment_id === undefined ||
    appointment_id === ""
      ? null
      : Number(appointment_id);

  const customerId = Number(customer_id);
  const barberId = Number(barber_id);
  const serviceId = Number(service_id);
  const servicePrice = Number(price);
  const amountPaid = Number(amount_paid);

  if (
    !Number.isInteger(customerId) ||
    !Number.isInteger(barberId) ||
    !Number.isInteger(serviceId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer, barber, or service.",
    });
  }

  if (!Number.isFinite(servicePrice) || servicePrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid service price.",
    });
  }

  if (!Number.isFinite(amountPaid) || amountPaid < servicePrice) {
    return res.status(400).json({
      success: false,
      message:
        "Amount paid must be greater than or equal to the service price.",
    });
  }

  if (!["Cash", "GCash"].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: "Payment method must be Cash or GCash.",
    });
  }

  if (!["Paid", "Refunded"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment status.",
    });
  }

  const changeAmount = amountPaid - servicePrice;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check customer
    const [customerRows] = await connection.query(
      `SELECT id FROM customers WHERE id = ?`,
      [customerId],
    );

    if (customerRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Check barber
    const [barberRows] = await connection.query(
      `SELECT id FROM barbers WHERE id = ?`,
      [barberId],
    );

    if (barberRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Barber not found.",
      });
    }

    // Check service
    const [serviceRows] = await connection.query(
      `
      SELECT id, price, status
      FROM services
      WHERE id = ?
      `,
      [serviceId],
    );

    if (serviceRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (serviceRows[0].status !== "Active") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "This service is currently inactive.",
      });
    }

    // Check appointment if provided
    if (appointmentId !== null) {
      const [appointmentRows] = await connection.query(
        `
        SELECT
          id,
          customer_id,
          barber_id,
          service_id
        FROM appointments
        WHERE id = ?
        `,
        [appointmentId],
      );

      if (appointmentRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      const appointment = appointmentRows[0];

      if (
        Number(appointment.customer_id) !== customerId ||
        Number(appointment.barber_id) !== barberId ||
        Number(appointment.service_id) !== serviceId
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Payment details do not match the selected appointment.",
        });
      }
    }

    // Insert payment
    const [paymentResult] = await connection.query(
      `
        INSERT INTO payments (
          appointment_id,
          customer_id,
          barber_id,
          service_id,
          price,
          amount_paid,
          change_amount,
          payment_method,
          status,
          payment_date,
          payment_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())
        `,
      [
        appointmentId,
        customerId,
        barberId,
        serviceId,
        servicePrice,
        amountPaid,
        changeAmount,
        payment_method,
        status,
      ],
    );

    const paymentId = paymentResult.insertId;

    // Create transaction number
    const transactionNumber = `TRX-${String(paymentId).padStart(6, "0")}`;

    await connection.query(
      `
      INSERT INTO transactions (
        payment_id,
        transaction_number
      )
      VALUES (?, ?)
      `,
      [paymentId, transactionNumber],
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      data: {
        payment_id: paymentId,
        transaction_number: transactionNumber,
        price: servicePrice,
        amount_paid: amountPaid,
        change_amount: changeAmount,
        payment_method,
        status,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment.",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// UPDATE PAYMENT
const updatePayment = async (req, res) => {
  const paymentId = Number(req.params.id);

  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID.",
    });
  }

  const { amount_paid, payment_method, status } = req.body;

  const amountPaid = Number(amount_paid);

  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid amount paid.",
    });
  }

  if (!["Cash", "GCash"].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: "Payment method must be Cash or GCash.",
    });
  }

  if (!["Paid", "Refunded"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment status.",
    });
  }

  try {
    const [paymentRows] = await db.query(
      `
        SELECT price
        FROM payments
        WHERE id = ?
        `,
      [paymentId],
    );

    if (paymentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    const price = Number(paymentRows[0].price);

    if (amountPaid < price) {
      return res.status(400).json({
        success: false,
        message:
          "Amount paid must be greater than or equal to the service price.",
      });
    }

    const changeAmount = amountPaid - price;

    await db.query(
      `
      UPDATE payments
      SET
        amount_paid = ?,
        change_amount = ?,
        payment_method = ?,
        status = ?
      WHERE id = ?
      `,
      [amountPaid, changeAmount, payment_method, status, paymentId],
    );

    return res.json({
      success: true,
      message: "Payment updated successfully.",
    });
  } catch (error) {
    console.error("Update payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment.",
      error: error.message,
    });
  }
};

// DELETE PAYMENT
const deletePayment = async (req, res) => {
  const paymentId = Number(req.params.id);

  console.log("=================================");
  console.log("DELETE PAYMENT REQUEST");
  console.log("Payment ID:", paymentId);
  console.log("=================================");

  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID.",
    });
  }

  try {
    // 1. Check payment exists
    const [paymentRows] = await db.query(
      `
      SELECT id
      FROM payments
      WHERE id = ?
      `,
      [paymentId],
    );

    console.log("Payment found:", paymentRows);

    if (paymentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    // 2. Delete transaction connected to payment
    const [transactionResult] = await db.query(
      `
      DELETE FROM transactions
      WHERE payment_id = ?
      `,
      [paymentId],
    );

    console.log("Transaction deleted:", transactionResult.affectedRows);

    // 3. Delete payment
    const [paymentResult] = await db.query(
      `
      DELETE FROM payments
      WHERE id = ?
      `,
      [paymentId],
    );

    console.log("Payment deleted:", paymentResult.affectedRows);

    if (paymentResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Payment was not deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully.",
      deletedId: paymentId,
    });
  } catch (error) {
    console.error("DELETE PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete payment.",
      error: error.message,
    });
  }
};
module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};
