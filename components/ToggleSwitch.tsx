import React, { useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  width?: number;
  height?: number;
  onBackgroundColor?: string;
  offBackgroundColor?: string;
  circleColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  onText?: string;
  offText?: string;
}

const shadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.23,
  shadowRadius: 2.62,
  elevation: 4,
}

const ToggleSwitch = (props: ToggleSwitchProps) => {
  const switchWidth = props?.width || 120;
  const switchHeight = props?.height || 40;
  const circleSize = switchHeight - 8; // Circle size with some padding
  const translateDistance = switchWidth - circleSize - 8; // Distance the circle travels
  
  const [circleTranslate] = React.useState(new Animated.Value(props?.isOn ? translateDistance : 0));

  const memoizedToggleCallback = React.useCallback(() => {
    props?.onToggle(!props?.isOn);
  }, [props?.isOn, props?.onToggle]);

  useEffect(() => {
    Animated.spring(circleTranslate, {
      toValue: props?.isOn ? translateDistance : 0,
      stiffness: 180,
      damping: 20,
      mass: 1,
      useNativeDriver: true
    }).start();
  }, [props?.isOn, translateDistance]);

  return (
    <TouchableRipple
      style={[
        styles.switchContainer,
        {
          width: switchWidth,
          height: switchHeight,
          backgroundColor: props?.isOn ? props?.onBackgroundColor : props?.offBackgroundColor,
        }
      ]}
      onPress={memoizedToggleCallback}
    >
      <View style={styles.switchContent}>
        {/* OFF Text - only visible when OFF */}
        {!props?.isOn && (
          <View style={[styles.textContainer, { left: 8 }]}>
            <Text style={[
              styles.textStyle,
              {
                color: props?.activeTextColor,
              }
            ]}>
              {props?.offText || 'OFF'}
            </Text>
          </View>
        )}

        {/* ON Text - only visible when ON */}
        {props?.isOn && (
          <View style={[styles.textContainer, { right: 8 }]}>
            <Text style={[
              styles.textStyle,
              {
                color: props?.activeTextColor,
              }
            ]}>
              {props?.onText || 'ON'}
            </Text>
          </View>
        )}

        {/* Moving Circle - higher z-index to appear above text */}
        <Animated.View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              backgroundColor: props?.circleColor,
              ...shadow,
            },
            {
              transform: [
                {
                  translateX: circleTranslate
                }
              ]
            }
          ]}
        />
      </View>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  switchContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 2,
  },
  textStyle: {
    fontSize: 14,
    fontWeight: '600',
  },
  circle: {
    position: 'absolute',
    borderRadius: 50,
    top: 4,
    left: 4,
    zIndex: 1,
  }
});

export default ToggleSwitch;