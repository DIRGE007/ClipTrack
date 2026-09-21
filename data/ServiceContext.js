import React, { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/api";

const ServiceContext = createContext(null);

export function ServiceProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // GET SERVICES
  // =========================
  const fetchServices = async (token) => {
    try {
      setLoading(true);

      const authToken = token || localStorage.getItem("cliptrack_token");

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest("/services", "GET", null, authToken);

      if (result.success) {
        setServices(result.data);
      }
    } catch (error) {
      console.error("Fetch services error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ADD SERVICE
  // =========================
  const addService = async (service, token) => {
    try {
      const authToken = token || localStorage.getItem("cliptrack_token");

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest(
        "/services",
        "POST",
        {
          name: service.name,
          category: service.category,
          duration: Number(service.duration),
          price: Number(service.price),
          status: service.status || "Active",
          description: service.description || "",
        },
        authToken,
      );

      if (result.success) {
        setServices((currentServices) => [result.data, ...currentServices]);

        return result.data;
      }
    } catch (error) {
      console.error("Add service error:", error);
      throw error;
    }
  };

  // =========================
  // UPDATE SERVICE
  // =========================
  const updateService = async (updatedService, token) => {
    try {
      const authToken = token || localStorage.getItem("cliptrack_token");

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest(
        `/services/${updatedService.id}`,
        "PUT",
        {
          name: updatedService.name,
          category: updatedService.category,
          duration: Number(updatedService.duration),
          price: Number(updatedService.price),
          status: updatedService.status,
          description: updatedService.description || "",
        },
        authToken,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update service.");
      }

      setServices((currentServices) =>
        currentServices.map((service) =>
          Number(service.id) === Number(updatedService.id)
            ? result.data
            : service,
        ),
      );

      return result.data;
    } catch (error) {
      console.error("Update service error:", error);
      throw error;
    }
  };

  // =========================
  // DELETE SERVICE
  // =========================
  const deleteService = async (serviceId, token) => {
    try {
      const authToken = token || localStorage.getItem("cliptrack_token");

      if (!authToken) {
        throw new Error("Access token is required.");
      }

      const result = await apiRequest(
        `/services/${serviceId}`,
        "DELETE",
        null,
        authToken,
      );

      if (result.success) {
        setServices((currentServices) =>
          currentServices.filter(
            (service) => Number(service.id) !== Number(serviceId),
          ),
        );

        return result;
      }
    } catch (error) {
      console.error("Delete service error:", error);
      throw error;
    }
  };

  // =========================
  // CHANGE SERVICE STATUS
  // =========================
  const setServiceStatus = async (serviceId, newStatus, token) => {
    const service = services.find(
      (item) => Number(item.id) === Number(serviceId),
    );

    if (!service) {
      throw new Error("Service not found.");
    }

    const authToken = token || localStorage.getItem("cliptrack_token");

    if (!authToken) {
      throw new Error("Access token is required.");
    }

    return await updateService(
      {
        ...service,
        status: newStatus,
      },
      authToken,
    );
  };

  // =========================
  // ACTIVE SERVICES
  // =========================
  const activeServices = services.filter(
    (service) => service.status === "Active",
  );

  // =========================
  // LOAD SERVICES AFTER LOGIN
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("cliptrack_token");

    if (token) {
      fetchServices(token);
    }
  }, []);

  return (
    <ServiceContext.Provider
      value={{
        services,
        activeServices,
        loading,
        fetchServices,
        addService,
        updateService,
        deleteService,
        setServiceStatus,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);

  if (!context) {
    throw new Error("useServices must be used inside ServiceProvider.");
  }

  return context;
}
