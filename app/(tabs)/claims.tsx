import MyClaims from '@/components/pages/MyClaims';
import { firebase } from '@/firebase.config';
import { View } from '@/theme/Themed';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ClaimsScreen() {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
    });
    return unsubscribe;
  }, []);

  if (!isSignedIn) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ height: '100%', width: '100%' }}>
        <MyClaims />
      </View>
    </GestureHandlerRootView>
  );
}
