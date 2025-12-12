import MyAccount from '@/components/pages/MyAccount';
import SelectedProfile from '@/components/pages/SelectedProfile';
import { firebase } from '@/firebase.config';
import { getUserProfile, selectedUserProfile$ } from '@/utilities/UserProfile';
import { observer } from '@legendapp/state/react';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';

const ProfileScreen = observer(() => {
  const params = useLocalSearchParams();
  const handleParam = typeof params.profile === 'string' ? params.profile : undefined;
  
  // Get current user's profile
  const userProf = getUserProfile();
  const myHandle = userProf?.handle.get();
  const viewerUid = firebase.auth().currentUser?.uid || null;
  const selectedUid = selectedUserProfile$.userId.get();
  
  // If viewing own profile, show MyAccount
  const isOwnByHandle = !!(handleParam && myHandle && handleParam.toLowerCase() === myHandle.toLowerCase());
  const isOwnByUid = !!(viewerUid && selectedUid && viewerUid === selectedUid);
  // When tab is pressed without params, default to own profile if signed in
  const isOwnByDefault = !handleParam && !!viewerUid;
  const isOwnProfile = isOwnByHandle || isOwnByUid || isOwnByDefault;

  // Redirect to clean handle URL when we know the user's handle but no param was provided
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (!handleParam && myHandle && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
    }
  }, [handleParam, myHandle]);
  
  if (isOwnProfile) {
    return <MyAccount />;
  }
  
  return <SelectedProfile />;
});

export default ProfileScreen;