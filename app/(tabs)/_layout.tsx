import FontAwesome from '@expo/vector-icons/Octicons';
import { Stack, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { firebase } from '@/firebase.config';
import { useColorScheme } from '@/hooks/use-color-scheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
      if (!user) {
        // router.replace('/landing');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [isSignedIn]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!isSignedIn) {
    return (
      <Stack screenOptions={{headerShown: false}}/>
    );
  }
  return (
    <Tabs
      backBehavior='fullHistory'
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          // title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '',
          // title: 'Explore',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: '',
          // title: 'Account',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
