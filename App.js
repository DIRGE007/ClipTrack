import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "./navigation/AppNavigator";
import { AppointmentProvider } from "./data/AppointmentContext";
import { CustomerProvider } from "./data/CustomerContext";
import { BarberProvider } from "./data/BarberContext";
import { PaymentProvider } from "./data/PaymentContext";
import { ServiceProvider } from "./data/ServiceContext";

export default function App() {
  return (
    <BarberProvider>
      <CustomerProvider>
        <ServiceProvider>
          <AppointmentProvider>
            <PaymentProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </PaymentProvider>
          </AppointmentProvider>
        </ServiceProvider>
      </CustomerProvider>
    </BarberProvider>
  );
}
