import LostItemFeed from "@/components/pages/MyPager";
import { firebase } from "@/firebase.config";
import { observer } from "@legendapp/state/react";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const LandingPage = () => (
  <View style={landing.wrapper}>
    <View style={landing.content}>
      <Text style={landing.logo}>📦</Text>
      <Text style={landing.title}>Findora</Text>
      <Text style={landing.subtitle}>University Lost & Found</Text>
      <Text style={landing.tagline}>
        Report lost items, claim found ones — all in one place.
      </Text>
      <TouchableOpacity
        style={landing.btnPrimary}
        onPress={() => router.push({ pathname: "/auth", params: { type: "login" } })}
        activeOpacity={0.85}
      >
        <Text style={landing.btnPrimaryText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={landing.btnSecondary}
        onPress={() => router.push({ pathname: "/auth", params: { type: "register" } })}
        activeOpacity={0.85}
      >
        <Text style={landing.btnSecondaryText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const HomeScreen = observer(() => {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
    });
    return unsubscribe;
  }, []);

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={{ height: "100%", width: "100%" }}>
        <LostItemFeed />
      </View>
    </GestureHandlerRootView>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

const landing = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fcba03",
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  btnPrimary: {
    width: "100%",
    backgroundColor: "#fcba03",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#fcba03",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: "#fcba03",
    fontSize: 16,
    fontWeight: "600",
  },
});
