import AnimatedIntro from '@/components/AnimatedIntro'
import BottomLoginSheet from '@/components/BottomLoginSheet'
import MyItems from '@/components/pages/MySaved'
import { firebase } from '@/firebase.config'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const saved = () => {

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
    <View style={{height: '100%', width: '100%'}}>
      <MyItems />
    </View>
  )
}

export default saved

const styles = StyleSheet.create({})