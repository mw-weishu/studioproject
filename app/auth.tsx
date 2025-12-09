import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { defaultStyles } from '../constants/Styles'
import AnimatedIntro from '@/components/AnimatedIntro';
import { firebase } from '@/firebase.config';
import { router } from 'expo-router';


const Page = () => {
  const { type } = useLocalSearchParams<{type: string}>();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = firebase.auth();

  const signIn = async () => {
    setLoading(true)
    try {
      const user = await firebase.auth().signInWithEmailAndPassword(email, password)
      if (user) router.replace('/(tabs)')
    } catch (error: any) {
      console.log(error)
      alert('Sign in failed: ' + error.message);
    }
    setLoading(false)
  }

  const signUp = async () => {
    setLoading(true)
    try {
      const user = await firebase.auth().createUserWithEmailAndPassword(email, password)
      if (user) router.replace('/(tabs)')
    } catch (error: any) {
      console.log(error)
      alert('Sign in failed: ' + error.message);
    }
    setLoading(false)
  }

  return (
    <View style={styles.wrapper}>
      <AnimatedIntro />
      <KeyboardAvoidingView
        behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={1}
      >
        {loading && (
          // <View style={defaultStyles.loadingOverlay}>
          <View>
            <ActivityIndicator size='large' color='#fff'/>
          </View>
        )}
        {/* <Image style={styles.logo} source={require('../assets/images/logo-white.png')} /> */}

        <Text style={styles.title}>
          {type === 'login' ? 'Welcome back' : 'Create your account'}
        </Text>

        <View style={{marginBottom: 20 }}>
          <TextInput
            autoCapitalize='none'
            placeholder='Email'
            style={styles.inputField}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            autoCapitalize='none'
            placeholder='Password'
            style={styles.inputField}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {type === 'login' ? (
          // <TouchableOpacity onPress={signIn} style={[defaultStyles.btn, styles.btnPrimary]}>
          <TouchableOpacity onPress={signIn}>
            <Text style={styles.btnPrimaryText}>Login</Text>
          </TouchableOpacity>
        ) : (
          // <TouchableOpacity onPress={signUp} style={[defaultStyles.btn, styles.btnPrimary]}>
          <TouchableOpacity onPress={signUp}>
            <Text style={styles.btnPrimaryText}>Create acount</Text>
          </TouchableOpacity>
        )}

      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    padding: 20,
    position: 'absolute',
    zIndex: 100,
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginVertical: 80,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
  },
  btnPrimary: {
    backgroundColor: "#007bff",
    marginVertical: 4,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
  }
})

export default Page;