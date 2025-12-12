import { View, Text } from '../../theme/Themed'
import React from 'react'
import { SegmentedButtons } from 'react-native-paper'

import { Appearance$ } from '../../theme/Appearance'
import { observer } from '@legendapp/state/react'
import { Platform } from 'react-native'

const ThemeSelector = observer(() => {
    // const renderCount = React.useRef(1).current++
    const setAppearance = (value: string) => {
        Appearance$.current.set(value);
    };
    
  return (
    <View>
      {/* <Text>Renders: {renderCount}</Text> */}
      <SegmentedButtons
      value={Appearance$.current.get()} 
      onValueChange={setAppearance}
      buttons={ Platform.OS === 'web' ? 
        [
            {
            value: 'dark',
            label: 'Dark',
            icon: 'moon-waning-crescent',
            },
            {
            value: 'light',
            label: 'Light',
            icon: 'white-balance-sunny',
            },
        ] 
        :
        [
            {
            value: 'dark',
            label: 'Dark',
            icon: 'moon-waning-crescent',
            },
            {
            value: 'light',
            label: 'Light',
            icon: 'white-balance-sunny',
            },
            // {
            // value: 'not-set',
            // label: 'Device',
            // icon: 'cellphone',
            // },
        ]}
      />
    </View>
  )
});

export default ThemeSelector