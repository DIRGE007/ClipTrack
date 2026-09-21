const db = require("../config/db");

// ==========================================
// DASHBOARD REPORT
// ==========================================
const getDashboardReport = async (req, res) => {
  try {
    const [customerResult] = await db.query(`
      SELECT COUNT(*) AS total_customers
      FROM customers
    `);

    const [appointmentResult] = await db.query(`
      SELECT COUNT(*) AS today_appointments
      FROM appointments
      WHERE appointment_date = CURDATE()
    `);

    const [serviceResult] = await db.query(`
      SELECT COUNT(*) AS total_services
      FROM services
      WHERE status = 'Active'
    `);

    const [salesResult] = await db.query(`
      SELECT COALESCE(SUM(price), 0) AS today_sales
      FROM payments
      WHERE payment_date = CURDATE()
      AND status = 'Paid'
    `);

    const [appointmentList] = await db.query(`
      SELECT
        a.id,
        a.customer_id,
        c.name AS customer_name,
        a.barber_id,
        b.name AS barber_name,
        a.service_id,
        s.name AS service_name,
        a.appointment_date,
        a.appointment_time,
        a.status
      FROM appointments a
      INNER JOIN customers c
        ON a.customer_id = c.id
      INNER JOIN barbers b
        ON a.barber_id = b.id
      INNER JOIN services s
        ON a.service_id = s.id
      WHERE a.appointment_date = CURDATE()
      ORDER BY a.appointment_time ASC
    `);

    res.json({
      success: true,
      data: {
        customers: Number(customerResult[0].total_customers),
        appointments: Number(appointmentResult[0].today_appointments),
        services: Number(serviceResult[0].total_services),
        sales: Number(salesResult[0].today_sales),
        todayAppointments: appointmentList,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data.",
      error: error.message,
    });
  }
};

// ==========================================
// SALES REPORT
// ==========================================
const getSalesReport = async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT
        p.id,
        t.transaction_number,

        c.name AS customer_name,
        b.name AS barber_name,
        s.name AS service_name,

        p.price,
        p.amount_paid,
        p.change_amount,
        p.payment_method,
        p.status,

        p.payment_date,
        p.payment_time

      FROM payments p

      INNER JOIN transactions t
        ON p.id = t.payment_id

      INNER JOIN customers c
        ON p.customer_id = c.id

      INNER JOIN barbers b
        ON p.barber_id = b.id

      INNER JOIN services s
        ON p.service_id = s.id

      WHERE p.status = 'Paid'

      ORDER BY
        p.payment_date DESC,
        p.payment_time DESC
    `);

    res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("Sales report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get sales report.",
      error: error.message,
    });
  }
};

// ==========================================
// SERVICE SALES REPORT
// ==========================================
const getServiceSalesReport = async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT
        s.id,
        s.name AS service,
        s.category,
        s.price,

        COUNT(
          CASE
            WHEN p.status = 'Paid'
            THEN p.id
          END
        ) AS transactions,

        COALESCE(
          SUM(
            CASE
              WHEN p.status = 'Paid'
              THEN p.price
              ELSE 0
            END
          ),
          0
        ) AS sales

      FROM services s

      LEFT JOIN payments p
        ON s.id = p.service_id

      GROUP BY
        s.id,
        s.name,
        s.category,
        s.price

      ORDER BY sales DESC, s.name ASC
    `);

    const formattedServices = services.map((service) => ({
      ...service,
      transactions: Number(service.transactions),
      sales: Number(service.sales),
      price: Number(service.price),
    }));

    res.json({
      success: true,
      data: formattedServices,
    });
  } catch (error) {
    console.error("Service sales report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get service sales report.",
      error: error.message,
    });
  }
};

// ==========================================
// PAYMENT METHOD REPORT
// ==========================================
const getPaymentMethodReport = async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT
        payment_method,

        COUNT(*) AS transactions,

        COALESCE(
          SUM(price),
          0
        ) AS total_sales

      FROM payments

      WHERE status = 'Paid'

      GROUP BY payment_method

      ORDER BY total_sales DESC
    `);

    const formattedPayments = payments.map((payment) => ({
      payment_method: payment.payment_method,

      transactions: Number(payment.transactions),

      total_sales: Number(payment.total_sales),
    }));

    res.json({
      success: true,
      data: formattedPayments,
    });
  } catch (error) {
    console.error("Payment method report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get payment method report.",
      error: error.message,
    });
  }
};

// ==========================================
// APPOINTMENT REPORT
// ==========================================
const getAppointmentReport = async (req, res) => {
  try {
    const [appointments] = await db.query(`
        SELECT
          status,
          COUNT(*) AS total

        FROM appointments

        GROUP BY status

        ORDER BY total DESC
      `);

    const formattedAppointments = appointments.map((appointment) => ({
      status: appointment.status,

      total: Number(appointment.total),
    }));

    res.json({
      success: true,
      data: formattedAppointments,
    });
  } catch (error) {
    console.error("Appointment report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get appointment report.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardReport,
  getSalesReport,
  getServiceSalesReport,
  getPaymentMethodReport,
  getAppointmentReport,
};
