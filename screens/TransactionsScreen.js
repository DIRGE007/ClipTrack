import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";

import { usePayments } from "../data/PaymentContext";

export default function TransactionsScreen() {
  const { payments } = usePayments();

  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const transactions = payments.map((payment) => ({
    ...payment,
    status: "Completed",
  }));

  const filteredTransactions = transactions.filter((transaction) => {
    const keyword = search.toLowerCase();

    return (
      transaction.transactionId.toLowerCase().includes(keyword) ||
      transaction.customer.toLowerCase().includes(keyword) ||
      transaction.service.toLowerCase().includes(keyword) ||
      transaction.paymentMethod.toLowerCase().includes(keyword)
    );
  });

  const totalSales = transactions.reduce(
    (total, transaction) => total + Number(transaction.price),
    0,
  );

  const totalCashReceived = transactions.reduce(
    (total, transaction) => total + Number(transaction.amountPaid),
    0,
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction Management</Text>

        <Text style={styles.headerSubtitle}>
          Automatically recorded payment transactions
        </Text>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Transactions</Text>

          <Text style={styles.summaryValue}>{transactions.length}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Sales</Text>

          <Text style={styles.summaryValue}>
            ₱{totalSales.toLocaleString()}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Cash Received</Text>

          <Text style={styles.summaryValue}>
            ₱{totalCashReceived.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transaction..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* TRANSACTIONS */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        ) : (
          filteredTransactions
            .slice()
            .reverse()
            .map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.transactionId}>
                      {transaction.transactionId}
                    </Text>

                    <Text style={styles.customerName}>
                      {transaction.customer}
                    </Text>
                  </View>

                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Service</Text>

                  <Text style={styles.infoValue}>{transaction.service}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Barber</Text>

                  <Text style={styles.infoValue}>{transaction.barber}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Service Price</Text>

                  <Text style={styles.infoValue}>
                    ₱{transaction.price.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Method</Text>

                  <Text style={styles.infoValue}>
                    {transaction.paymentMethod}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => setSelectedTransaction(transaction)}
                >
                  <Text style={styles.viewButtonText}>View Transaction</Text>
                </TouchableOpacity>
              </View>
            ))
        )}
      </ScrollView>

      {/* DETAILS MODAL */}
      <Modal
        visible={selectedTransaction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedTransaction && (
              <ScrollView>
                <Text style={styles.modalTitle}>Transaction Details</Text>

                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptLogo}>CLIPTRACK</Text>

                  <Text style={styles.receiptSubtitle}>BARBERSHOP</Text>

                  <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction ID</Text>

                  <Text style={styles.receiptValue}>
                    {selectedTransaction.transactionId}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Customer</Text>

                  <Text style={styles.receiptValue}>
                    {selectedTransaction.customer}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Barber</Text>

                  <Text style={styles.receiptValue}>
                    {selectedTransaction.barber}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Service</Text>

                  <Text style={styles.receiptValue}>
                    {selectedTransaction.service}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Service Price</Text>

                  <Text style={styles.receiptValue}>
                    ₱{selectedTransaction.price.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount Paid</Text>

                  <Text style={styles.receiptValue}>
                    ₱{selectedTransaction.amountPaid.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Change</Text>

                  <Text style={styles.changeValue}>
                    ₱{selectedTransaction.change.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method</Text>

                  <Text style={styles.receiptValue}>
                    {selectedTransaction.paymentMethod}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Status</Text>

                  <Text style={styles.completedText}>Completed</Text>
                </View>

                <View style={styles.receiptDivider} />

                <Text style={styles.receiptDate}>
                  {selectedTransaction.date}
                  {" • "}
                  {selectedTransaction.time}
                </Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedTransaction(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#DDF3EA",
    marginTop: 5,
    fontSize: 13,
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
    padding: 12,
    elevation: 2,
  },

  summaryLabel: {
    color: "#6B7280",
    fontSize: 10,
  },

  summaryValue: {
    color: "#1F7A5C",
    fontSize: 17,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    fontSize: 14,
  },

  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },

  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 12,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  transactionId: {
    color: "#1F7A5C",
    fontSize: 12,
    fontWeight: "800",
  },

  customerName: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 3,
  },

  completedBadge: {
    backgroundColor: "#E4F6ED",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  completedText: {
    color: "#1F7A5C",
    fontSize: 11,
    fontWeight: "800",
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

  infoLabel: {
    color: "#6B7280",
    fontSize: 13,
  },

  infoValue: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "700",
  },

  viewButton: {
    backgroundColor: "#1F7A5C",
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 8,
  },

  viewButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },

  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },

  emptyText: {
    color: "#6B7280",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },

  receiptHeader: {
    alignItems: "center",
  },

  receiptLogo: {
    color: "#1F7A5C",
    fontSize: 23,
    fontWeight: "900",
  },

  receiptSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },

  receiptTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
  },

  receiptDivider: {
    height: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 15,
  },

  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  receiptLabel: {
    color: "#6B7280",
    fontSize: 13,
  },

  receiptValue: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },

  changeValue: {
    color: "#1F7A5C",
    fontSize: 13,
    fontWeight: "900",
  },

  receiptDate: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
  },

  closeButton: {
    backgroundColor: "#1F7A5C",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
