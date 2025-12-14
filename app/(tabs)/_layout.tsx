import { getUserProfile } from '@/utilities/UserProfile';
import FontAwesome from '@expo/vector-icons/Octicons';
import { observer } from '@legendapp/state/react';
import { Stack, Tabs, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet } from 'react-native';

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
        tabBarPosition: Platform.OS === 'web' ? 'left' : 'bottom',
        tabBarStyle: Platform.OS === 'web' ? {width: 72, minWidth: 72} : {height: 60, paddingTop: 6},
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
        name="saved"
        options={{
          title: '',
          // title: 'Saved',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="bookmark" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: '',
          // title: 'Routime AI',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="sparkle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '',
          // title: 'Search',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="[profile]"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('[profile]', { profile: myHandle });
          },
        })}
        options={{
          title: '',
          tabBarIcon: ({ focused }) => {
            const avatar = userProf?.avatar.get();
            return avatar ? (
              <Image
                source={{ uri: avatar }}
                style={[styles.avatar]}
                  
              />
            ) : (
              <Image
                source={require('../../assets/images/icon.png')}
                style={[styles.avatar]}
              />
            )
            
          },
        }}
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
