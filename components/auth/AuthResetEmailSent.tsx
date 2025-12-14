import { Text, View } from '@/theme/Themed';
import React from 'react';

const AuthResetEmailSent = () => {
  // const renderCount = React.useRef(1).current++

  return (
    <View style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* <Text>Renders: {renderCount}</Text> */}
      <Text>Password Reset Email Sent</Text>
    </View>
  );
}

export default AuthResetEmailSent