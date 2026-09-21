import React, { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("cliptrack_token");
  };

  // ==========================================
  // FETCH CUSTOMERS
  // ==========================================

  const fetchCustomers = async (token = null) => {
    try {
      setLoading(true);

      const authToken = token || getToken();

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest("/customers", "GET", null, authToken);

      console.log("CUSTOMERS API RESULT:", result);

      if (result.success && Array.isArray(result.data)) {
        const formattedCustomers = result.data.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone || "",
          address: customer.address || "",

          appointment_id: customer.appointment_id || null,

          date: customer.appointment_date || "",

          time: customer.appointment_time || "",

          barber: customer.barber_name || "",

          service: customer.service_name || "",

          service_price: customer.service_price ?? 0,

          appointment_status: customer.appointment_status || "",

          visits: customer.visits || 0,

          lastVisit: customer.lastVisit || "No visit yet",
        }));

        console.log("FORMATTED CUSTOMERS:", formattedCustomers);

        setCustomers(formattedCustomers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Fetch customers error:", error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADD CUSTOMER
  // ==========================================

  const addCustomer = async (customer, token = null) => {
    try {
      const authToken = token || getToken();

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest(
        "/customers",
        "POST",
        {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        },
        authToken,
      );

      if (result.success) {
        const newCustomer = {
          id: result.data.id,
          name: result.data.name,
          phone: result.data.phone || "",
          address: result.data.address || "",

          appointment_id: null,

          date: "",
          time: "",
          barber: "",
          service: "",
          service_price: 0,
          appointment_status: "",

          visits: 0,
          lastVisit: "No visit yet",
        };

        setCustomers((currentCustomers) => [...currentCustomers, newCustomer]);

        return newCustomer;
      }

      throw new Error(result.message || "Failed to create customer.");
    } catch (error) {
      console.error("Add customer error:", error);

      throw error;
    }
  };

  // ==========================================
  // UPDATE CUSTOMER
  // ==========================================

  const updateCustomer = async (updatedCustomer, token = null) => {
    try {
      const authToken = token || getToken();

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest(
        `/customers/${updatedCustomer.id}`,
        "PUT",
        {
          name: updatedCustomer.name,
          phone: updatedCustomer.phone,
          address: updatedCustomer.address,
        },
        authToken,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update customer.");
      }

      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          Number(customer.id) === Number(updatedCustomer.id)
            ? {
                ...customer,

                id: result.data.id,

                name: result.data.name,

                phone: result.data.phone || "",

                address: result.data.address || "",
              }
            : customer,
        ),
      );

      return result.data;
    } catch (error) {
      console.error("Update customer error:", error);

      throw error;
    }
  };

  // ==========================================
  // DELETE CUSTOMER
  // ==========================================

  const deleteCustomer = async (customerId) => {
    try {
      console.log("Deleting customer ID:", customerId);

      const result = await apiRequest(`/customers/${customerId}`, "DELETE");

      console.log("DELETE CUSTOMER RESULT:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to delete customer.");
      }

      setCustomers((currentCustomers) =>
        currentCustomers.filter(
          (customer) => Number(customer.id) !== Number(customerId),
        ),
      );

      return result;
    } catch (error) {
      console.error("Delete customer error:", error);

      throw error;
    }
  };
  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    const token = getToken();

    if (token) {
      fetchCustomers(token).catch((error) => {
        console.error("Initial customer fetch failed:", error);
      });
    }
  }, []);

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <CustomerContext.Provider
      value={{
        customers,
        loading,
        fetchCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useCustomers() {
  const context = useContext(CustomerContext);

  if (!context) {
    throw new Error("useCustomers must be used inside CustomerProvider.");
  }

  return context;
}
