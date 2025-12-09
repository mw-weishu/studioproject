import { StyleSheet } from 'react-native';
// import { Button, Text, View } from '@/components/Themed';
import { Button, Text } from 'react-native';

import { firebase } from '@/firebase.config';
import { reauthenticateWithCredential } from 'firebase/auth';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabTwoScreen() {
  const user = firebase.auth().currentUser;

  const signOutUser = () => {
    firebase.auth().signOut().then(() => {
      // Sign-out successful - root layout will handle navigation
      router.replace('/');
    }).catch((error) => {
      // An error happened.
      console.log(error);
    });
  };

  const resetPasswordViaEmail = () => {
    const email = prompt("Please enter your email address to reset the password.");
    if (email) {
      firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
          alert(`Password reset email sent to ${email}`);
        })
        .catch((error) => {
          alert(error?.message);
        });
    }
  };
  
  const deleteUser = () => {
    const password = prompt("Please enter your password to delete your account");
    const credential = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser?.email!, password!)
    if (user) {
      reauthenticateWithCredential(user, credential).then(() => {
        // User re-authenticated.
        if (user) {
          user.delete().then(() => {
            // User deleted - root layout will handle navigation
            router.replace('/');
          }).catch((error) => {
            // An error happened.
            console.log(error);
          });
        }
      }).catch((error) => {
        // An error happened.
        console.log(error);
      });
      
    } else {
      console.log("No user found");
    }
    
  }
  
  if (firebase.auth().currentUser === null) {
    return (
        <SafeAreaView style={styles.container}>
        <Text style={styles.title}>
          You are logged out your data will be saved locally and synced the moment you log in
        </Text>
        
        {/* <Button onPress={() => router.push('/auth')}>
          <Text>Sign In</Text>
        </Button> */}
      </SafeAreaView>
      
      
  );
  }
  else {
    return (
      
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>User</Text>
        <Text>{firebase.auth().currentUser?.email}</Text>
        <Button title="Sign Out" onPress={signOutUser}/>
        <Button title="Reset Password" onPress={resetPasswordViaEmail}/>
        <Button title="Delete Account" onPress={deleteUser}/>
        
      </SafeAreaView>
      
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    
  },
});