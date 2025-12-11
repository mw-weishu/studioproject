/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import React from 'react';
import {
  ColorValue,
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

import { darkTheme } from '@/theme/Theme';

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

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof darkTheme.colors
  ): ColorValue {
    const colorFromProps = props['dark'];
  
    if (colorFromProps) {
      return colorFromProps as ColorValue;
    } else {
      const color = darkTheme.colors[colorName];
      return (typeof color === 'string' ? color : '#000000') as ColorValue;
    }
  }

export const Text = (props: TextProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
};

export const View = (props: ViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultView style={[{ borderColor }, style]} {...otherProps} />;
};

export const ThemedView = (props: ViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultView style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
};

export const ThemedViewOpacity = (props: ViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: 'rgba(255, 255, 255, 0.7))', dark: 'rgba(0, 0, 0, 0.7)' }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultView style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
};

export const Button = (props: ButtonProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultTouchableOpacity style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
};

export const TextInput = (props: TextInputProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  // const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  // const borderColor = useThemeColor({ light: darkColor, dark: lightColor }, 'border');

  return <DefaultTextInput style={[{ color }, style]} {...otherProps} />;
};

export const TouchableOpacity = (props: TouchableOpacityProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  return <DefaultTouchableOpacity style={[{ backgroundColor, borderColor }, style]} {...otherProps} />;
};

export const Pressable = (props: PressableProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

  const combinedStyle: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>) = (state) => {
    const baseStyle = typeof style === 'function' ? style(state) : style;
    return [{ borderColor }, baseStyle];
  };

  return <DefaultPressable style={combinedStyle} {...otherProps} />;
};