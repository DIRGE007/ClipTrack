import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCustomers } from "../data/CustomerContext";
import { useBarbers } from "../data/BarberContext";
import { useServices } from "../data/ServiceContext";
import { apiRequest } from "../services/api";

const GREEN = "#1F7A5C";

export default function CustomersScreen() {
  const {
    customers,
    loading,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();

  const { barbers, fetchBarbers } = useBarbers();
  const { services, fetchServices } = useServices();

  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [barberDropdownVisible, setBarberDropdownVisible] = useState(false);

  const [serviceDropdownVisible, setServiceDropdownVisible] = useState(false);

  // ==========================================
  // LOAD DATA WHEN SCREEN OPENS
  // ==========================================

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // LOAD ALL DATA
  // ==========================================

  const loadData = async () => {
    const token = localStorage.getItem("cliptrack_token");

    if (!token) {
      console.log("No authentication token found.");
      return;
    }

    try {
      await Promise.all([
        loadCustomers(token),
        loadAppointments(token),
        fetchBarbers(token),
        fetchServices(token),
      ]);
    } catch (error) {
      console.error("Load data error:", error);
    }
  };

  // ==========================================
  // LOAD CUSTOMERS
  // ==========================================

  const loadCustomers = async (token) => {
    try {
      await fetchCustomers(token);
    } catch (error) {
      console.error("Load customers error:", error);
    }
  };

  // ==========================================
  // LOAD APPOINTMENTS
  // ==========================================

  const loadAppointments = async (token) => {
    try {
      setLoadingAppointments(true);

      const result = await apiRequest("/appointments", "GET", null, token);

      console.log("APPOINTMENTS API RESULT:", result);

      if (result.success && Array.isArray(result.data)) {
        setAppointments(result.data);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error("Load appointments error:", error);

      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "No appointment date";
    }

    const dateString = String(date);

    // Handle:
    // 2026-09-19
    // 2026-09-19T16:00:00.000Z
    // 2026-09-19T00:00:00.000Z

    if (dateString.includes("T")) {
      return dateString.split("T")[0];
    }

    return dateString.substring(0, 10);
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) {
      return "No appointment time";
    }

    const timeString = String(time);

    const parts = timeString.split(":");

    if (parts.length < 2) {
      return timeString;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
  };

  // ==========================================
  // FORMAT DATE FOR MYSQL
  // ==========================================

  const convertToMySQLDate = (value) => {
    if (!value) {
      return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [month, day, year] = value.split("/");

      return `${year}-${month}-${day}`;
    }

    return value;
  };

  // ==========================================
  // FORMAT TIME FOR MYSQL
  // ==========================================

  const convertToMySQLTime = (value) => {
    if (!value) {
      return "";
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    if (/^\d{2}:\d{2}$/.test(value)) {
      return `${value}:00`;
    }

    const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match) {
      let hour = Number(match[1]);

      const minute = match[2];

      const ampm = match[3].toUpperCase();

      if (ampm === "PM" && hour !== 12) {
        hour += 12;
      }

      if (ampm === "AM" && hour === 12) {
        hour = 0;
      }

      return `${String(hour).padStart(2, "0")}:${minute}:00`;
    }

    return value;
  };

  // ==========================================
  // CONNECT CUSTOMERS TO APPOINTMENTS
  // ==========================================

  const customersWithAppointments = useMemo(() => {
    return customers.map((customer) => {
      const appointment = appointments.find(
        (item) => Number(item.customer_id) === Number(customer.id),
      );

      return {
        ...customer,

        appointment_id: appointment?.id || customer.appointment_id || null,

        date: appointment?.appointment_date || customer.date || "",

        time: appointment?.appointment_time || customer.time || "",

        barber: appointment?.barber_name || customer.barber || "",

        service: appointment?.service_name || customer.service || "",

        service_price:
          appointment?.service_price ?? customer.service_price ?? 0,

        appointment_status:
          appointment?.status || customer.appointment_status || "",
      };
    });
  }, [customers, appointments]);

  // ==========================================
  // FILTER CUSTOMERS
  // ==========================================

  const filteredCustomers = customersWithAppointments.filter((customer) => {
    const searchText = search.toLowerCase();

    return (
      String(customer.name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(customer.phone || "")
        .toLowerCase()
        .includes(searchText) ||
      String(customer.address || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const openAddModal = () => {
    setEditingCustomer(null);

    setName("");
    setPhone("");
    setAddress("");

    setAppointmentDate("");
    setAppointmentTime("");

    setSelectedBarber(null);
    setSelectedService(null);

    setBarberDropdownVisible(false);
    setServiceDropdownVisible(false);

    setModalVisible(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setName(customer.name || "");
    setPhone(customer.phone || "");
    setAddress(customer.address || "");

    setAppointmentDate("");
    setAppointmentTime("");

    setSelectedBarber(null);
    setSelectedService(null);

    setBarberDropdownVisible(false);
    setServiceDropdownVisible(false);

    setModalVisible(true);
  };

  // ==========================================
  // OPEN VIEW MODAL
  // ==========================================

  const openViewModal = (customer) => {
    console.log("VIEW CUSTOMER:", customer);

    setViewingCustomer({
      ...customer,

      date: customer.date || "",

      time: customer.time || "",

      barber: customer.barber || "",

      service: customer.service || "",

      service_price: customer.service_price ?? 0,

      appointment_status: customer.appointment_status || "",
    });

    setViewModalVisible(true);
  };

  // ==========================================
  // CLOSE ADD / EDIT MODAL
  // ==========================================

  const closeModal = () => {
    setModalVisible(false);

    setEditingCustomer(null);

    setName("");
    setPhone("");
    setAddress("");

    setAppointmentDate("");
    setAppointmentTime("");

    setSelectedBarber(null);
    setSelectedService(null);

    setBarberDropdownVisible(false);
    setServiceDropdownVisible(false);
  };

  // ==========================================
  // SAVE CUSTOMER
  // ==========================================

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Customer name is required.");
      return;
    }

    const token = localStorage.getItem("cliptrack_token");

    if (!token) {
      Alert.alert("Error", "Authentication token not found.");
      return;
    }

    try {
      // ========================================
      // EDIT CUSTOMER
      // ========================================

      if (editingCustomer) {
        await updateCustomer(
          {
            id: editingCustomer.id,
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          },
          token,
        );

        Alert.alert("Success", "Customer updated successfully.");

        closeModal();

        await loadCustomers(token);

        await loadAppointments(token);

        return;
      }

      // ========================================
      // ADD CUSTOMER VALIDATION
      // ========================================

      if (!appointmentDate.trim()) {
        Alert.alert("Required", "Appointment date is required.");
        return;
      }

      if (!appointmentTime.trim()) {
        Alert.alert("Required", "Appointment time is required.");
        return;
      }

      if (!selectedBarber) {
        Alert.alert("Required", "Please select a barber.");
        return;
      }

      if (!selectedService) {
        Alert.alert("Required", "Please select a service.");
        return;
      }

      // ========================================
      // CREATE CUSTOMER
      // ========================================

      const newCustomer = await addCustomer(
        {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        token,
      );

      if (!newCustomer) {
        throw new Error("Customer was not created.");
      }

      // ========================================
      // CREATE APPOINTMENT
      // ========================================

      const mysqlDate = convertToMySQLDate(appointmentDate.trim());

      const mysqlTime = convertToMySQLTime(appointmentTime.trim());

      const appointmentResult = await apiRequest(
        "/appointments",
        "POST",
        {
          customer_id: newCustomer.id,

          barber_id: selectedBarber.id,

          service_id: selectedService.id,

          appointment_date: mysqlDate,

          appointment_time: mysqlTime,

          status: "Pending",
        },
        token,
      );

      if (!appointmentResult.success) {
        throw new Error(
          appointmentResult.message || "Failed to create appointment.",
        );
      }

      Alert.alert("Success", "Customer and appointment added successfully.");

      closeModal();

      await loadCustomers(token);

      await loadAppointments(token);
    } catch (error) {
      console.error("Save customer error:", error);

      Alert.alert("Error", error.message || "Failed to save customer.");
    }
  };

  // ==========================================
  // DELETE CUSTOMER
  // ==========================================

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`,
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("cliptrack_token");

    if (!token) {
      alert("Session expired. Please login again.");
      return;
    }

    try {
      console.log("Deleting customer:", customer.id, customer.name);

      // Delete customer
      // CustomerContext will use the token
      await deleteCustomer(customer.id, token);

      // Remove appointment from local state
      setAppointments((currentAppointments) =>
        currentAppointments.filter(
          (appointment) =>
            Number(appointment.customer_id) !== Number(customer.id),
        ),
      );

      alert(`${customer.name} has been deleted successfully.`);

      // Reload customer list
      await loadCustomers(token);
    } catch (error) {
      console.error("DELETE CUSTOMER ERROR:", error);

      alert(error.message || "Failed to delete customer.");
    }
  };

  // ==========================================
  // AVAILABLE BARBERS
  // ==========================================

  const availableBarbers = Array.isArray(barbers)
    ? barbers.filter((barber) => barber.status === "Available")
    : [];

  // ==========================================
  // ACTIVE SERVICES
  // ==========================================

  const activeServices = Array.isArray(services)
    ? services.filter((service) => service.status === "Active")
    : [];

  // ==========================================
  // RENDER CUSTOMER
  // ==========================================

  const renderCustomer = ({ item }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.customerName}>{item.name}</Text>

        <Text style={styles.infoText}>Phone: {item.phone || "N/A"}</Text>

        <Text style={styles.infoText}>Address: {item.address || "N/A"}</Text>

        <Text style={styles.infoText}>
          Appointment Date:{" "}
          {item.date ? formatDate(item.date) : "No appointment"}
        </Text>

        <Text style={styles.infoText}>
          Appointment Time:{" "}
          {item.time ? formatTime(item.time) : "No appointment"}
        </Text>

        <Text style={styles.infoText}>
          Barber: {item.barber || "No appointment"}
        </Text>

        <Text style={styles.infoText}>
          Service: {item.service || "No appointment"}
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.viewButton}
            onPress={() => openViewModal(item)}
          >
            <Text style={styles.buttonText}>View</Text>
          </Pressable>

          <Pressable
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ==========================================
  // MAIN SCREEN
  // ==========================================

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Management</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer..."
          value={search}
          onChangeText={setSearch}
        />

        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Customer</Text>
        </Pressable>
      </View>

      {loading || loadingAppointments ? (
        <View style={styles.loadingContainer}>
          <Text>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCustomer}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found.</Text>
            </View>
          }
        />
      )}

      {/* =====================================
          ADD / EDIT CUSTOMER MODAL
          ===================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </Text>

              <Text style={styles.label}>Customer Name</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Phone Number</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>Address</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter address"
                value={address}
                onChangeText={setAddress}
                multiline
              />

              {!editingCustomer && (
                <>
                  <Text style={styles.label}>Appointment Date</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={appointmentDate}
                    onChangeText={setAppointmentDate}
                  />

                  <Text style={styles.label}>Appointment Time</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="02:00 PM"
                    value={appointmentTime}
                    onChangeText={setAppointmentTime}
                  />

                  <Text style={styles.label}>Barber</Text>

                  <Pressable
                    style={styles.dropdown}
                    onPress={() =>
                      setBarberDropdownVisible(!barberDropdownVisible)
                    }
                  >
                    <Text
                      style={
                        selectedBarber
                          ? styles.dropdownText
                          : styles.placeholderText
                      }
                    >
                      {selectedBarber ? selectedBarber.name : "Select Barber"}
                    </Text>
                  </Pressable>

                  {barberDropdownVisible && (
                    <View style={styles.dropdownList}>
                      {availableBarbers.map((barber) => (
                        <Pressable
                          key={String(barber.id)}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedBarber(barber);

                            setBarberDropdownVisible(false);
                          }}
                        >
                          <Text>{barber.name}</Text>
                        </Pressable>
                      ))}

                      {availableBarbers.length === 0 && (
                        <Text style={styles.noOptionText}>
                          No available barbers.
                        </Text>
                      )}
                    </View>
                  )}

                  <Text style={styles.label}>Service</Text>

                  <Pressable
                    style={styles.dropdown}
                    onPress={() =>
                      setServiceDropdownVisible(!serviceDropdownVisible)
                    }
                  >
                    <Text
                      style={
                        selectedService
                          ? styles.dropdownText
                          : styles.placeholderText
                      }
                    >
                      {selectedService
                        ? `${selectedService.name} - ₱${Number(
                            selectedService.price,
                          ).toFixed(2)}`
                        : "Select Service"}
                    </Text>
                  </Pressable>

                  {serviceDropdownVisible && (
                    <View style={styles.dropdownList}>
                      {activeServices.map((service) => (
                        <Pressable
                          key={String(service.id)}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedService(service);

                            setServiceDropdownVisible(false);
                          }}
                        >
                          <Text>
                            {service.name} - ₱{Number(service.price).toFixed(2)}
                          </Text>
                        </Pressable>
                      ))}

                      {activeServices.length === 0 && (
                        <Text style={styles.noOptionText}>
                          No active services.
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}

              <View style={styles.modalButtonRow}>
                <Pressable style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =====================================
          VIEW CUSTOMER MODAL
          ===================================== */}

      <Modal
        visible={viewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Customer Details</Text>

              {/* CUSTOMER INFORMATION */}

              <Text style={styles.sectionTitle}>Customer Information</Text>

              <Text style={styles.detailLabel}>Customer Name</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.name || "No customer name"}
              </Text>

              <Text style={styles.detailLabel}>Phone Number</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.phone || "No phone number"}
              </Text>

              <Text style={styles.detailLabel}>Address</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.address || "No address"}
              </Text>

              {/* APPOINTMENT INFORMATION */}

              <Text style={styles.sectionTitle}>Appointment Information</Text>

              <Text style={styles.detailLabel}>Appointment Date</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer
                  ? formatDate(viewingCustomer.date)
                  : "No appointment date"}
              </Text>

              <Text style={styles.detailLabel}>Appointment Time</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.time
                  ? formatTime(viewingCustomer.time)
                  : "No appointment time"}
              </Text>

              <Text style={styles.detailLabel}>Barber</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.barber || "No barber"}
              </Text>

              <Text style={styles.detailLabel}>Service</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.service || "No service"}
              </Text>

              <Text style={styles.detailLabel}>Service Price</Text>

              <Text style={styles.detailValue}>
                ₱{Number(viewingCustomer?.service_price || 0).toFixed(2)}
              </Text>

              <Text style={styles.detailLabel}>Appointment Status</Text>

              <Text style={styles.detailValue}>
                {viewingCustomer?.appointment_status || "No status"}
              </Text>

              <Pressable
                style={styles.closeButton}
                onPress={() => setViewModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: GREEN,
    marginBottom: 20,
  },

  searchContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 45,
  },

  addButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  listContent: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8E5",
  },

  customerName: {
    fontSize: 19,
    fontWeight: "bold",
    color: GREEN,
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    color: "#444444",
    marginBottom: 5,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  viewButton: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  editButton: {
    flex: 1,
    backgroundColor: "#4C8BF5",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#D9534F",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },

  emptyText: {
    color: "#777777",
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 550,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: GREEN,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: GREEN,
    marginTop: 12,
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 9,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: "#FFFFFF",
  },

  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 9,
    paddingHorizontal: 12,
    minHeight: 45,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  dropdownText: {
    color: "#333333",
  },

  placeholderText: {
    color: "#999999",
  },

  dropdownList: {
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 9,
    marginTop: 5,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  dropdownItem: {
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  noOptionText: {
    padding: 13,
    color: "#999999",
  },

  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#777777",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },

  saveButton: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },

  closeButton: {
    backgroundColor: GREEN,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 25,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#777777",
    marginTop: 8,
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 16,
    color: "#222222",
    marginBottom: 8,
  },
});
