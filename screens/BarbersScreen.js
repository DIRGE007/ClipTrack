import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from "react-native";

import { useBarbers } from "../data/BarberContext";

const GREEN = "#1F7A5C";

export default function BarbersScreen() {
  const { barbers, addBarber, updateBarber, deleteBarber, setBarberStatus } =
    useBarbers();

  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);

  const [editingBarber, setEditingBarber] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Available");

  // =========================
  // SEARCH
  // =========================

  const filteredBarbers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (keyword === "") {
      return barbers;
    }

    return barbers.filter(
      (barber) =>
        barber.name.toLowerCase().includes(keyword) ||
        barber.phone.includes(keyword) ||
        barber.status.toLowerCase().includes(keyword),
    );
  }, [barbers, search]);

  // =========================
  // COUNTS
  // =========================

  const availableCount = barbers.filter(
    (barber) => barber.status === "Available",
  ).length;

  const unavailableCount = barbers.filter(
    (barber) => barber.status === "Unavailable",
  ).length;

  // =========================
  // ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingBarber(null);
    setName("");
    setPhone("");
    setStatus("Available");
    setModalVisible(true);
  };

  // =========================
  // EDIT MODAL
  // =========================

  const openEditModal = (barber) => {
    setEditingBarber(barber);
    setName(barber.name);
    setPhone(barber.phone);
    setStatus(barber.status);
    setModalVisible(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    setModalVisible(false);
    setEditingBarber(null);
    setName("");
    setPhone("");
    setStatus("Available");
  };

  // =========================
  // SAVE
  // =========================

  const handleSave = () => {
    if (name.trim() === "") {
      Alert.alert("Required", "Please enter the barber name.");
      return;
    }

    if (phone.trim() === "") {
      Alert.alert("Required", "Please enter the contact number.");
      return;
    }

    if (editingBarber) {
      updateBarber({
        id: editingBarber.id,
        name: name.trim(),
        phone: phone.trim(),
        status: status,
      });

      closeModal();

      Alert.alert("Success", "Barber updated successfully.");

      return;
    }

    addBarber({
      name: name.trim(),
      phone: phone.trim(),
      status: status,
    });

    closeModal();

    Alert.alert("Success", "Barber added successfully.");
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = (barberId) => {
    deleteBarber(barberId);
  };

  // =========================
  // AVAILABILITY
  // =========================

  const handleAvailability = (barber) => {
    if (barber.status === "Available") {
      setBarberStatus(barber.id, "Unavailable");
    } else {
      setBarberStatus(barber.id, "Available");
    }
  };

  // =========================
  // BARBER CARD
  // =========================

  const renderBarber = ({ item }) => {
    const isAvailable = item.status === "Available";

    return (
      <View style={styles.barberCard}>
        {/* BARBER INFORMATION */}

        <View style={styles.barberInfoRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>

            <Text style={styles.phone}>{item.phone}</Text>

            <View
              style={[
                styles.statusBadge,
                isAvailable ? styles.availableBadge : styles.unavailableBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isAvailable ? styles.availableText : styles.unavailableText,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS */}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isAvailable ? styles.unavailableButton : styles.availableButton,
            ]}
            onPress={() => handleAvailability(item)}
          >
            <Text
              style={[
                styles.actionText,
                isAvailable
                  ? styles.unavailableActionText
                  : styles.availableActionText,
              ]}
            >
              {isAvailable ? "Set Unavailable" : "Set Available"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>Barber Management</Text>

        <Text style={styles.subtitle}>Manage barbers and availability</Text>
      </View>

      {/* SUMMARY */}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{availableCount}</Text>

          <Text style={styles.summaryLabel}>Available</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{unavailableCount}</Text>

          <Text style={styles.summaryLabel}>Unavailable</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{barbers.length}</Text>

          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* SEARCH */}

      <TextInput
        style={styles.searchInput}
        placeholder="Search barber..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {/* ADD */}

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add Barber</Text>
      </TouchableOpacity>

      {/* LIST */}

      <FlatList
        data={filteredBarbers}
        keyExtractor={(item) => item.id}
        renderItem={renderBarber}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✂️</Text>

            <Text style={styles.emptyTitle}>No Barbers Found</Text>

            <Text style={styles.emptyText}>
              Add a barber to start managing your barbershop staff.
            </Text>
          </View>
        }
      />

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
                {editingBarber ? "Edit Barber" : "Add Barber"}
              </Text>

              {/* NAME */}

              <Text style={styles.label}>Full Name</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter barber name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />

              {/* PHONE */}

              <Text style={styles.label}>Contact Number</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {/* STATUS */}

              <Text style={styles.label}>Availability</Text>

              <View style={styles.statusOptions}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === "Available" && styles.selectedStatus,
                  ]}
                  onPress={() => setStatus("Available")}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === "Available" && styles.selectedStatusText,
                    ]}
                  >
                    Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === "Unavailable" && styles.selectedStatus,
                  ]}
                  onPress={() => setStatus("Unavailable")}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === "Unavailable" && styles.selectedStatusText,
                    ]}
                  >
                    Unavailable
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SAVE */}

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingBarber ? "Update Barber" : "Save Barber"}
                </Text>
              </TouchableOpacity>

              {/* CANCEL */}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
    backgroundColor: "#F5F7F6",
    paddingHorizontal: 16,
  },

  header: {
    paddingTop: 20,
    paddingBottom: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  summaryCard: {
    width: "31.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    elevation: 2,
  },

  summaryNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: GREEN,
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },

  searchInput: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#222",
    marginBottom: 12,
  },

  addButton: {
    height: 48,
    backgroundColor: GREEN,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  barberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },

  barberInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E6F4EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: GREEN,
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },

  phone: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },

  availableBadge: {
    backgroundColor: "#E8F7EF",
  },

  unavailableBadge: {
    backgroundColor: "#FDECEC",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  availableText: {
    color: GREEN,
  },

  unavailableText: {
    color: "#B42318",
  },

  actionRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
  },

  actionButton: {
    minHeight: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  unavailableButton: {
    flex: 1,
    backgroundColor: "#FDECEC",
  },

  availableButton: {
    flex: 1,
    backgroundColor: "#E8F7EF",
  },

  editButton: {
    paddingHorizontal: 16,
    backgroundColor: "#F0F4F2",
  },

  deleteButton: {
    paddingHorizontal: 14,
    backgroundColor: "#FDECEC",
  },

  actionText: {
    fontSize: 11,
    fontWeight: "700",
  },

  availableActionText: {
    color: GREEN,
  },

  unavailableActionText: {
    color: "#B42318",
  },

  editText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
  },

  deleteText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },

  emptyText: {
    marginTop: 5,
    textAlign: "center",
    color: "#777",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D9DEDB",
    borderRadius: 9,
    paddingHorizontal: 13,
    color: "#222",
    fontSize: 14,
    marginBottom: 15,
  },

  statusOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  statusOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9DEDB",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
  },

  selectedStatus: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  statusOptionText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },

  selectedStatusText: {
    color: "#FFFFFF",
  },

  saveButton: {
    height: 48,
    backgroundColor: GREEN,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cancelButton: {
    height: 48,
    backgroundColor: "#F1F3F2",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  cancelButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "700",
  },
});
