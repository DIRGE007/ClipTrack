const db = require("../config/db");

// GET ALL TRANSACTIONS
const getTransactions = async (req, res) => {
  try {
    const [transactions] = await db.query(`
      SELECT
        t.id,
        t.transaction_number,
        t.payment_id,

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

        t.created_at
      FROM transactions t

      INNER JOIN payments p
        ON t.payment_id = p.id

      INNER JOIN customers c
        ON p.customer_id = c.id

      INNER JOIN barbers b
        ON p.barber_id = b.id

      INNER JOIN services s
        ON p.service_id = s.id

      ORDER BY t.id DESC
    `);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get transactions.",
      error: error.message,
    });
  }
};

// GET TRANSACTION BY ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [transactions] = await db.query(
      `
      SELECT
        t.id,
        t.transaction_number,
        t.payment_id,

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

        t.created_at
      FROM transactions t

      INNER JOIN payments p
        ON t.payment_id = p.id

      INNER JOIN customers c
        ON p.customer_id = c.id

      INNER JOIN barbers b
        ON p.barber_id = b.id

      INNER JOIN services s
        ON p.service_id = s.id

      WHERE t.id = ?
      `,
      [id],
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    res.json({
      success: true,
      data: transactions[0],
    });
  } catch (error) {
    console.error("Get transaction error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get transaction.",
      error: error.message,
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
};
