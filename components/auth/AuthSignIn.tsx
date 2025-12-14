import { Text, View } from '@/theme/Themed';
import React, { useState } from 'react';
import { Button, TextInput } from 'react-native-paper';

import { firebase } from '@/firebase.config';
import { StyleSheet } from 'react-native';
// import { scheduleMultipleNotifications, scheduleMultipleRepeatingNotifications } from '@/utilities/Notifications';
import { persistEvents } from '@/utilities/EventsStore';
import { router } from 'expo-router';

const AuthSignIn = () => {
  // const renderCount = React.useRef(1).current++

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((user) => {
            if (user) {
                // stateNavigator.navigate('home');
                if (user.user) {
                persistEvents(user.user.uid);
                // scheduleMultipleNotifications();
                // scheduleMultipleRepeatingNotifications();
              }
              router.replace('/(tabs)');
            }
        })
        .catch((err) => {
            alert(err?.message);
        });
  };

    const handleEnterPress = (e: any) => {
        if (e.key === 'Enter') {
        handleSignIn();
    }
    };

  return (
    <View style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* <Text>Renders: {renderCount}</Text> */}
      <TextInput 
        label="Email" 
        mode='outlined' 
        value={email} 
        onChangeText={setEmail}
        onKeyPress={handleEnterPress}
        style={{height: 50, width: 300}}
        />
      <TextInput 
        label="Password" 
        mode='outlined' 
        value={password} 
        onChangeText={setPassword}
        onKeyPress={handleEnterPress}
        secureTextEntry={true}
        style={{height: 50, width: 300}}
        />
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Button style={styles.button} mode='outlined' icon='account' onPress={handleSignIn}>Sign In</Button>
        <Button 
          style={styles.buttonkey} 
          mode='outlined' 
          icon='key-outline'
          onPress={() => router.push({ pathname: '/auth', params: { type: 'reset-password' } })}
        >
          Reset Password?
        </Button>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.text}>Don't have an account? </Text>
        <Button 
          style={styles.button} 
          mode='outlined' 
          icon='account-plus-outline'
          onPress={() => router.push({ pathname: '/auth', params: { type: 'register' } })}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
}

export default AuthSignIn

const styles = StyleSheet.create({
  button: {
    // marginHorizontal: 10,
    width: 100,
    margin: 4,
  },
  buttonkey: {
    // marginHorizontal: 10,
    width: 170,
    margin: 4,
  },
  text: {
    fontSize: 16,
    // fontWeight: 'bold',
    marginHorizontal: 10
  }
});