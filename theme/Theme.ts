import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import Colors from './Colors';

export const darkTheme = {
    ...MD3DarkTheme, // or MD3LightTheme
    roundness: 2,
    colors: {
      ...MD3DarkTheme.colors,
      ...Colors.dark,
      primary: "rgb(255, 255, 255)",
      onPrimary: "rgb(252, 186, 3)",
      surfaceVariant: "rgb(0, 0, 0)",
    },
};

export const lightTheme = {
    ...MD3LightTheme,
    roundness: 2,
    colors: {
      ...MD3LightTheme.colors,
      ...Colors.light,
      primary: "rgb(0, 0, 0)",
      onPrimary: "rgb(252, 186, 3)",
      surfaceVariant: "rgb(255, 255, 255)",
    },
};