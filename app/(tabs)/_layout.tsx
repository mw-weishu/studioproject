import { checkAndSetAdmin, isAdmin$ } from '@/utilities/AdminUtils';
import { getUserProfile } from '@/utilities/UserProfile';
import FontAwesome from '@expo/vector-icons/Octicons';
import { observer } from '@legendapp/state/react';
import { Stack, Tabs, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

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

const TabLayout = observer(function TabLayout() {
  const params = useLocalSearchParams();
  const handleParam = typeof params.profile === 'string' ? params.profile : undefined;
  const colorScheme = useColorScheme();
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const userProf = getUserProfile();
  const myHandle = userProf?.handle.get();

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      setIsSignedIn(!!user);
      if (user) {
        await checkAndSetAdmin(user.uid);
      } else {
        isAdmin$.set(false);
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
        tabBarPosition: Platform.OS === 'web' ? 'left' : 'bottom',
        tabBarStyle: Platform.OS === 'web' ? {width: 72, minWidth: 72} : {height: 60, paddingTop: 6},
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="list-unordered" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lost"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="package" color={color} />,
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="inbox" color={color} />,
        }}
      />
      <Tabs.Screen
        name="[profile]"
        initialParams={{ profile: myHandle ?? '' }}
        options={{
          title: '',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="person" color={color} />,
          href: myHandle ? { pathname: '/[profile]', params: { profile: myHandle } } : null,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="search"
        options={{ href: null }}
      />
    </Tabs>
  );
});

export default TabLayout;

const styles = StyleSheet.create({
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
  },
});
