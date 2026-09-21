import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { apiRequest } from "../services/api";

export default function DashboardScreen({ navigation }) {
  const [dashboard, setDashboard] = useState({
    customers: 0,
    appointments: 0,
    services: 0,
    sales: 0,
    todayAppointments: [],
  });

  const [loading, setLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("cliptrack_token");

      console.log("DASHBOARD TOKEN EXISTS:", !!token);

      if (!token) {
        console.log("No ClipTrack token found.");
        return;
      }

      const result = await apiRequest("/reports/dashboard", "GET", null, token);

      console.log("DASHBOARD API RESULT:", result);

      if (result && result.success && result.data) {
        setDashboard({
          customers: Number(result.data.customers || 0),

          appointments: Number(result.data.appointments || 0),

          services: Number(result.data.services || 0),

          sales: Number(result.data.sales || 0),

          todayAppointments: Array.isArray(result.data.todayAppointments)
            ? result.data.todayAppointments
            : [],
        });
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    const value = String(time);

    const parts = value.split(":");

    let hour = Number(parts[0]);

    const minute = parts[1] || "00";

    if (Number.isNaN(hour)) {
      return value;
    }

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${ampm}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDashboard} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>ClipTrack</Text>

          <Text style={styles.subtitle}>Barbershop Management System</Text>
        </View>

        <View style={styles.profileCircle}>
          <Text style={styles.profileText}>A</Text>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>Good morning! 👋</Text>

        <Text style={styles.greetingSub}>Here's what's happening today.</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {/* Customers */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>👥</Text>

          <Text style={styles.cardNumber}>{dashboard.customers}</Text>

          <Text style={styles.cardLabel}>Customers</Text>
        </View>

        {/* Appointments */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>📅</Text>

          <Text style={styles.cardNumber}>{dashboard.appointments}</Text>

          <Text style={styles.cardLabel}>Appointments</Text>
        </View>

        {/* Services */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>✂️</Text>

          <Text style={styles.cardNumber}>{dashboard.services}</Text>

          <Text style={styles.cardLabel}>Services</Text>
        </View>

        {/* Sales */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardIcon}>💰</Text>

          <Text style={styles.cardNumber}>
            ₱
            {dashboard.sales.toLocaleString("en-PH", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </Text>

          <Text style={styles.cardLabel}>Sales</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.quickActionsContainer}>
        {/* Customers */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Customers")}
        >
          <Text style={styles.quickActionIcon}>👥</Text>

          <Text style={styles.quickActionText}>Customers</Text>
        </TouchableOpacity>

        {/* Appointments */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Appointments")}
        >
          <Text style={styles.quickActionIcon}>📅</Text>

          <Text style={styles.quickActionText}>Appointments</Text>
        </TouchableOpacity>

        {/* Services */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Services")}
        >
          <Text style={styles.quickActionIcon}>✂️</Text>

          <Text style={styles.quickActionText}>Services</Text>
        </TouchableOpacity>

        {/* Payments */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Payments")}
        >
          <Text style={styles.quickActionIcon}>💳</Text>

          <Text style={styles.quickActionText}>Payments</Text>
        </TouchableOpacity>

        {/* Barbers */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Barbers")}
        >
          <Text style={styles.quickActionIcon}>✂️</Text>

          <Text style={styles.quickActionText}>Barbers</Text>
        </TouchableOpacity>

        {/* Transactions */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate("Transactions")}
        >
          <Text style={styles.quickActionIcon}>🧾</Text>

          <Text style={styles.quickActionText}>Transactions</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Appointments */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Appointments")}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Appointments */}
      {dashboard.todayAppointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📅</Text>

          <Text style={styles.emptyTitle}>No appointments today</Text>

          <Text style={styles.emptyText}>
            There are no appointments scheduled for today.
          </Text>
        </View>
      ) : (
        dashboard.todayAppointments.map((appointment) => {
          const customerName = appointment.customer_name || "Unknown Customer";

          const serviceName = appointment.service_name || "No Service";

          const status = appointment.status || "Pending";

          return (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {customerName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View>
                  <Text style={styles.customerName}>{customerName}</Text>

                  <Text style={styles.serviceName}>{serviceName}</Text>
                </View>
              </View>

              <View style={styles.appointmentRight}>
                <Text style={styles.time}>
                  {formatTime(appointment.appointment_time)}
                </Text>

                <Text style={styles.confirmed}>{status}</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Reports Button */}
      <TouchableOpacity
        style={styles.reportsButton}
        onPress={() => navigation.navigate("Reports")}
      >
        <Text style={styles.reportsIcon}>📊</Text>

        <View style={styles.reportsTextContainer}>
          <Text style={styles.reportsTitle}>Reports</Text>

          <Text style={styles.reportsSubtitle}>
            View sales and transaction reports
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F6",
  },

  header: {
    backgroundColor: "#1F7A5C",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  subtitle: {
    fontSize: 12,
    color: "#DDF2EA",
    marginTop: 3,
  },

  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  profileText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F7A5C",
  },

  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },

  greetingSub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },

  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 10,
  },

  summaryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  cardNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F7A5C",
  },

  cardLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 12,
  },

  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },

  quickAction: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  quickActionIcon: {
    fontSize: 25,
    marginBottom: 7,
  },

  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },

  viewAll: {
    color: "#1F7A5C",
    fontSize: 13,
    fontWeight: "600",
  },

  appointmentCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },

  appointmentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E2F1EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#1F7A5C",
    fontWeight: "bold",
    fontSize: 17,
  },

  customerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
  },

  serviceName: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  appointmentRight: {
    alignItems: "flex-end",
  },

  time: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#374151",
  },

  confirmed: {
    fontSize: 11,
    color: "#1F7A5C",
    backgroundColor: "#E2F1EB",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
  },

  emptyText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
    textAlign: "center",
  },

  reportsButton: {
    backgroundColor: "#1F7A5C",
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 30,
    padding: 17,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  reportsIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  reportsTextContainer: {
    flex: 1,
  },

  reportsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  reportsSubtitle: {
    color: "#DDF2EA",
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 28,
  },
});
