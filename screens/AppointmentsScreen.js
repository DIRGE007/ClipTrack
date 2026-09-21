import React, { useMemo, useState } from "react";

import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCustomers } from "../data/CustomerContext";
import { apiRequest } from "../services/api";

const GREEN = "#1F7A5C";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled"];

// ===============================
// DATE FORMATTER
// ===============================
const formatAppointmentDate = (dateValue) => {
  if (!dateValue) {
    return "No date";
  }

  try {
    // MySQL DATE format: YYYY-MM-DD
    if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      const [year, month, day] = dateValue.split("-").map(Number);

      const localDate = new Date(year, month - 1, day);

      return localDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return String(dateValue);
  }
};

// ===============================
// TIME FORMATTER
// ===============================
const formatAppointmentTime = (timeValue) => {
  if (!timeValue) {
    return "No time";
  }

  try {
    // MySQL TIME format: HH:MM:SS
    if (
      typeof timeValue === "string" &&
      /^\d{2}:\d{2}(:\d{2})?$/.test(timeValue)
    ) {
      const parts = timeValue.split(":");

      let hour = Number(parts[0]);
      const minute = Number(parts[1]);

      const ampm = hour >= 12 ? "PM" : "AM";

      hour = hour % 12;

      if (hour === 0) {
        hour = 12;
      }

      return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`;
    }

    const date = new Date(timeValue);

    if (Number.isNaN(date.getTime())) {
      return String(timeValue);
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return String(timeValue);
  }
};

// ===============================
// STATUS COLOR
// ===============================
const getStatusColor = (status) => {
  switch (status) {
    case "Confirmed":
      return "#2E7D32";

    case "Completed":
      return "#1565C0";

    case "Cancelled":
      return "#C62828";

    case "Pending":
    default:
      return "#EF6C00";
  }
};

// ===============================
// MAIN SCREEN
// ===============================
export default function AppointmentsScreen() {
  const { customers, fetchCustomers } = useCustomers();

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [deletingAppointment, setDeletingAppointment] = useState(false);

  // ===============================
  // GET APPOINTMENTS FROM CUSTOMERS
  // ===============================
  const appointments = useMemo(() => {
    return customers
      .filter((customer) => customer.appointment_id)
      .map((customer) => ({
        id: customer.appointment_id,

        customerId: customer.id,

        customer: customer.name || "Unknown Customer",

        phone: customer.phone || "",

        address: customer.address || "",

        date: customer.date || "",

        time: customer.time || "",

        barber: customer.barber || "Not assigned",

        service: customer.service || "No service",

        servicePrice: Number(customer.service_price || 0),

        status: customer.appointment_status || "Pending",
      }));
  }, [customers]);

  // ===============================
  // SEARCH
  // ===============================
  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return appointments;
    }

    return appointments.filter(
      (appointment) =>
        appointment.customer.toLowerCase().includes(query) ||
        appointment.phone.toLowerCase().includes(query) ||
        appointment.barber.toLowerCase().includes(query) ||
        appointment.service.toLowerCase().includes(query) ||
        appointment.status.toLowerCase().includes(query),
    );
  }, [appointments, searchQuery]);

  // ===============================
  // REFRESH
  // ===============================
  const refreshAppointments = async () => {
    try {
      const token = localStorage.getItem("cliptrack_token");

      await fetchCustomers(token);
    } catch (error) {
      console.error("Refresh appointments error:", error);
    }
  };

  // ===============================
  // OPEN DETAILS
  // ===============================
  const openDetails = (appointment) => {
    setSelectedAppointment(appointment);

    setShowDetailsModal(true);
  };

  // ===============================
  // OPEN STATUS MODAL
  // ===============================
  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);

    setShowStatusModal(true);
  };

  // ===============================
  // UPDATE STATUS
  // ===============================
  const updateAppointmentStatus = async (newStatus) => {
    if (!selectedAppointment) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const token = localStorage.getItem("cliptrack_token");

      const appointmentId = Number(selectedAppointment.id);

      console.log("UPDATE APPOINTMENT STATUS");

      console.log("Appointment ID:", appointmentId);

      console.log("New Status:", newStatus);

      const result = await apiRequest(
        `/appointments/${appointmentId}/status`,
        "PATCH",
        {
          status: newStatus,
        },
        token,
      );

      console.log("UPDATE STATUS RESULT:", result);

      if (!result || !result.success) {
        throw new Error(
          result?.message || "Failed to update appointment status.",
        );
      }

      // Update selected appointment immediately
      setSelectedAppointment((current) =>
        current
          ? {
              ...current,
              status: newStatus,
            }
          : current,
      );

      // Close status selection modal
      setShowStatusModal(false);

      // Refresh appointment/customer data
      await refreshAppointments();
    } catch (error) {
      console.error("Update appointment status error:", error);

      if (Platform.OS === "web") {
        window.alert(error.message || "Failed to update appointment status.");
      } else {
        Alert.alert(
          "Error",
          error.message || "Failed to update appointment status.",
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ===============================
  // DELETE APPOINTMENT
  // ===============================
  const handleDeleteAppointment = (appointment) => {
    const performDelete = async () => {
      try {
        setDeletingAppointment(true);

        const token = localStorage.getItem("cliptrack_token");

        const result = await apiRequest(
          `/appointments/${Number(appointment.id)}`,
          "DELETE",
          null,
          token,
        );

        if (!result || !result.success) {
          throw new Error(result?.message || "Failed to delete appointment.");
        }

        setShowDetailsModal(false);

        setSelectedAppointment(null);

        await refreshAppointments();
      } catch (error) {
        console.error("Delete appointment error:", error);

        if (Platform.OS === "web") {
          window.alert(error.message || "Failed to delete appointment.");
        } else {
          Alert.alert(
            "Error",
            error.message || "Failed to delete appointment.",
          );
        }
      } finally {
        setDeletingAppointment(false);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to delete the appointment for ${appointment.customer}?`,
      );

      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Appointment",
        `Are you sure you want to delete the appointment for ${appointment.customer}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: performDelete,
          },
        ],
      );
    }
  };

  // ===============================
  // RENDER APPOINTMENT
  // ===============================
  const renderAppointment = (appointment) => {
    const statusColor = getStatusColor(appointment.status);

    return (
      <View key={String(appointment.id)} style={styles.card}>
        {/* CARD HEADER */}
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{appointment.customer}</Text>

            <Text style={styles.phone}>
              {appointment.phone || "No phone number"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor,
              },
            ]}
          >
            <Text style={styles.statusText}>{appointment.status}</Text>
          </View>
        </View>

        {/* APPOINTMENT INFORMATION */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>

            <Text style={styles.infoValue}>
              {formatAppointmentDate(appointment.date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>

            <Text style={styles.infoValue}>
              {formatAppointmentTime(appointment.time)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Barber</Text>

            <Text style={styles.infoValue}>{appointment.barber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service</Text>

            <Text style={styles.infoValue}>{appointment.service}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price</Text>

            <Text style={styles.priceValue}>
              ₱{appointment.servicePrice.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.detailsButton}
            onPress={() => openDetails(appointment)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </Pressable>

          <Pressable
            style={styles.statusButton}
            onPress={() => openStatusModal(appointment)}
          >
            <Text style={styles.statusButtonText}>Update Status</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ===============================
          HEADER
      =============================== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments Management</Text>

        <Text style={styles.headerSubtitle}>
          Manage and monitor customer appointments
        </Text>
      </View>

      {/* ===============================
          SEARCH
      =============================== */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search appointments..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ===============================
          CONTENT
      =============================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>

            <Text style={styles.emptyText}>
              Appointments created through Customer Management will appear here.
            </Text>
          </View>
        ) : (
          filteredAppointments.map(renderAppointment)
        )}
      </ScrollView>

      {/* ===============================
          DETAILS MODAL
      =============================== */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Appointment Details</Text>

              {selectedAppointment && (
                <>
                  {/* CUSTOMER */}
                  <Text style={styles.sectionTitle}>Customer Information</Text>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Customer Name</Text>

                    <Text style={styles.detailValue}>
                      {selectedAppointment.customer}
                    </Text>

                    <Text style={styles.detailLabel}>Phone Number</Text>

                    <Text style={styles.detailValue}>
                      {selectedAppointment.phone || "No phone number"}
                    </Text>

                    <Text style={styles.detailLabel}>Address</Text>

                    <Text style={styles.detailValue}>
                      {selectedAppointment.address || "No address"}
                    </Text>
                  </View>

                  {/* APPOINTMENT */}
                  <Text style={styles.sectionTitle}>
                    Appointment Information
                  </Text>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Appointment Date</Text>

                    <Text style={styles.detailValue}>
                      {formatAppointmentDate(selectedAppointment.date)}
                    </Text>

                    <Text style={styles.detailLabel}>Appointment Time</Text>

                    <Text style={styles.detailValue}>
                      {formatAppointmentTime(selectedAppointment.time)}
                    </Text>

                    <Text style={styles.detailLabel}>Barber</Text>

                    <Text style={styles.detailValue}>
                      {selectedAppointment.barber}
                    </Text>

                    <Text style={styles.detailLabel}>Service</Text>

                    <Text style={styles.detailValue}>
                      {selectedAppointment.service}
                    </Text>

                    <Text style={styles.detailLabel}>Service Price</Text>

                    <Text style={styles.detailValue}>
                      ₱{selectedAppointment.servicePrice.toFixed(2)}
                    </Text>

                    <Text style={styles.detailLabel}>Appointment Status</Text>

                    <View
                      style={[
                        styles.detailStatusBadge,
                        {
                          backgroundColor: getStatusColor(
                            selectedAppointment.status,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.detailStatusText}>
                        {selectedAppointment.status}
                      </Text>
                    </View>
                  </View>

                  {/* BUTTONS */}
                  <Pressable
                    style={styles.updateStatusModalButton}
                    onPress={() => openStatusModal(selectedAppointment)}
                  >
                    <Text style={styles.updateStatusModalButtonText}>
                      Update Status
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAppointment(selectedAppointment)}
                    disabled={deletingAppointment}
                  >
                    <Text style={styles.deleteButtonText}>
                      {deletingAppointment
                        ? "Deleting..."
                        : "Delete Appointment"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setShowDetailsModal(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===============================
          STATUS MODAL
      =============================== */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalContainer}>
            <Text style={styles.modalTitle}>Update Appointment Status</Text>

            {selectedAppointment && (
              <Text style={styles.statusCustomerText}>
                {selectedAppointment.customer}
              </Text>
            )}

            {STATUS_OPTIONS.map((status) => {
              const isCurrent = selectedAppointment?.status === status;

              return (
                <Pressable
                  key={status}
                  style={[
                    styles.statusOption,
                    {
                      borderColor: getStatusColor(status),
                      backgroundColor: isCurrent
                        ? getStatusColor(status)
                        : "#FFFFFF",
                    },
                  ]}
                  onPress={() => updateAppointmentStatus(status)}
                  disabled={updatingStatus}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color: isCurrent ? "#FFFFFF" : getStatusColor(status),
                      },
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              style={styles.closeButton}
              onPress={() => setShowStatusModal(false)}
              disabled={updatingStatus}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 22,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#E8F5EF",
    fontSize: 14,
    marginTop: 5,
  },

  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E0DD",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222222",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E1E6E3",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },

  customerInfo: {
    flex: 1,
    paddingRight: 10,
  },

  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },

  phone: {
    marginTop: 4,
    fontSize: 13,
    color: "#777777",
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EAEDEC",
    paddingTop: 12,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  infoLabel: {
    color: "#777777",
    fontSize: 14,
  },

  infoValue: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  priceValue: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "700",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  detailsButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },

  detailsButtonText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "700",
  },

  statusButton: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
  },

  statusButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    marginTop: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },

  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    padding: 22,
  },

  statusModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    width: "100%",
    maxWidth: 500,
    padding: 22,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GREEN,
    marginTop: 18,
    marginBottom: 9,
  },

  detailBox: {
    backgroundColor: "#F7F9F8",
    borderRadius: 10,
    padding: 15,
  },

  detailLabel: {
    fontSize: 12,
    color: "#777777",
    marginTop: 9,
  },

  detailValue: {
    fontSize: 15,
    color: "#222222",
    fontWeight: "600",
    marginTop: 3,
  },

  detailStatusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 5,
  },

  detailStatusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  updateStatusModalButton: {
    backgroundColor: GREEN,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },

  updateStatusModalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  deleteButton: {
    backgroundColor: "#C62828",
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  closeButton: {
    backgroundColor: "#E9EEEB",
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  closeButtonText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "700",
  },

  statusCustomerText: {
    color: "#666666",
    fontSize: 14,
    marginBottom: 18,
  },

  statusOption: {
    borderWidth: 1.5,
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 10,
  },

  statusOptionText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
