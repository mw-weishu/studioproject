import CheckoutForm from "@/components/payment-sheet";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabOneScreen() {

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <CheckoutForm />
    </SafeAreaView>
  );
}
