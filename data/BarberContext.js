import React, { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const BarberContext = createContext(null);

export function BarberProvider({ children }) {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // GET TOKEN
  // ==========================================
  const getToken = () => {
    return localStorage.getItem("cliptrack_token");
  };

  // ==========================================
  // GET ALL BARBERS
  // ==========================================
  const fetchBarbers = async () => {
    try {
      const token = getToken();

      if (!token) {
        console.log("No access token found.");
        return;
      }

      setLoading(true);

      const result = await apiRequest("/barbers", "GET", null, token);

      if (result.success) {
        setBarbers(result.data);
      }
    } catch (error) {
      console.error("Fetch barbers error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADD BARBER
  // ==========================================
  const addBarber = async (barber) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Access token is missing. Please login again.");
      }

      const result = await apiRequest(
        "/barbers",
        "POST",
        {
          name: barber.name,
          phone: barber.phone,
          status: barber.status || "Available",
        },
        token,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to create barber.");
      }

      setBarbers((currentBarbers) => [result.data, ...currentBarbers]);

      return result.data;
    } catch (error) {
      console.error("Add barber error:", error);

      throw error;
    }
  };

  // ==========================================
  // UPDATE BARBER
  // ==========================================
  const updateBarber = async (updatedBarber) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Access token is missing. Please login again.");
      }

      const result = await apiRequest(
        `/barbers/${updatedBarber.id}`,
        "PUT",
        {
          name: updatedBarber.name,
          phone: updatedBarber.phone,
          status: updatedBarber.status,
        },
        token,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update barber.");
      }

      setBarbers((currentBarbers) =>
        currentBarbers.map((barber) =>
          Number(barber.id) === Number(updatedBarber.id) ? result.data : barber,
        ),
      );

      return result.data;
    } catch (error) {
      console.error("Update barber error:", error);

      throw error;
    }
  };

  // ==========================================
  // DELETE BARBER
  // ==========================================
  const deleteBarber = async (barberId) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Access token is missing. Please login again.");
      }

      const result = await apiRequest(
        `/barbers/${barberId}`,
        "DELETE",
        null,
        token,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to delete barber.");
      }

      setBarbers((currentBarbers) =>
        currentBarbers.filter(
          (barber) => Number(barber.id) !== Number(barberId),
        ),
      );

      return result;
    } catch (error) {
      console.error("Delete barber error:", error);

      throw error;
    }
  };

  // ==========================================
  // CHANGE BARBER STATUS
  // ==========================================
  const setBarberStatus = async (barberId, newStatus) => {
    const barber = barbers.find((item) => Number(item.id) === Number(barberId));

    if (!barber) {
      throw new Error("Barber not found.");
    }

    return await updateBarber({
      ...barber,
      status: newStatus,
    });
  };

  // ==========================================
  // AVAILABLE BARBERS
  // ==========================================
  const availableBarbers = barbers.filter(
    (barber) => barber.status === "Available",
  );

  // ==========================================
  // LOAD BARBERS
  // ==========================================
  useEffect(() => {
    fetchBarbers();
  }, []);

  return (
    <BarberContext.Provider
      value={{
        barbers,
        availableBarbers,
        loading,
        fetchBarbers,
        addBarber,
        updateBarber,
        deleteBarber,
        setBarberStatus,
      }}
    >
      {children}
    </BarberContext.Provider>
  );
}

export function useBarbers() {
  const context = useContext(BarberContext);

  if (!context) {
    throw new Error("useBarbers must be used inside BarberProvider.");
  }

  return context;
}
