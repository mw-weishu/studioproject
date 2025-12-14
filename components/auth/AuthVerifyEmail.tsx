import { Text, View } from '@/theme/Themed';
import React from 'react';

const AuthVerifyEmail = () => {
  // const renderCount = React.useRef(1).current++
  return (
    <View style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* <Text>Renders: {renderCount}</Text> */}
      <Text>Check your inbox ... and verify</Text>
    </View>
  );
}

export default AuthVerifyEmail