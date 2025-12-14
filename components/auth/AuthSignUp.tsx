import { Text, View } from '@/theme/Themed';
import React, { useState } from 'react';
import { Button, TextInput } from 'react-native-paper';

import { firebase } from '@/firebase.config';
import { StyleSheet } from 'react-native';
// import notifee from '@notifee/react-native';
import { clearAllData } from '@/components/pages/MyAccount';
import { lastUserHandle$, lastUserId$, persistEvents } from '@/utilities/EventsStore';
import { checkHandleAvailability, claimHandle, getHandleForUser, persistUserProfile } from '@/utilities/UserProfile';
import { router } from 'expo-router';
 
const AuthSignUp = () => {
  // const renderCount = React.useRef(1).current++
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;
    if (!handle) {
      alert('Please enter a handle');
      return;
    }
    setLoading(true);
    try {
      const { available, error } = await checkHandleAvailability(handle);
      if (!available) {
        alert(error || 'Handle not available');
        setLoading(false);
        return;
      }
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await claimHandle(cred.user?.uid || '', handle);
      await persistUserProfile(handle.toLowerCase());
      // await notifee.requestPermission();
      alert('Account created');
      if (cred.user) {
      lastUserId$.set(cred.user.uid);
      lastUserHandle$.set(getHandleForUser(cred.user.uid).toString());
      persistEvents(cred.user.uid);
      await clearAllData();
      router.replace('/(tabs)');
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

    const handleEnterPress = (e: any) => {
        if (e.key === 'Enter') {
        handleSignUp();
        }
    };

  return (
    <View style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* <Text>Renders: {renderCount}</Text> */}
      <TextInput 
        label="Handle" 
        mode='outlined' 
        value={handle} 
        onChangeText={setHandle}
        onKeyPress={handleEnterPress}
        style={{height: 50, width: 300}}
        />
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
      <View style={{ marginTop: 12 }}>
        <Button mode='outlined' style={styles.button} icon='account-plus' onPress={handleSignUp} disabled={loading}>{loading ? '...' : 'Sign Up'}</Button>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.text}>Already have an account? </Text>
        <Button 
          mode='outlined' 
          style={styles.button} 
          icon='account-outline'
          onPress={() => router.push({ pathname: '/auth', params: { type: 'login' } })}
        >
          Sign In
        </Button>
      </View>
    </View>
  );
}

export default AuthSignUp

const styles = StyleSheet.create({
  button: {
    // marginHorizontal: 10,
    width: 100,
    margin: 4,
  },
  text: {
    fontSize: 16,
    // fontWeight: 'bold',
    marginHorizontal: 10
  }
});