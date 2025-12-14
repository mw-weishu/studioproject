import AnimatedIntro from '@/components/AnimatedIntro';
import BottomLoginSheet from '@/components/BottomLoginSheet';
import SearchProfile from '@/components/pages/SearchProfile';
import { firebase } from '@/firebase.config';
import { View } from '@/theme/Themed';
import React from 'react';

export default function TabTwoScreen() {
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  
  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
      
    });
    return unsubscribe;
  }, []);

  if (!isSignedIn) {
    return (
      <View style={{flex: 1}}>
        <AnimatedIntro/>
        <BottomLoginSheet />
      </View>
    );
  }
  return <SearchProfile />;
}
