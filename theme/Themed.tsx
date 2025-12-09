/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import React from 'react';
import {
    Pressable as DefaultPressable,
    SafeAreaView as DefaultSafeAreaView,
    Text as DefaultText,
    TextInput as DefaultTextInput,
    TouchableOpacity as DefaultTouchableOpacity,
    View as DefaultView,
    PressableStateCallbackType,
    StyleProp,
    ViewStyle,
} from 'react-native';

import Colors from '@/theme/Colors';
import { darkTheme, lightTheme } from '@/theme/Theme';
import { observer } from '@legendapp/state/react';
import { Appearance$ } from './Appearance';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type ButtonProps = ThemeProps & React.ComponentProps<typeof DefaultTouchableOpacity>;
export type TextInputProps = ThemeProps & DefaultTextInput['props'];
export type TouchableOpacityProps = ThemeProps & React.ComponentProps<typeof DefaultTouchableOpacity>;
export type PressableProps = ThemeProps & React.ComponentProps<typeof DefaultPressable>;;
export type SafeAreaViewProps = ThemeProps & DefaultSafeAreaView['props'];

// export function useThemeColor(
//   props: { light?: string; dark?: string },
//   colorName: keyof typeof Colors.light & keyof typeof Colors.dark
// ) {
//   const theme = Appearance$.current.get() === 'light' ? 'light' : 'dark';
//   const colorFromProps = props[theme];

//   if (colorFromProps) {
//     return colorFromProps;
//   } else {
//     return Colors[theme][colorName];
//   }
// }

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light & keyof typeof Colors.dark
  ) {
    const theme = Appearance$.current.get() === 'light' ? lightTheme : darkTheme;
    const colorFromProps = props[theme === lightTheme ? 'light' : 'dark'];
  
    if (colorFromProps) {
      return colorFromProps;
    } else {
      return theme.colors[colorName];
    }
  }

export const Text = observer((props: TextProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
});

export const View = observer((props: ViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultView style={[{ borderColor }, style]} {...otherProps} />;
});

export const ThemedView = observer((props: ViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultView style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
});

export const ThemedViewOpacity = observer((props: ViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: 'rgba(255, 255, 255, 0.7))', dark: 'rgba(0, 0, 0, 0.7)' }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultView style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
});

export const Button = observer((props: ButtonProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultTouchableOpacity style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
});

export const TextInput = observer((props: TextInputProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  // const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  // const borderColor = useThemeColor({ light: darkColor, dark: lightColor }, 'border');

  return <DefaultTextInput style={[{ color }, style]} {...otherProps} />;
});

export const TouchableOpacity = observer((props: TouchableOpacityProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultTouchableOpacity style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
});

export const Pressable = observer((props: PressableProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  const combinedStyle: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>) = (state) => {
    const baseStyle = typeof style === 'function' ? style(state) : style;
    return [{ borderColor }, baseStyle];
  };

  return <DefaultPressable style={combinedStyle} {...otherProps} />;
});