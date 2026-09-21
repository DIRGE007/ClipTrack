import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { usePayments } from "../data/PaymentContext";
import { useCustomers } from "../data/CustomerContext";
import { useServices } from "../data/ServiceContext";

export default function ReportsScreen() {
  const { payments } = usePayments();
  const { customers } = useCustomers();
  const { services } = useServices();

  const [search, setSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("All");

  // ==========================================
  // TODAY'S DATE
  // ==========================================

  const today = new Date();

  const todayISO = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const todayDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ==========================================
  // FORMAT DATABASE DATE
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const dateString = String(dateValue);

    // Already MySQL date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);

      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    // ISO date
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      return dateString;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // ==========================================
  // CHECK IF PAYMENT IS TODAY
  // ==========================================

  const isPaymentToday = (payment) => {
    if (!payment?.date) {
      return false;
    }

    const paymentDate = String(payment.date);

    // MySQL DATE: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return paymentDate === todayISO;
    }

    // Other date formats
    const parsedDate = new Date(paymentDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    return (
      parsedDate.getFullYear() === today.getFullYear() &&
      parsedDate.getMonth() === today.getMonth() &&
      parsedDate.getDate() === today.getDate()
    );
  };

  // ==========================================
  // TOTAL SALES
  // ==========================================

  const totalSales = useMemo(() => {
    return payments.reduce(
      (total, payment) => total + Number(payment.price || 0),
      0,
    );
  }, [payments]);

  // ==========================================
  // TOTAL AMOUNT RECEIVED
  // ==========================================

  const totalReceived = useMemo(() => {
    return payments.reduce(
      (total, payment) => total + Number(payment.amountPaid || 0),
      0,
    );
  }, [payments]);

  // ==========================================
  // TOTAL CHANGE GIVEN
  // ==========================================

  const totalChange = useMemo(() => {
    return payments.reduce(
      (total, payment) => total + Number(payment.change || 0),
      0,
    );
  }, [payments]);

  // ==========================================
  // CASH SALES
  // ==========================================

  const cashSales = useMemo(() => {
    return payments
      .filter((payment) => payment.paymentMethod === "Cash")
      .reduce((total, payment) => total + Number(payment.price || 0), 0);
  }, [payments]);

  // ==========================================
  // GCASH SALES
  // ==========================================

  const gcashSales = useMemo(() => {
    return payments
      .filter((payment) => payment.paymentMethod === "GCash")
      .reduce((total, payment) => total + Number(payment.price || 0), 0);
  }, [payments]);

  // ==========================================
  // TODAY'S SALES
  // ==========================================

  const todaySales = useMemo(() => {
    return payments
      .filter(isPaymentToday)
      .reduce((total, payment) => total + Number(payment.price || 0), 0);
  }, [payments]);

  // ==========================================
  // TODAY'S TRANSACTIONS
  // ==========================================

  const todayTransactions = useMemo(() => {
    return payments.filter(isPaymentToday).length;
  }, [payments]);

  // ==========================================
  // FILTER REPORTS
  // ==========================================

  const filteredPayments = useMemo(() => {
    let result = [...payments];

    if (reportFilter === "Today") {
      result = result.filter(isPaymentToday);
    }

    if (reportFilter === "Cash") {
      result = result.filter((payment) => payment.paymentMethod === "Cash");
    }

    if (reportFilter === "GCash") {
      result = result.filter((payment) => payment.paymentMethod === "GCash");
    }

    if (search.trim()) {
      const keyword = search.toLowerCase();

      result = result.filter(
        (payment) =>
          payment.customer?.toLowerCase().includes(keyword) ||
          payment.service?.toLowerCase().includes(keyword) ||
          payment.barber?.toLowerCase().includes(keyword) ||
          payment.paymentMethod?.toLowerCase().includes(keyword) ||
          payment.transactionId?.toLowerCase().includes(keyword),
      );
    }

    return result.reverse();
  }, [payments, reportFilter, search]);

  // ==========================================
  // SERVICE SALES REPORT
  // SHOW ALL SERVICES
  // ==========================================

  const serviceReport = useMemo(() => {
    const report = {};

    // Start with all services
    services.forEach((service) => {
      const serviceName = service.name || "Unknown Service";

      report[serviceName] = {
        service: serviceName,
        transactions: 0,
        sales: 0,
      };
    });

    // Add payment information
    payments.forEach((payment) => {
      const serviceName = payment.service || "Unknown Service";

      if (!report[serviceName]) {
        report[serviceName] = {
          service: serviceName,
          transactions: 0,
          sales: 0,
        };
      }

      report[serviceName].transactions += 1;

      report[serviceName].sales += Number(payment.price || 0);
    });

    return Object.values(report).sort((a, b) => b.sales - a.sales);
  }, [payments, services]);

  // ==========================================
  // BARBER PERFORMANCE REPORT
  // ==========================================

  const barberReport = useMemo(() => {
    const report = {};

    payments.forEach((payment) => {
      const barberName = payment.barber || "Unknown Barber";

      if (!report[barberName]) {
        report[barberName] = {
          barber: barberName,
          transactions: 0,
          sales: 0,
        };
      }

      report[barberName].transactions += 1;

      report[barberName].sales += Number(payment.price || 0);
    });

    return Object.values(report).sort((a, b) => b.sales - a.sales);
  }, [payments]);

  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = (amount) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  // ==========================================
  // FORMAT DATE + TIME
  // ==========================================

  const formatDateTime = (date, time) => {
    const formattedDate = formatDate(date);

    if (!time) {
      return formattedDate;
    }

    return `${formattedDate} • ${time}`;
  };

  // ==========================================
  // PAYMENT ITEM
  // ==========================================

  const renderPayment = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>{item.customer}</Text>

          <Text style={styles.transactionId}>{item.transactionId}</Text>
        </View>

        <View
          style={[
            styles.methodBadge,
            item.paymentMethod === "GCash"
              ? styles.gcashBadge
              : styles.cashBadge,
          ]}
        >
          <Text
            style={[
              styles.methodBadgeText,
              item.paymentMethod === "GCash"
                ? styles.gcashText
                : styles.cashText,
            ]}
          >
            {item.paymentMethod}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Service</Text>

        <Text style={styles.serviceText}>{item.service}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Barber</Text>

        <Text style={styles.infoValue}>{item.barber}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Price</Text>

        <Text style={styles.infoValue}>{formatMoney(item.price)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Amount Paid</Text>

        <Text style={styles.infoValue}>{formatMoney(item.amountPaid)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Change</Text>

        <Text style={styles.changeText}>{formatMoney(item.change)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Date & Time</Text>

        <Text style={styles.infoValue}>
          {formatDateTime(item.date, item.time)}
        </Text>
      </View>
    </View>
  );

  // ==========================================
  // SERVICE REPORT ITEM
  // ==========================================

  const renderServiceReport = ({ item }) => (
    <View style={styles.reportRow}>
      <View style={styles.reportRank}>
        <Text style={styles.reportRankText}>
          {serviceReport.indexOf(item) + 1}
        </Text>
      </View>

      <View style={styles.reportMain}>
        <Text style={styles.reportName}>{item.service}</Text>

        <Text style={styles.reportSubtext}>
          {item.transactions} transaction
          {item.transactions !== 1 ? "s" : ""}
        </Text>
      </View>

      <Text style={styles.reportAmount}>{formatMoney(item.sales)}</Text>
    </View>
  );

  // ==========================================
  // BARBER REPORT ITEM
  // ==========================================

  const renderBarberReport = ({ item }) => (
    <View style={styles.reportRow}>
      <View style={styles.barberAvatar}>
        <Text style={styles.barberAvatarText}>
          {item.barber?.charAt(0)?.toUpperCase() || "B"}
        </Text>
      </View>

      <View style={styles.reportMain}>
        <Text style={styles.reportName}>{item.barber}</Text>

        <Text style={styles.reportSubtext}>
          {item.transactions} transaction
          {item.transactions !== 1 ? "s" : ""}
        </Text>
      </View>

      <Text style={styles.reportAmount}>{formatMoney(item.sales)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>

        <Text style={styles.headerSubtitle}>
          Sales and business performance reports
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DATE */}
        <View style={styles.dateCard}>
          <View>
            <Text style={styles.dateLabel}>Report Date</Text>

            <Text style={styles.dateText}>{todayDate}</Text>
          </View>

          <View style={styles.reportIcon}>
            <Text style={styles.reportIconText}>R</Text>
          </View>
        </View>

        {/* MAIN SUMMARY */}
        <Text style={styles.sectionTitle}>Sales Overview</Text>

        <View style={styles.mainSummary}>
          <View style={styles.bigSummaryCard}>
            <Text style={styles.bigSummaryLabel}>Total Sales</Text>

            <Text style={styles.bigSummaryNumber}>
              {formatMoney(totalSales)}
            </Text>

            <Text style={styles.bigSummarySubtext}>
              {payments.length} payment
              {payments.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.bigSummaryCard}>
            <Text style={styles.bigSummaryLabel}>Today's Sales</Text>

            <Text style={styles.bigSummaryNumber}>
              {formatMoney(todaySales)}
            </Text>

            <Text style={styles.bigSummarySubtext}>
              {todayTransactions} transaction
              {todayTransactions !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* SMALL SUMMARY */}
        <View style={styles.smallSummaryRow}>
          <View style={styles.smallSummaryCard}>
            <Text style={styles.smallLabel}>Cash Sales</Text>

            <Text style={styles.smallNumber}>{formatMoney(cashSales)}</Text>
          </View>

          <View style={styles.smallSummaryCard}>
            <Text style={styles.smallLabel}>GCash Sales</Text>

            <Text style={styles.smallNumber}>{formatMoney(gcashSales)}</Text>
          </View>
        </View>

        <View style={styles.smallSummaryRow}>
          <View style={styles.smallSummaryCard}>
            <Text style={styles.smallLabel}>Amount Received</Text>

            <Text style={styles.smallNumber}>{formatMoney(totalReceived)}</Text>
          </View>

          <View style={styles.smallSummaryCard}>
            <Text style={styles.smallLabel}>Change Given</Text>

            <Text style={styles.smallNumber}>{formatMoney(totalChange)}</Text>
          </View>
        </View>

        {/* SYSTEM SUMMARY */}
        <Text style={styles.sectionTitle}>System Summary</Text>

        <View style={styles.systemSummary}>
          <View style={styles.systemItem}>
            <Text style={styles.systemNumber}>{customers.length}</Text>

            <Text style={styles.systemLabel}>Customers</Text>
          </View>

          <View style={styles.systemDivider} />

          <View style={styles.systemItem}>
            <Text style={styles.systemNumber}>{services.length}</Text>

            <Text style={styles.systemLabel}>Services</Text>
          </View>

          <View style={styles.systemDivider} />

          <View style={styles.systemItem}>
            <Text style={styles.systemNumber}>{payments.length}</Text>

            <Text style={styles.systemLabel}>Transactions</Text>
          </View>
        </View>

        {/* SERVICE REPORT */}
        <Text style={styles.sectionTitle}>Service Sales Report</Text>

        <View style={styles.reportCard}>
          {serviceReport.length > 0 ? (
            serviceReport.map((item) => (
              <View key={item.service}>
                {renderServiceReport({
                  item,
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyReport}>
              <Text style={styles.emptyReportText}>
                No service sales recorded yet.
              </Text>
            </View>
          )}
        </View>

        {/* BARBER REPORT */}
        <Text style={styles.sectionTitle}>Barber Sales Report</Text>

        <View style={styles.reportCard}>
          {barberReport.length > 0 ? (
            barberReport.map((item) => (
              <View key={item.barber}>
                {renderBarberReport({
                  item,
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyReport}>
              <Text style={styles.emptyReportText}>
                No barber sales recorded yet.
              </Text>
            </View>
          )}
        </View>

        {/* TRANSACTION REPORT */}
        <Text style={styles.sectionTitle}>Transaction Report</Text>

        {/* SEARCH */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search transaction..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />

        {/* FILTER BUTTONS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {["All", "Today", "Cash", "GCash"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                reportFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setReportFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  reportFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TRANSACTIONS */}
        {filteredPayments.length > 0 ? (
          filteredPayments.map((item) => (
            <View key={item.id}>{renderPayment({ item })}</View>
          ))
        ) : (
          <View style={styles.emptyTransaction}>
            <Text style={styles.emptyTransactionTitle}>
              No Transactions Found
            </Text>

            <Text style={styles.emptyTransactionText}>
              There are no transactions matching the selected report filter.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  header: {
    backgroundColor: "#1F7A5C",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#D9F2E8",
    fontSize: 12,
    marginTop: 4,
  },

  scrollContent: {
    padding: 16,
  },

  dateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },

  dateLabel: {
    color: "#888",
    fontSize: 11,
  },

  dateText: {
    color: "#222",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },

  reportIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#DFF2EA",
    alignItems: "center",
    justifyContent: "center",
  },

  reportIconText: {
    color: "#1F7A5C",
    fontSize: 20,
    fontWeight: "800",
  },

  sectionTitle: {
    color: "#333",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 10,
  },

  mainSummary: {
    flexDirection: "row",
    gap: 10,
  },

  bigSummaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },

  bigSummaryLabel: {
    color: "#777",
    fontSize: 11,
  },

  bigSummaryNumber: {
    color: "#1F7A5C",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },

  bigSummarySubtext: {
    color: "#999",
    fontSize: 10,
    marginTop: 4,
  },

  smallSummaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  smallSummaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },

  smallLabel: {
    color: "#777",
    fontSize: 10,
  },

  smallNumber: {
    color: "#1F7A5C",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 5,
  },

  systemSummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 2,
  },

  systemItem: {
    flex: 1,
    alignItems: "center",
  },

  systemNumber: {
    color: "#1F7A5C",
    fontSize: 20,
    fontWeight: "800",
  },

  systemLabel: {
    color: "#777",
    fontSize: 10,
    marginTop: 3,
  },

  systemDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#E5E5E5",
  },

  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 2,
  },

  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  reportRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#DFF2EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  reportRankText: {
    color: "#1F7A5C",
    fontWeight: "700",
    fontSize: 12,
  },

  barberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DFF2EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  barberAvatarText: {
    color: "#1F7A5C",
    fontWeight: "700",
  },

  reportMain: {
    flex: 1,
  },

  reportName: {
    color: "#333",
    fontSize: 13,
    fontWeight: "700",
  },

  reportSubtext: {
    color: "#999",
    fontSize: 10,
    marginTop: 3,
  },

  reportAmount: {
    color: "#1F7A5C",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyReport: {
    paddingVertical: 25,
    alignItems: "center",
  },

  emptyReportText: {
    color: "#999",
    fontSize: 12,
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },

  filterScroll: {
    marginVertical: 10,
  },

  filterButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DE",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
  },

  activeFilterButton: {
    backgroundColor: "#1F7A5C",
    borderColor: "#1F7A5C",
  },

  filterText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },

  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  customerName: {
    color: "#222",
    fontSize: 15,
    fontWeight: "700",
  },

  transactionId: {
    color: "#999",
    fontSize: 10,
    marginTop: 3,
  },

  methodBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
  },

  cashBadge: {
    backgroundColor: "#DFF2EA",
  },

  gcashBadge: {
    backgroundColor: "#E8EEF9",
  },

  methodBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  cashText: {
    color: "#1F7A5C",
  },

  gcashText: {
    color: "#4267A8",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 10,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  infoLabel: {
    color: "#777",
    fontSize: 11,
  },

  infoValue: {
    color: "#333",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },

  serviceText: {
    color: "#1F7A5C",
    fontSize: 11,
    fontWeight: "700",
    maxWidth: "65%",
    textAlign: "right",
  },

  changeText: {
    color: "#1F7A5C",
    fontSize: 11,
    fontWeight: "700",
  },

  emptyTransaction: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    elevation: 1,
  },

  emptyTransactionTitle: {
    color: "#555",
    fontSize: 15,
    fontWeight: "700",
  },

  emptyTransactionText: {
    color: "#999",
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
  },

  bottomSpace: {
    height: 30,
  },
});
