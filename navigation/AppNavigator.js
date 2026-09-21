import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import CustomersScreen from "../screens/CustomersScreen";
import AppointmentsScreen from "../screens/AppointmentsScreen";
import ServicesScreen from "../screens/ServicesScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import ReportsScreen from "../screens/ReportsScreen";
import BarbersScreen from "../screens/BarbersScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Barbers" component={BarbersScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />

      <Stack.Screen name="Customers" component={CustomersScreen} />

      <Stack.Screen name="Appointments" component={AppointmentsScreen} />

      <Stack.Screen name="Services" component={ServicesScreen} />

      <Stack.Screen name="Payments" component={PaymentsScreen} />

      <Stack.Screen name="Transactions" component={TransactionsScreen} />

      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}
