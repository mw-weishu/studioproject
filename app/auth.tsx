import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
// import { defaultStyles } from '../constants/Styles'
import AnimatedIntro from '@/components/AnimatedIntro';

import AuthResetPassword from '@/components/auth/AuthResetPassword';
import AuthSignIn from '@/components/auth/AuthSignIn';
import AuthSignUp from '@/components/auth/AuthSignUp';


const Page = () => {
  const { type } = useLocalSearchParams<{type: string}>();
  
  // Default to login if no type is provided
  const authType = type || 'login';
  
  // const [loading, setLoading] = useState(false);
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');

  // const signIn = async () => {
  //   setLoading(true)
  //   try {
  //     const user = await firebase.auth().signInWithEmailAndPassword(email, password)
  //     if (user) router.replace('/(tabs)')
  //   } catch (error: any) {
  //     console.log(error)
  //     alert('Sign in failed: ' + error.message);
  //   }
  //   setLoading(false)
  // }

  // const signUp = async () => {
  //   setLoading(true)
  //   try {
  //     const user = await firebase.auth().createUserWithEmailAndPassword(email, password)
  //     if (user) router.replace('/(tabs)')
  //   } catch (error: any) {
  //     console.log(error)
  //     alert('Sign in failed: ' + error.message);
  //   }
  //   setLoading(false)
  // }

  return (
    <View style={styles.wrapper}>
      <AnimatedIntro />
      <KeyboardAvoidingView
        behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={1}
      >
        {/* {loading && (
          // <View style={defaultStyles.loadingOverlay}>
          <View>
            <ActivityIndicator size='large' color='#fff'/>
          </View>
        )} */}
        {/* <Image style={styles.logo} source={require('../assets/images/logo-white.png')} /> */}

        



        <View style={styles.auth}>
        {authType === 'login' ? (
          // <TouchableOpacity onPress={signIn} style={[defaultStyles.btn, styles.btnPrimary]}>
          <AuthSignIn />
        ) : authType === 'register' ? (
          // <TouchableOpacity onPress={signUp} style={[defaultStyles.btn, styles.btnPrimary]}>
          <AuthSignUp />
        ) : authType === 'reset-password' ? (
          <AuthResetPassword />
        ) : (
          <AuthSignIn />
        )}
        </View>

      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  auth: {
    marginTop: 10,
    gap: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    maxHeight: 350,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
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