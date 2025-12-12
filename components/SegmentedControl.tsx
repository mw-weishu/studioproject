import React, { useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';

interface Tab {
  icon: string;
  tab: string;
}

interface SegmentedControlProps {
  tabs: Tab[];
  onChange: (index: number) => void;
  currentIndex: number;
  segmentedControlBackgroundColor?: string;
  activeSegmentBackgroundColor?: string;
  textColor?: string;
  activeTextColor?: string;
  paddingVertical?: number;
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

// So that it stretches in landscape mode.
const width = Dimensions.get('screen').width - 32;

const SegmentedControl = (props: SegmentedControlProps) => {
  const translateValue = ((width - 4) / props.tabs.length);
  const [tabTranslate, setTabTranslate] = React.useState(new Animated.Value(0));

  // useCallBack with an empty array as input, which will call inner lambda only once and memoize the reference for future calls
  const memoizedTabPressCallback = React.useCallback(
    (index: number) => {
      props?.onChange(index);
    },
    []
  );

  useEffect(() => {
    // Animating the active index based current index
    Animated.spring(tabTranslate, {
      toValue: props?.currentIndex * translateValue,
      stiffness: 180,
      damping: 20,
      mass: 1,
      useNativeDriver: true
    }).start()
  }, [props?.currentIndex])

  return (
    <Animated.View style={[
      styles.segmentedControlWrapper,
      {
        backgroundColor: props?.segmentedControlBackgroundColor
      },
    //   {
    //     paddingVertical: props?.paddingVertical,
    //   }
    ]}>
      <Animated.View
        style={[{
          ...StyleSheet.absoluteFillObject,
          position: "absolute",
          width: (width - 4) / props?.tabs?.length,
          height: '100%',
          top: 0,
          backgroundColor: props?.activeSegmentBackgroundColor,
          borderRadius: 8,
          ...shadow,
        },
        {
          transform: [
            {
              translateX: tabTranslate
            }
          ]
        }]}
      >
      </Animated.View>
      {
        props?.tabs.map(({icon, tab}: {icon: string, tab: string}, index: any) => {
          const isCurrentIndex = props?.currentIndex === index;
          return (
            <TouchableRipple
              key={index}
              style={[styles.textWrapper]}
              onPress={() => memoizedTabPressCallback(index)}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <Icon source={icon} size={24} color={isCurrentIndex ? props?.activeTextColor : props?.textColor} />
              <Text numberOfLines={1} style={[styles.textStyles, { color: props?.textColor }, isCurrentIndex && { color: props?.activeTextColor }]}>{tab}</Text>
            </View>
            </TouchableRipple>
          )
        })
      }
    </Animated.View >
  )
}


const styles = StyleSheet.create({
  segmentedControlWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    width: width,
    margin: 4,
  },
  textWrapper: {
    flex: 1,
    elevation: 0,
    paddingHorizontal: 5,
    paddingVertical: 12,
  },
  textStyles: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  }
})

export default SegmentedControl;