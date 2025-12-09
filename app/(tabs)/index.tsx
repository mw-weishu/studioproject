import CheckoutForm from '@/components/payment-sheet';
import React from 'react';
import { StyleSheet } from 'react-native';

// import EditScreenInfo from '@/components/EditScreenInfo';
// import { Text, View } from '@/components/Themed';
import AnimatedIntro from '@/components/AnimatedIntro';
import BottomLoginSheet from '@/components/BottomLoginSheet';
import { firebase } from '@/firebase.config';
import { Text, View } from 'react-native';

import { HoldItem } from '@/components/HoldItem';
import { router } from 'expo-router';

export default function TabOneScreen() {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        // router.replace('/landing');

      }
      setIsSignedIn(!!user);
    });
    return unsubscribe;
  }, []);

  if (!isSignedIn) {
    return (
      <View style={{flex: 1}}>
        <AnimatedIntro />
        <BottomLoginSheet />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      {/* <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" /> */}
      {/* <EditScreenInfo path="app/(tabs)/index.tsx" /> */}
      <CheckoutForm />
      <HoldItem
        activateOn='tap'
        items={[
          { text: 'explore', onPress: () => {
            router.navigate('/explore');
          }},
          { text: 'account', onPress: () => {
            router.navigate('/account');
          }},
        ]}
      >
        <View style={{ marginHorizontal: 50, borderRadius: 20, padding: 20, backgroundColor: '#ddd' }}>
          <Text>Long press me to see options</Text>
        </View>
      </HoldItem>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});