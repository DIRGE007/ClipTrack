import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { usePayments } from "../data/PaymentContext";
import { useCustomers } from "../data/CustomerContext";
import { useBarbers } from "../data/BarberContext";
import { useServices } from "../data/ServiceContext";

const GREEN = "#1F7A5C";

export default function PaymentsScreen() {
  const { payments, addPayment, deletePayment } = usePayments();

  const { customers } = useCustomers();
  const { availableBarbers } = useBarbers();
  const { activeServices } = useServices();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [customer, setCustomer] = useState("");
  const [barber, setBarber] = useState("");
  const [service, setService] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [selector, setSelector] = useState(null);

  /*
   * Find selected service
   */
  const selectedService = useMemo(() => {
    return activeServices.find((item) => item.name === service);
  }, [activeServices, service]);

  /*
   * Calculate change
   */
  const change = useMemo(() => {
    const price = Number(servicePrice) || 0;
    const paid = Number(amountPaid) || 0;

    if (paid >= price) {
      return paid - price;
    }

    return 0;
  }, [servicePrice, amountPaid]);

  /*
   * Open new payment form
   */
  const openNewPayment = () => {
    setCustomer("");
    setBarber("");
    setService("");
    setServicePrice("");
    setAmountPaid("");
    setPaymentMethod("Cash");
    setSelector(null);
    setShowForm(true);
  };

  /*
   * Close form
   */
  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setSelector(null);
  };

  /*
   * Select customer
   *
   * The customer contains the latest appointment information.
   * We automatically load the assigned barber and service.
   */
  const selectCustomer = (item) => {
    setCustomer(item.name);
    setSelector(null);

    /*
     * Automatically select assigned barber
     */
    if (item.barber) {
      const barberExists = availableBarbers.some(
        (barberItem) => barberItem.name === item.barber,
      );

      if (barberExists) {
        setBarber(item.barber);
      } else {
        setBarber("");
      }
    } else {
      setBarber("");
    }

    /*
     * Automatically select assigned service
     */
    if (item.service) {
      const matchedService = activeServices.find(
        (serviceItem) => serviceItem.name === item.service,
      );

      if (matchedService) {
        setService(matchedService.name);
        setServicePrice(String(matchedService.price));
      } else {
        setService("");
        setServicePrice("");
      }
    } else {
      setService("");
      setServicePrice("");
    }
  };

  /*
   * Select barber manually
   */
  const selectBarber = (item) => {
    setBarber(item.name);
    setSelector(null);
  };

  /*
   * Select service manually
   */
  const selectService = (item) => {
    setService(item.name);
    setServicePrice(String(item.price));
    setSelector(null);
  };

  /*
   * SAVE PAYMENT
   *
   * This now sends IDs to the backend.
   */
  const savePayment = async () => {
    if (saving) {
      return;
    }

    if (!customer) {
      Alert.alert("Missing Customer", "Please select a customer.");
      return;
    }

    if (!barber) {
      Alert.alert("Missing Barber", "Please select a barber.");
      return;
    }

    if (!service) {
      Alert.alert("Missing Service", "Please select a service.");
      return;
    }

    if (!servicePrice) {
      Alert.alert("Missing Service Price", "Please select a valid service.");
      return;
    }

    if (!amountPaid.trim()) {
      Alert.alert("Missing Amount", "Please enter the amount paid.");
      return;
    }

    const price = Number(servicePrice);
    const paid = Number(amountPaid);

    if (!Number.isFinite(price) || !Number.isFinite(paid)) {
      Alert.alert("Invalid Amount", "Please enter valid numbers.");
      return;
    }

    if (price <= 0) {
      Alert.alert(
        "Invalid Service Price",
        "The selected service has an invalid price.",
      );
      return;
    }

    if (paid < price) {
      Alert.alert(
        "Insufficient Payment",
        `Amount paid must be at least ₱${price.toFixed(2)}.`,
      );
      return;
    }

    /*
     * Get JWT token
     */
    const token = localStorage.getItem("cliptrack_token");

    if (!token) {
      Alert.alert("Session Expired", "Please login again.");
      return;
    }

    /*
     * Find actual database records
     */
    const selectedCustomer = customers.find((item) => item.name === customer);

    const selectedBarber = availableBarbers.find(
      (item) => item.name === barber,
    );

    const selectedServiceItem = activeServices.find(
      (item) => item.name === service,
    );

    /*
     * Validate customer
     */
    if (!selectedCustomer) {
      Alert.alert("Customer Error", "Selected customer could not be found.");
      return;
    }

    /*
     * Validate customer ID
     */
    const customerId = Number(selectedCustomer.id);

    if (!Number.isInteger(customerId)) {
      console.error("INVALID CUSTOMER:", selectedCustomer);

      Alert.alert(
        "Customer Error",
        "Selected customer does not have a valid database ID.",
      );
      return;
    }

    /*
     * Validate barber
     */
    if (!selectedBarber) {
      Alert.alert("Barber Error", "Selected barber could not be found.");
      return;
    }

    /*
     * Validate barber ID
     */
    const barberId = Number(selectedBarber.id);

    if (!Number.isInteger(barberId)) {
      console.error("INVALID BARBER:", selectedBarber);

      Alert.alert(
        "Barber Error",
        "Selected barber does not have a valid database ID.",
      );
      return;
    }

    /*
     * Validate service
     */
    if (!selectedServiceItem) {
      Alert.alert("Service Error", "Selected service could not be found.");
      return;
    }

    /*
     * Validate service ID
     */
    const serviceId = Number(selectedServiceItem.id);

    if (!Number.isInteger(serviceId)) {
      console.error("INVALID SERVICE:", selectedServiceItem);

      Alert.alert(
        "Service Error",
        "Selected service does not have a valid database ID.",
      );
      return;
    }

    /*
     * Appointment ID
     *
     * Customer Management creates the appointment.
     * Payment will connect to that appointment.
     */
    let appointmentId = null;

    if (
      selectedCustomer.appointment_id !== null &&
      selectedCustomer.appointment_id !== undefined &&
      selectedCustomer.appointment_id !== ""
    ) {
      const convertedAppointmentId = Number(selectedCustomer.appointment_id);

      if (Number.isInteger(convertedAppointmentId)) {
        appointmentId = convertedAppointmentId;
      }
    }

    /*
     * Final payload for backend
     */
    const paymentData = {
      appointment_id: appointmentId,

      customer_id: customerId,

      barber_id: barberId,

      service_id: serviceId,

      price: price,

      amount_paid: paid,

      payment_method: paymentMethod,

      status: "Paid",
    };

    /*
     * Debug
     */
    console.log("========== PAYMENT DEBUG ==========");

    console.log("SELECTED CUSTOMER:", selectedCustomer);

    console.log("SELECTED BARBER:", selectedBarber);

    console.log("SELECTED SERVICE:", selectedServiceItem);

    console.log("CUSTOMER ID:", customerId);

    console.log("BARBER ID:", barberId);

    console.log("SERVICE ID:", serviceId);

    console.log("APPOINTMENT ID:", appointmentId);

    console.log("PAYMENT DATA:", paymentData);

    console.log("====================================");

    try {
      setSaving(true);

      /*
       * Send payment to backend
       */
      const result = await addPayment(paymentData, token);

      console.log("PAYMENT SAVED:", result);

      if (result && result.success) {
        const customerName = customer;

        /*
         * Reset form
         */
        setShowForm(false);
        setSelector(null);

        setCustomer("");
        setBarber("");
        setService("");
        setServicePrice("");
        setAmountPaid("");
        setPaymentMethod("Cash");

        Alert.alert(
          "Payment Saved",
          `Payment for ${customerName} has been recorded successfully.\n\nTransaction: ${
            result.data?.transaction_number || "Created"
          }`,
        );
      } else {
        Alert.alert(
          "Payment Failed",
          result?.message || "Failed to save payment.",
        );
      }
    } catch (error) {
      console.error("SAVE PAYMENT ERROR:", error);

      Alert.alert(
        "Save Payment Failed",
        error.message || "Failed to save payment to the database.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * DELETE PAYMENT
   */
  const handleDeletePayment = async (payment) => {
    if (deletingId !== null) {
      return;
    }

    const token = localStorage.getItem("cliptrack_token");

    if (!token) {
      Alert.alert("Session Expired", "Please login again.");
      return;
    }

    const deleteConfirmed =
      Platform.OS === "web"
        ? window.confirm(
            `Are you sure you want to delete ${payment.customer}'s payment?`,
          )
        : await new Promise((resolve) => {
            Alert.alert(
              "Delete Payment",
              `Are you sure you want to delete ${payment.customer}'s payment?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (!deleteConfirmed) {
      return;
    }

    try {
      setDeletingId(payment.id);

      console.log("=================================");
      console.log("DELETE BUTTON CLICKED");
      console.log("Payment:", payment);
      console.log("Payment ID:", payment.id);
      console.log("Token exists:", !!token);
      console.log("=================================");

      const result = await deletePayment(Number(payment.id), token);

      console.log("DELETE RESULT FROM SCREEN:", result);

      if (!result || result.success !== true) {
        throw new Error(result?.message || "Payment was not deleted.");
      }

      Alert.alert(
        "Deleted",
        `${payment.customer}'s payment has been deleted successfully.`,
      );
    } catch (error) {
      console.error("DELETE PAYMENT ERROR:", error);

      Alert.alert(
        "Delete Failed",
        error.message || "Failed to delete payment.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * Format money
   */
  const formatMoney = (amount) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  /*
   * Selector modal
   */
  const renderSelectorModal = () => {
    let title = "";
    let data = [];

    if (selector === "customer") {
      title = "Select Customer";
      data = customers;
    }

    if (selector === "barber") {
      title = "Select Barber";
      data = availableBarbers;
    }

    if (selector === "service") {
      title = "Select Service";
      data = activeServices;
    }

    return (
      <Modal
        visible={selector !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelector(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>

              <TouchableOpacity onPress={() => setSelector(null)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {data.length === 0 ? (
              <View style={styles.emptySelector}>
                <Text style={styles.emptySelectorText}>
                  No available {selector}s found.
                </Text>
              </View>
            ) : (
              <FlatList
                data={data}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectorItem}
                    onPress={() => {
                      if (selector === "customer") {
                        selectCustomer(item);
                      }

                      if (selector === "barber") {
                        selectBarber(item);
                      }

                      if (selector === "service") {
                        selectService(item);
                      }
                    }}
                  >
                    <View style={styles.selectorIcon}>
                      <Text style={styles.selectorIconText}>
                        {selector === "customer"
                          ? "C"
                          : selector === "barber"
                            ? "B"
                            : "S"}
                      </Text>
                    </View>

                    <View style={styles.selectorInfo}>
                      <Text style={styles.selectorName}>{item.name}</Text>

                      {selector === "customer" && (
                        <Text style={styles.selectorSubtext}>
                          {item.phone || "No contact number"}
                        </Text>
                      )}

                      {selector === "barber" && (
                        <Text style={styles.selectorSubtext}>
                          {item.phone || "No contact number"}
                        </Text>
                      )}

                      {selector === "service" && (
                        <Text style={styles.selectorSubtext}>
                          {item.category} • {item.duration} mins
                        </Text>
                      )}
                    </View>

                    {selector === "service" && (
                      <Text style={styles.selectorPrice}>
                        {formatMoney(item.price)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payment Management</Text>

          <Text style={styles.headerSubtitle}>
            Record and manage customer payments
          </Text>
        </View>

        <TouchableOpacity style={styles.newButton} onPress={openNewPayment}>
          <Text style={styles.newButtonText}>+ New Payment</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Payments</Text>

          <Text style={styles.summaryValue}>{payments.length}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Sales</Text>

          <Text style={styles.summaryValue}>
            {formatMoney(
              payments.reduce(
                (total, payment) => total + Number(payment.price || 0),
                0,
              ),
            )}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Cash Received</Text>

          <Text style={styles.summaryValue}>
            {formatMoney(
              payments.reduce(
                (total, payment) => total + Number(payment.amountPaid || 0),
                0,
              ),
            )}
          </Text>
        </View>
      </View>

      {/* PAYMENT LIST */}
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Payments Yet</Text>

            <Text style={styles.emptyText}>
              Click "+ New Payment" to record a payment.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.paymentTop}>
              <View style={styles.paymentCustomerContainer}>
                <View style={styles.customerCircle}>
                  <Text style={styles.customerCircleText}>
                    {item.customer
                      ? item.customer.charAt(0).toUpperCase()
                      : "C"}
                  </Text>
                </View>

                <View>
                  <Text style={styles.customerName}>{item.customer}</Text>

                  <Text style={styles.transactionId}>{item.transactionId}</Text>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Barber</Text>

              <Text style={styles.detailValue}>{item.barber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>

              <Text style={styles.detailValue}>{item.service}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price</Text>

              <Text style={styles.detailValue}>{formatMoney(item.price)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>

              <Text style={styles.detailValue}>
                {formatMoney(item.amountPaid)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Change</Text>

              <Text style={styles.changeValue}>{formatMoney(item.change)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>

              <Text style={styles.detailValue}>{item.paymentMethod}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>

              <Text style={styles.detailValue}>
                {item.date} • {item.time}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                deletingId === item.id && styles.deleteButtonDisabled,
              ]}
              disabled={deletingId === item.id}
              onPress={() => handleDeletePayment(item)}
            >
              <Text style={styles.deleteButtonText}>
                {deletingId === item.id ? "Deleting..." : "Delete Payment"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* NEW PAYMENT FORM */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Payment</Text>

                <Text style={styles.modalSubtitle}>
                  Select customer, barber, and service
                </Text>
              </View>

              <TouchableOpacity disabled={saving} onPress={closeForm}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* CUSTOMER */}
              <Text style={styles.inputLabel}>Customer</Text>

              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setSelector("customer")}
              >
                <Text
                  style={
                    customer ? styles.selectedText : styles.placeholderText
                  }
                >
                  {customer || "Select customer"}
                </Text>

                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>

              {/* BARBER */}
              <Text style={styles.inputLabel}>Barber</Text>

              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setSelector("barber")}
              >
                <Text
                  style={barber ? styles.selectedText : styles.placeholderText}
                >
                  {barber || "Select barber"}
                </Text>

                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>

              {/* SERVICE */}
              <Text style={styles.inputLabel}>Service</Text>

              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setSelector("service")}
              >
                <Text
                  style={service ? styles.selectedText : styles.placeholderText}
                >
                  {service || "Select service"}
                </Text>

                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>

              {/* SERVICE PRICE */}
              <Text style={styles.inputLabel}>Service Price</Text>

              <View style={styles.priceBox}>
                <Text style={styles.priceSymbol}>₱</Text>

                <Text style={styles.priceText}>
                  {servicePrice ? Number(servicePrice).toFixed(2) : "0.00"}
                </Text>
              </View>

              <Text style={styles.helperText}>
                Service price is automatically filled based on the selected
                service.
              </Text>

              {/* AMOUNT PAID */}
              <Text style={styles.inputLabel}>Amount Paid</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Enter amount paid"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={amountPaid}
                onChangeText={setAmountPaid}
              />

              {/* PAYMENT METHOD */}
              <Text style={styles.inputLabel}>Payment Method</Text>

              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === "Cash" && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setPaymentMethod("Cash")}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === "Cash" &&
                        styles.paymentMethodTextSelected,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === "GCash" && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setPaymentMethod("GCash")}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === "GCash" &&
                        styles.paymentMethodTextSelected,
                    ]}
                  >
                    GCash
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CHANGE */}
              <View style={styles.changeBox}>
                <View>
                  <Text style={styles.changeLabel}>Change</Text>

                  <Text style={styles.changeFormula}>
                    Amount Paid - Service Price
                  </Text>
                </View>

                <Text style={styles.changeAmount}>{formatMoney(change)}</Text>
              </View>

              {/* SAVE */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                disabled={saving}
                onPress={savePayment}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save Payment"}
                </Text>
              </TouchableOpacity>

              {/* CANCEL */}
              <TouchableOpacity
                style={styles.cancelButton}
                disabled={saving}
                onPress={closeForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {renderSelectorModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#D9F1E8",
    fontSize: 12,
    marginTop: 4,
  },

  newButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
  },

  newButtonText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "800",
  },

  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5EAE7",
  },

  summaryLabel: {
    color: "#777",
    fontSize: 11,
    marginBottom: 6,
  },

  summaryValue: {
    color: GREEN,
    fontSize: 17,
    fontWeight: "800",
  },

  listContainer: {
    padding: 14,
    paddingBottom: 30,
  },

  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E4E9E6",
  },

  paymentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentCustomerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  customerCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#E3F2EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  customerCircleText: {
    color: GREEN,
    fontSize: 17,
    fontWeight: "800",
  },

  customerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  transactionId: {
    color: "#888",
    fontSize: 11,
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: "#E4F4EC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#ECEFED",
    marginVertical: 13,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },

  detailLabel: {
    color: "#777",
    fontSize: 12,
  },

  detailValue: {
    color: "#222",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },

  changeValue: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "800",
  },

  deleteButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E15B5B",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },

  deleteButtonDisabled: {
    opacity: 0.5,
  },

  deleteButtonText: {
    color: "#D94A4A",
    fontSize: 12,
    fontWeight: "800",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 35,
    alignItems: "center",
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#333",
  },

  emptyText: {
    color: "#888",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  formModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    maxHeight: "92%",
  },

  selectorModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    maxHeight: "75%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#222",
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },

  closeText: {
    color: "#555",
    fontSize: 22,
    fontWeight: "600",
  },

  inputLabel: {
    color: "#333",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 11,
  },

  selectInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D9DFDC",
    borderRadius: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFBFA",
  },

  selectedText: {
    color: "#222",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  placeholderText: {
    color: "#999",
    fontSize: 14,
  },

  arrow: {
    color: GREEN,
    fontSize: 12,
    marginLeft: 10,
  },

  priceBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CFE4DA",
    borderRadius: 9,
    paddingHorizontal: 14,
    backgroundColor: "#F0F8F4",
    flexDirection: "row",
    alignItems: "center",
  },

  priceSymbol: {
    color: GREEN,
    fontSize: 16,
    fontWeight: "800",
    marginRight: 5,
  },

  priceText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: "800",
  },

  helperText: {
    color: "#888",
    fontSize: 10,
    marginTop: 5,
  },

  textInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D9DFDC",
    borderRadius: 9,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#FAFBFA",
  },

  paymentMethodContainer: {
    flexDirection: "row",
    gap: 10,
  },

  paymentMethodButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9DFDC",
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FAFBFA",
  },

  paymentMethodSelected: {
    borderColor: GREEN,
    backgroundColor: "#EAF6F0",
  },

  paymentMethodText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
  },

  paymentMethodTextSelected: {
    color: GREEN,
  },

  changeBox: {
    backgroundColor: "#EAF6F0",
    borderRadius: 12,
    padding: 15,
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  changeLabel: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "800",
  },

  changeFormula: {
    color: "#6D8A7D",
    fontSize: 10,
    marginTop: 3,
  },

  changeAmount: {
    color: GREEN,
    fontSize: 20,
    fontWeight: "900",
  },

  saveButton: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#D9DFDC",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 9,
  },

  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "700",
  },

  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0EE",
  },

  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  selectorIconText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "900",
  },

  selectorInfo: {
    flex: 1,
  },

  selectorName: {
    color: "#222",
    fontSize: 14,
    fontWeight: "800",
  },

  selectorSubtext: {
    color: "#888",
    fontSize: 11,
    marginTop: 3,
  },

  selectorPrice: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },

  emptySelector: {
    paddingVertical: 30,
    alignItems: "center",
  },

  emptySelectorText: {
    color: "#888",
    fontSize: 13,
  },
});
