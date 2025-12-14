import AnimatedIntro from '@/components/AnimatedIntro';
import BottomLoginSheet from '@/components/BottomLoginSheet';
import MyAI from '@/components/pages/MyAI';
import { firebase } from '@/firebase.config';
import React from 'react';
import { StyleSheet, View } from 'react-native';



const ai = () => {

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

  return (
    <View style={{ flex: 1, height: '100%' }}>
      <MyAI />
    </View>
  )
}

export default ai

const styles = StyleSheet.create({})