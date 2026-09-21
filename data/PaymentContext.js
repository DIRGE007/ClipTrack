import React, { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatPayment = (payment) => {
    return {
      id: payment.id,

      paymentId: payment.id,

      transactionId:
        payment.transaction_number ||
        `TRX-${String(payment.id).padStart(6, "0")}`,

      appointmentId: payment.appointment_id || null,

      customerId: payment.customer_id || null,

      customer: payment.customer_name || payment.customer || "",

      barberId: payment.barber_id || null,

      barber: payment.barber_name || payment.barber || "",

      serviceId: payment.service_id || null,

      service: payment.service_name || payment.service || "",

      price: Number(payment.price || 0),

      amountPaid: Number(payment.amount_paid ?? payment.amountPaid ?? 0),

      change: Number(payment.change_amount ?? payment.change ?? 0),

      paymentMethod: payment.payment_method || payment.paymentMethod || "Cash",

      status: payment.status || "Paid",

      date: payment.payment_date || payment.date || "",

      time: payment.payment_time || payment.time || "",
    };
  };

  const fetchPayments = async (token = null) => {
    try {
      setLoading(true);

      const result = await apiRequest("/payments", "GET", null, token);

      console.log("PAYMENTS API RESULT:", result);

      if (result.success && Array.isArray(result.data)) {
        const formattedPayments = result.data.map(formatPayment);

        setPayments(formattedPayments);
      } else {
        setPayments([]);
      }

      return result;
    } catch (error) {
      console.error("Fetch payments error:", error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (payment, token = null) => {
    try {
      const result = await apiRequest("/payments", "POST", payment, token);

      console.log("CREATE PAYMENT RESULT:", result);

      if (result.success) {
        await fetchPayments(token);
      }

      return result;
    } catch (error) {
      console.error("Add payment error:", error);

      throw error;
    }
  };

  const deletePayment = async (paymentId, token = null) => {
    try {
      const savedToken = token || localStorage.getItem("cliptrack_token");

      console.log("DELETE PAYMENT ID:", paymentId);

      const result = await apiRequest(
        `/payments/${Number(paymentId)}`,
        "DELETE",
        null,
        savedToken,
      );

      console.log("DELETE PAYMENT RESULT:", result);

      if (result && result.success === true) {
        setPayments((currentPayments) =>
          currentPayments.filter(
            (payment) => Number(payment.id) !== Number(paymentId),
          ),
        );

        // Get the latest data from MySQL
        await fetchPayments(savedToken);
      }

      return result;
    } catch (error) {
      console.error("Delete payment error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("cliptrack_token");

    if (token) {
      fetchPayments(token).catch((error) => {
        console.error("Initial payment loading error:", error);
      });
    }
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        payments,
        loading,
        fetchPayments,
        addPayment,
        deletePayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  return useContext(PaymentContext);
}
