import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from "react-native";

import { useServices } from "../data/ServiceContext";

export default function ServicesScreen() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    setServiceStatus,
  } = useServices();

  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const filteredServices = services.filter((service) => {
    const keyword = search.toLowerCase();

    return (
      service.name.toLowerCase().includes(keyword) ||
      service.category.toLowerCase().includes(keyword)
    );
  });

  const activeCount = services.filter(
    (service) => service.status === "Active",
  ).length;

  const inactiveCount = services.filter(
    (service) => service.status === "Inactive",
  ).length;

  const openAddModal = () => {
    setEditingService(null);

    setName("");
    setCategory("");
    setDuration("");
    setPrice("");
    setDescription("");

    setModalVisible(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);

    setName(service.name);
    setCategory(service.category);
    setDuration(String(service.duration));
    setPrice(String(service.price));
    setDescription(service.description || "");

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingService(null);
  };

  const saveService = () => {
    const serviceName = name.trim();
    const serviceCategory = category.trim();
    const serviceDuration = Number(duration);
    const servicePrice = Number(price);
    const serviceDescription = description.trim();

    if (serviceName === "") {
      Alert.alert("Required", "Please enter the service name.");
      return;
    }

    if (serviceCategory === "") {
      Alert.alert("Required", "Please enter the category.");
      return;
    }

    if (
      duration.trim() === "" ||
      isNaN(serviceDuration) ||
      serviceDuration <= 0
    ) {
      Alert.alert("Invalid Duration", "Please enter a valid duration.");
      return;
    }

    if (price.trim() === "" || isNaN(servicePrice) || servicePrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }

    const serviceData = {
      name: serviceName,
      category: serviceCategory,
      duration: serviceDuration,
      price: servicePrice,
      description: serviceDescription,
      status: editingService ? editingService.status : "Active",
    };

    if (editingService) {
      updateService({
        ...editingService,
        ...serviceData,
      });

      Alert.alert("Success", "Service has been updated.");
    } else {
      addService(serviceData);

      Alert.alert("Success", "New service has been added.");
    }

    closeModal();
  };

  const deleteServiceItem = (serviceId) => {
    deleteService(serviceId);
  };

  const toggleStatus = (service) => {
    const newStatus = service.status === "Active" ? "Inactive" : "Active";

    setServiceStatus(service.id, newStatus);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Services Management</Text>

          <Text style={styles.headerSubtitle}>Manage services and pricing</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Service</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>

          <Text style={styles.summaryValue}>{services.length}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active</Text>

          <Text style={styles.summaryValue}>{activeCount}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Inactive</Text>

          <Text style={styles.summaryValue}>{inactiveCount}</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search service..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* SERVICE LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {filteredServices.length === 0 ? (
          <Text style={styles.emptyText}>No services found.</Text>
        ) : (
          filteredServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{service.name}</Text>

                  <Text style={styles.serviceId}>{service.id}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    service.status === "Active"
                      ? styles.activeBadge
                      : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      service.status === "Active"
                        ? styles.activeText
                        : styles.inactiveText,
                    ]}
                  >
                    {service.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Category</Text>

                <Text style={styles.value}>{service.category}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Duration</Text>

                <Text style={styles.value}>{service.duration} minutes</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Price</Text>

                <Text style={styles.price}>
                  ₱{service.price.toLocaleString()}
                </Text>
              </View>

              {service.description !== "" && (
                <Text style={styles.description}>{service.description}</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(service)}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.statusButton]}
                  onPress={() => toggleStatus(service)}
                >
                  <Text style={styles.statusButtonText}>
                    {service.status === "Active" ? "Disable" : "Activate"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteServiceItem(service.id)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ADD / EDIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingService ? "Edit Service" : "Add Service"}
              </Text>

              <Text style={styles.inputLabel}>Service Name</Text>

              <TextInput
                style={styles.input}
                placeholder="Example: Classic Haircut"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Category</Text>

              <TextInput
                style={styles.input}
                placeholder="Example: Haircut"
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.inputLabel}>Duration (minutes)</Text>

              <TextInput
                style={styles.input}
                placeholder="Example: 30"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />

              <Text style={styles.inputLabel}>Price</Text>

              <TextInput
                style={styles.input}
                placeholder="Example: 100"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.inputLabel}>Description</Text>

              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Service description"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveService}
                >
                  <Text style={styles.saveText}>
                    {editingService ? "Update Service" : "Save Service"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8F6",
  },

  header: {
    backgroundColor: "#1F7A5C",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#DDF3EA",
    fontSize: 13,
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },

  addButtonText: {
    color: "#1F7A5C",
    fontSize: 12,
    fontWeight: "800",
  },

  summaryContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 8,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 13,
    elevation: 2,
  },

  summaryLabel: {
    color: "#6B7280",
    fontSize: 10,
  },

  summaryValue: {
    color: "#1F7A5C",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },

  searchContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },

  searchInput: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
  },

  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },

  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 12,
    elevation: 2,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  serviceName: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "800",
  },

  serviceId: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#E4F6ED",
  },

  inactiveBadge: {
    backgroundColor: "#F3F4F6",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  activeText: {
    color: "#1F7A5C",
  },

  inactiveText: {
    color: "#6B7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 13,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    color: "#6B7280",
    fontSize: 13,
  },

  value: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "700",
  },

  price: {
    color: "#1F7A5C",
    fontSize: 15,
    fontWeight: "900",
  },

  description: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  actions: {
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  editButton: {
    backgroundColor: "#EAF7F1",
  },

  editText: {
    color: "#1F7A5C",
    fontWeight: "800",
    fontSize: 12,
  },

  statusButton: {
    backgroundColor: "#F3F4F6",
  },

  statusButtonText: {
    color: "#374151",
    fontWeight: "800",
    fontSize: 12,
  },

  deleteButton: {
    backgroundColor: "#FDECEC",
  },

  deleteText: {
    color: "#C0392B",
    fontWeight: "800",
    fontSize: 12,
  },

  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 30,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "90%",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 18,
  },

  inputLabel: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
  },

  input: {
    height: 48,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
  },

  descriptionInput: {
    height: 85,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
    marginBottom: 10,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelText: {
    color: "#4B5563",
    fontWeight: "700",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#1F7A5C",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
