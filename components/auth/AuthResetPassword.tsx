import { View } from '@/theme/Themed';
import React from 'react';
import { Button, TextInput } from 'react-native-paper';

import { firebase } from '@/firebase.config';

const AuthResetPassword = () => {
  // const renderCount = React.useRef(1).current++
  const [email, setEmail] = React.useState('');

  const resetPasswordViaEmail = () => {
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

  const handleEnterPress = (e: any) => {
    if (e.key === 'Enter') {
      resetPasswordViaEmail();
    }
  }

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
      <View style={{ marginTop: 12 }}>
        <Button onPress={resetPasswordViaEmail}>Reset Password</Button>
      </View>
    </View>
  );
}

export default AuthResetPassword