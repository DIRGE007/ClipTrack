import React, { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const AppointmentContext = createContext(null);

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(false);

  const fetchAppointments = async (token) => {
    try {
      setLoading(true);

      const result = await apiRequest("/appointments", "GET", null, token);

      if (result.success) {
        setAppointments(result.data);
      }
    } catch (error) {
      console.error("Fetch appointments error:", error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointment, token) => {
    try {
      const result = await apiRequest(
        "/appointments",
        "POST",
        {
          customer_id: Number(appointment.customer_id),

          barber_id: Number(appointment.barber_id),

          service_id: Number(appointment.service_id),

          appointment_date: appointment.appointment_date,

          appointment_time: appointment.appointment_time,

          status: appointment.status || "Pending",
        },
        token,
      );

      if (result.success) {
        setAppointments((currentAppointments) => [
          result.data,
          ...currentAppointments,
        ]);

        return result.data;
      }
    } catch (error) {
      console.error("Add appointment error:", error);

      throw error;
    }
  };

  const updateAppointment = async (updatedAppointment, token) => {
    try {
      const result = await apiRequest(
        `/appointments/${updatedAppointment.id}`,
        "PUT",
        {
          customer_id: Number(updatedAppointment.customer_id),

          barber_id: Number(updatedAppointment.barber_id),

          service_id: Number(updatedAppointment.service_id),

          appointment_date: updatedAppointment.appointment_date,

          appointment_time: updatedAppointment.appointment_time,

          status: updatedAppointment.status,
        },
        token,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update appointment.");
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          Number(appointment.id) === Number(updatedAppointment.id)
            ? result.data
            : appointment,
        ),
      );

      return result.data;
    } catch (error) {
      console.error("Update appointment error:", error);

      throw error;
    }
  };

  const deleteAppointment = async (appointmentId, token) => {
    try {
      const result = await apiRequest(
        `/appointments/${appointmentId}`,
        "DELETE",
        null,
        token,
      );

      if (result.success) {
        setAppointments((currentAppointments) =>
          currentAppointments.filter(
            (appointment) => Number(appointment.id) !== Number(appointmentId),
          ),
        );

        return result;
      }
    } catch (error) {
      console.error("Delete appointment error:", error);

      throw error;
    }
  };

  const setAppointmentStatus = async (appointmentId, newStatus, token) => {
    const appointment = appointments.find(
      (item) => Number(item.id) === Number(appointmentId),
    );

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    return await updateAppointment(
      {
        ...appointment,
        status: newStatus,
      },
      token,
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("cliptrack_token");

    if (token) {
      fetchAppointments(token);
    }
  }, []);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        fetchAppointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        setAppointmentStatus,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);

  if (!context) {
    throw new Error("useAppointments must be used inside AppointmentProvider.");
  }

  return context;
}
