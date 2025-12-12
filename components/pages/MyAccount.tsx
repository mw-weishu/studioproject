import { Text, View } from '@/theme/Themed';
import React from 'react';
import { Button, Icon, IconButton } from 'react-native-paper';

import { firebase } from '@/firebase.config';
import { formatDateKey, lastUserHandle$, lastUserId$, private$, public$ } from '@/utilities/EventsStore';
import { uploadAvatarImage } from '@/utilities/ImageUpload';
import { observer } from '@legendapp/state/react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { reauthenticateWithCredential } from 'firebase/auth';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
// import { cancelAllNotifications } from '@/utilities/Notifications';

import DayEventItem from '@/components/items/DayEventItem';
import { acceptFollowRequest, getPendingFollowRequests, getUserProfile, loadProfileByHandle, rejectFollowRequest, removeFollower, setSelectedUserProfile, syncSentFollowRequests, toggleProfilePrivacy, unfollowUser } from '@/utilities/UserProfile';
import { format } from 'date-fns';
import { router } from 'expo-router';

export const clearAllData = async () => {
  const userId = firebase.auth().currentUser?.uid as string;
  if (userId) {
    (private$ as any)[userId].set({});
    (public$ as any)[userId].set({});
  }
}


const MyAccount = observer(() => {
  // const renderCount = React.useRef(1).current++

  console.log('Rendering MyAccount');
  const userProf = getUserProfile();
  console.log('User Profile:', userProf?.get());

  const [image, setImage] = React.useState<string | null>(null);
  const [dayOffset, setDayOffset] = React.useState<number>(0);
  const [finalEvents, setFinalEvents] = React.useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
  const [showFollowers, setShowFollowers] = React.useState(false);
  const [showFollowing, setShowFollowing] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState(false);
  const [localExists, setLocalExists] = React.useState(false);
  const [remoteExists, setRemoteExists] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [followerAvatars, setFollowerAvatars] = React.useState<Record<string, string>>({});
  const [followingAvatars, setFollowingAvatars] = React.useState<Record<string, string>>({});

  // Check avatar image existence
  React.useEffect(() => {
    let cancelled = false;
    const checkImages = async () => {
      try {
        const localUri = image;
        const userProf = getUserProfile();
        const remoteUrl = userProf?.avatar.get();
        if (localUri && localUri.startsWith('file://')) {
          try {
            const info = await FileSystem.getInfoAsync(localUri);
            if (!cancelled) setLocalExists(!!info.exists);
          } catch {
            if (!cancelled) setLocalExists(false);
          }
        }
        if (remoteUrl && !localExists) {
          try {
            await Image.prefetch(remoteUrl);
            if (!cancelled) setRemoteExists(true);
          } catch {
            if (!cancelled) setRemoteExists(false);
          }
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkImages();
    return () => { cancelled = true; };
  }, [image, getUserProfile()?.avatar.get()]);

  // Load events for day offset
  React.useEffect(() => {
    const loadEvents = async () => {
      const userId = firebase.auth().currentUser?.uid;
      if (!userId) {
        setFinalEvents([]);
        return;
      }
      try {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const key = formatDateKey(date);
        
        const snap = await firebase
          .database()
          .ref(`/sharedContent/${userId}/events/${key}`)
          .once('value');
        
        if (!snap.exists()) {
          setFinalEvents([]);
          return;
        }
        
        const val = snap.val();
        const list = Array.isArray(val) ? val.filter(Boolean) : Object.values(val || {});
        
        const normalized = (list || []).map((ev: any) => ({
          ...ev,
          startDate: ev.startDate ? new Date(ev.startDate) : null,
          endDate: ev.endDate ? new Date(ev.endDate) : null,
        }));

        const filteredEvents = normalized
          .filter((e: any) => e.startDate && e.endDate)
          .sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());

        const compareBase = new Date();
        compareBase.setDate(new Date().getDate() + dayOffset);
        compareBase.setHours(0, 0, 0, 0);
        const endOfDay = new Date(compareBase);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const formatDuration = (ms: number): string => {
          const totalMinutes = Math.floor(ms / 60000);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          if (hours === 0) return `${minutes}min`;
          if (minutes === 0) return `${hours}h`;
          return `${hours}h ${minutes}min`;
        };

        const emptyBlocks: any[] = [];
        let compareTime = new Date(compareBase);
        for (let i = 0; i < filteredEvents.length; i++) {
          const ev = filteredEvents[i];
          if (ev.startDate > compareTime && ev.startDate.getTime() - compareTime.getTime() >= 60000) {
            const duration = formatDuration(ev.startDate.getTime() - compareTime.getTime());
            emptyBlocks.push({
              title: duration,
              startDate: new Date(compareTime),
              endDate: new Date(ev.startDate),
              blank: true,
              id: `${formatDateKey(compareBase)}-${i}-blank`,
            });
          }
          compareTime = ev.endDate;
        }
        if (compareTime < endOfDay) {
          const duration = formatDuration(endOfDay.getTime() - compareTime.getTime());
          emptyBlocks.push({
            title: duration,
            startDate: new Date(compareTime),
            endDate: new Date(endOfDay),
            blank: true,
            id: `${formatDateKey(compareBase)}-${emptyBlocks.length + 1}-blank`,
          });
        }

        const merged = [...filteredEvents, ...emptyBlocks].sort(
          (a: any, b: any) => (a.startDate?.getTime?.() || 0) - (b.startDate?.getTime?.() || 0)
        );
        setFinalEvents(merged);
      } catch (e) {
        setFinalEvents([]);
      }
    };
    loadEvents();
  }, [dayOffset]);

  // Load pending follow requests if private profile
  React.useEffect(() => {
    const loadRequests = async () => {
      const userProf = getUserProfile();
      const handle = userProf?.handle.get();
      const isPublic = userProf?.isPublic.get();
      const currentUser = firebase.auth().currentUser;
      
      if (!handle || isPublic || !currentUser) {
        setPendingRequests([]);
        return;
      }
      
      // Verify the current user owns this handle
      try {
        const handleOwnerSnap = await firebase.database()
          .ref(`/handles/${handle.toLowerCase()}`)
          .once('value');
        
        if (!handleOwnerSnap.exists() || handleOwnerSnap.val() !== currentUser.uid) {
          console.warn('User does not own this handle');
          setPendingRequests([]);
          return;
        }
        
        const requests = await getPendingFollowRequests(handle);
        setPendingRequests(requests);
      } catch (e: any) {
        console.error('Error loading follow requests:', e);
        setPendingRequests([]);
      }
    };
    loadRequests();
    // Refresh every 30 seconds if private
    const userProf = getUserProfile();
    const interval = !userProf?.isPublic.get() && userProf?.handle.get()
      ? setInterval(loadRequests, 30000)
      : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [getUserProfile()?.isPublic.get(), getUserProfile()?.handle.get()]);

  // On account load, sync any pending sent follow requests (catch up after being offline/logged out)
  React.useEffect(() => {
    (async () => {
      await syncSentFollowRequests();
    })();
  }, []);

  const getTitle = (index: number) => {
    if (index === 0) return 'Today';
    else if (index === 1) return 'Tomorrow';
    else if (index === -1) return 'Yesterday';
    else if (index > 1 && index < 11) return `in ${index} days`;
    else if (index < -1 && index > -11) return `${-index} days ago`;
    return '';
  };

  const handleAcceptRequest = async (requesterHandle: string) => {
    const userProf = getUserProfile();
    const handle = userProf?.handle.get();
    if (!handle) return;
    setActionLoading(requesterHandle);
    try {
      await acceptFollowRequest(handle, requesterHandle);
      // Refresh requests and profile
      const requests = await getPendingFollowRequests(handle);
      setPendingRequests(requests);
      const profile = await loadProfileByHandle(handle);
      if (profile && userProf) {
        userProf.followers.set(profile.followers || {});
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requesterHandle: string) => {
    const userProf = getUserProfile();
    const handle = userProf?.handle.get();
    if (!handle) return;
    setActionLoading(requesterHandle);
    try {
      await rejectFollowRequest(handle, requesterHandle);
      const requests = await getPendingFollowRequests(handle);
      setPendingRequests(requests);
    } catch (e: any) {
      alert(e?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    const userProf = getUserProfile();
    const handle = userProf?.handle.get();
    if (!handle) return;
    setActionLoading(followerId);
    try {
      await removeFollower(handle, followerId);
      const profile = await loadProfileByHandle(handle);
      if (profile && userProf) {
        userProf.followers.set(profile.followers || {});
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to remove follower');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePrivacy = async () => {
    const userProf = getUserProfile();
    const handle = userProf?.handle.get();
    if (!handle || !userProf) return;
    setActionLoading('privacy');
    try {
      const newIsPublic = !userProf.isPublic.get();
      await toggleProfilePrivacy(handle, newIsPublic);
      userProf.isPublic.set(newIsPublic);
    } catch (e: any) {
      alert(e?.message || 'Failed to update privacy');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    const userProf = getUserProfile();
    const handle = userProf?.handle.get();
    if (!handle) return;
    setActionLoading(targetUserId);
    try {
      await unfollowUser(handle, targetUserId);
      const profile = await loadProfileByHandle(handle);
      if (profile && userProf) {
        userProf.following.set(profile.following || {});
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to unfollow');
    } finally {
      setActionLoading(null);
    }
  };

  const viewProfile = async (handle: string) => {
    try {
      console.log('Viewing profile for handle:', handle);
      const profile = await loadProfileByHandle(handle);
      console.log('Loaded profile:', profile);
      if (profile) {
        setSelectedUserProfile(profile);
        router.push(`/${handle}`);
      }
    } catch (e) {
      console.error('Error viewing profile:', e);
        }
    };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageError(false);
      setChecking(true);

      try {
        const userId = firebase.auth().currentUser?.uid;
        const userProf = getUserProfile();
        const handle = userProf?.handle.get();
        const oldAvatarUrl = userProf?.avatar.get();
        if (!userId || !handle) {
          console.log('Missing userId or handle');
          return;
        }
        const imageUrl = await uploadAvatarImage(result.assets[0].uri, handle, userId, oldAvatarUrl);
        
        // Update avatar in the observable - persistence will sync to Firebase automatically
        if (userProf) {
          userProf.avatar.set(imageUrl);
        }
        
        setChecking(false);
      } catch (error) {
        console.log('Error uploading avatar:', error);
        setChecking(false);
      }
    }
  };
  
  const user = firebase.auth().currentUser
  const userEmail = user?.email;
  const emailShort = userEmail ? userEmail?.split('@')[0].charAt(0).toUpperCase() + userEmail?.split('@')[0].slice(1): null;

  const signOutUser = () => {
    firebase.auth().signOut()
    .then(() => {
      // Sign-out successful.
      lastUserId$.set('');
      lastUserHandle$.set('');
      router.replace('/');
    //   cancelAllNotifications();
    })
    .catch((error) => {
      // An error happened.
      console.log(error);
    });
  };
  
  const deleteUser = () => {
    const password = prompt("Please enter your password to delete your account");
    const credential = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser?.email!, password!)
    if (user) {
      reauthenticateWithCredential(user, credential)
      .then(() => {
        // User re-authenticated.
        if (user) {
          user.delete()
          .then(() => {
            // User deleted.
            // cancelAllNotifications();
          })
          .catch((error) => {
            // An error happened.
            console.log(error);
          });
        }
      })
      .catch((error) => {
        // An error happened.
        console.log(error);
      });
      
    } else {
      console.log("No user found");
    }
    
  }

  // Normalize followers/following which may be stored as object maps or arrays
  const followersRaw = userProf?.followers?.get();
  const followingRaw = userProf?.following?.get();
  
  // Extract followers with their handles and avatars
  const followersList = Array.isArray(followersRaw)
    ? followersRaw.map((id: string) => ({ userId: id, handle: id, avatar: '' }))
    : followersRaw && typeof followersRaw === 'object'
      ? Object.keys(followersRaw).map(userId => ({
          userId,
          handle: followersRaw[userId]?.handle || userId,
          avatar: ''
        }))
      : [];
  
  // Extract following with their handles and avatars
  const followingList = Array.isArray(followingRaw)
    ? followingRaw.map((id: string) => ({ userId: id, handle: id, avatar: '' }))
    : followingRaw && typeof followingRaw === 'object'
      ? Object.keys(followingRaw).map(userId => ({
          userId,
          handle: followingRaw[userId]?.handle || userId,
          avatar: ''
        }))
      : [];
  
  const followersCount = followersList.length;
  const followingCount = followingList.length;

  // Load avatars for followers/following from profiles
  React.useEffect(() => {
    const loadFollowerAvatars = async () => {
      try {
        const entries = followersList;
        const results: Record<string, string> = {};
        await Promise.all(entries.map(async (f) => {
          try {
            const snap = await firebase.database().ref(`/profiles/${f.userId}/avatar`).once('value');
            if (snap.exists()) {
              results[f.userId] = snap.val() || '';
            } else {
              results[f.userId] = '';
            }
          } catch {
            results[f.userId] = '';
          }
        }));
        setFollowerAvatars(results);
      } catch {
        setFollowerAvatars({});
      }
    };
    if (followersList.length > 0) loadFollowerAvatars(); else setFollowerAvatars({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(followersList.map(f => f.userId))]);

  React.useEffect(() => {
    const loadFollowingAvatars = async () => {
      try {
        const entries = followingList;
        const results: Record<string, string> = {};
        await Promise.all(entries.map(async (f) => {
          try {
            const snap = await firebase.database().ref(`/profiles/${f.userId}/avatar`).once('value');
            if (snap.exists()) {
              results[f.userId] = snap.val() || '';
            } else {
              results[f.userId] = '';
            }
          } catch {
            results[f.userId] = '';
          }
        }));
        setFollowingAvatars(results);
      } catch {
        setFollowingAvatars({});
      }
    };
    if (followingList.length > 0) loadFollowingAvatars(); else setFollowingAvatars({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(followingList.map(f => f.userId))]);

  return (
    <View style={{ height: '100%', margin: 8}} >
      {/* Profile Card */}
      {userProf?.handle.get() && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginBottom: 8 }}>
          <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
          {(() => {
            const displayUri = localExists ? image : remoteExists ? userProf?.avatar.get() : null;
            const expectImage = !!(image || userProf?.avatar.get());
            
            if (expectImage) {
              if (displayUri && !checking && !imageError) {
                return <Image source={{ uri: displayUri }} style={styles.image} onError={() => setImageError(true)} />;
              } else {
                return <View style={styles.imagePlaceholder} />;
              }
            } else {
              return <Image source={require('@/assets/images/icon.png')} style={styles.image}/>;
            }
          })()}
          <View style={styles.editIconContainer}>
            <Icon source="pencil" size={14} color="white" />
          </View>
          </TouchableOpacity>
          <Text style={styles.handle}>{userProf?.handle.get()}</Text>
          </View>
          {userProf?.displayName.get() && userProf.displayName.get() !== userProf.handle.get() && (
            <Text style={styles.displayName}>{userProf.displayName.get()}</Text>
          )}
          {userProf?.bio.get() ? (
            <Text style={styles.bio}>{userProf.bio.get()}</Text>
          ) : (
            null
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button mode="text" compact onPress={() => setShowFollowers(!showFollowers)}>
            {followersCount} Followers
          </Button>
          <Button mode="text" compact onPress={() => setShowFollowing(!showFollowing)}>
            {followingCount} Following
          </Button>
          <Button 
            mode="text" 
            compact 
            onPress={handleTogglePrivacy}
            loading={actionLoading === 'privacy'}
            disabled={actionLoading === 'privacy'}
          >
            {userProf?.isPublic.get() ? 'Public' : 'Private'}
          </Button>
          </View>
          
          {/* Follow Requests Section (Private profiles only) */}
          {!userProf?.isPublic.get() && pendingRequests.length > 0 && (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 8 }}>
              <Text style={[styles.header, { marginTop: 0 }]}>Follow Requests ({pendingRequests.length})</Text>
              {pendingRequests.map((req: any) => (
                <TouchableOpacity 
                  key={req.requesterHandle} 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}
                  onPress={() => viewProfile(req.requesterHandle)}
                >
                  {req.avatar ? (
                    <Image source={{ uri: req.avatar }} style={styles.smallAvatar} />
                  ) : (
                    <Image source={require('@/assets/images/icon.png')} style={styles.smallAvatar} />
                  )}
                  <Text style={{ flex: 1, marginLeft: 8 }}>{req.requesterHandle}</Text>
                  <Button 
                    mode="contained" 
                    compact 
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleAcceptRequest(req.requesterHandle);
                    }}
                    loading={actionLoading === req.requesterHandle}
                    disabled={actionLoading !== null}
                    style={{ marginRight: 4 }}
                  >
                    Accept
                  </Button>
                  <Button 
                    mode="outlined" 
                    compact 
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleRejectRequest(req.requesterHandle);
                    }}
                    loading={actionLoading === req.requesterHandle}
                    disabled={actionLoading !== null}
                  >
                    Reject
                  </Button>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Followers List */}
          {showFollowers && followersList.length > 0 && (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <Text style={[styles.header, { marginTop: 0 }]}>Your Followers</Text>
              {followersList.map((follower: any) => (
                <TouchableOpacity 
                  key={follower.userId} 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}
                  onPress={() => viewProfile(follower.handle)}
                >
                  {followerAvatars[follower.userId] ? (
                    <Image source={{ uri: followerAvatars[follower.userId] }} style={styles.smallAvatar} />
                  ) : (
                    <Image source={require('@/assets/images/icon.png')} style={styles.smallAvatar} />
                  )}
                  <Text style={{ flex: 1, marginLeft: 8 }}>{follower.handle}</Text>
                  <Button 
                    mode="text" 
                    compact 
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleRemoveFollower(follower.userId);
                    }}
                    loading={actionLoading === follower.userId}
                    disabled={actionLoading !== null}
                  >
                    Remove
                  </Button>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Following List */}
          {showFollowing && followingList.length > 0 && (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <Text style={[styles.header, { marginTop: 0 }]}>Following</Text>
              {followingList.map((following: any) => (
                <TouchableOpacity 
                  key={following.userId} 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}
                  onPress={() => viewProfile(following.handle)}
                >
                  {followingAvatars[following.userId] ? (
                    <Image source={{ uri: followingAvatars[following.userId] }} style={styles.smallAvatar} />
                  ) : (
                    <Image source={require('@/assets/images/icon.png')} style={styles.smallAvatar} />
                  )}
                  <Text style={{ flex: 1, marginLeft: 8 }}>{following.handle}</Text>
                  <Button 
                    mode="text" 
                    compact 
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleUnfollow(following.userId);
                    }}
                    loading={actionLoading === following.userId}
                    disabled={actionLoading !== null}
                  >
                    Unfollow
                  </Button>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Events Section */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <IconButton onPress={() => setDayOffset((v) => v - 1)} icon="chevron-left" />
              {getTitle(dayOffset) !== '' ? (
              <Text style={styles.header}>{getTitle(dayOffset)}</Text>
              ) 
              : 
              <Text style={[styles.meta, {marginTop: 10, textAlign: 'center', marginBottom: 8 }]}>
              {format(new Date(new Date().setDate(new Date().getDate() + dayOffset)), 'EEE, MMM d')}
              </Text>
              }
              <IconButton onPress={() => setDayOffset((v) => v + 1)} icon="chevron-right" />
            </View>
            {getTitle(dayOffset) !== '' ? (
            <Text style={[styles.meta, { textAlign: 'center', marginBottom: 8 }]}>
              {format(new Date(new Date().setDate(new Date().getDate() + dayOffset)), 'EEE, MMM d')}
            </Text>
            ) : null
            }
            {finalEvents.length === 0 ? (
              <Text style={styles.bioEmpty}>No posts for this day.</Text>
            ) : (
              finalEvents.map((ev: any) => (
                <DayEventItem key={ev.id} event={ev} />
              ))
            )}
          </View>
        </View>
      )}

      {/* Here display profile info */}
      <View style={styles.buttonsContainer}>
      <Button 
        icon="logout" 
        mode='outlined' 
        onPress={() => {
          signOutUser();
        //   cancelAllNotifications();
        }} 
        style={styles.button}>
        Sign Out
      </Button>
      {/* <Button icon="cog" mode='outlined' onPress={() => void 0} style={styles.button}>
        Settings
      </Button>
      <Button icon="key" mode='outlined' onPress={navigateToReset} style={styles.button}>
        Reset Password
      </Button>
      <Button icon="delete" mode='outlined' onPress={deleteUser} style={styles.button}>
        Delete Account
      </Button>
      <Button icon="bell-off" mode='outlined' onPress={() => scheduleMultipleNotifications(true)} style={styles.button}>
        Normal Notifications
      </Button> */}
      {/* <Button icon="bell" mode='outlined' onPress={() => scheduleMultipleRepeatingNotifications()} style={styles.button}>
        Repeating Notifications
      </Button>
      <Button icon="bell-cancel" mode='outlined' onPress={cancelAllNotifications} style={styles.button}>
        Cancel All Notifications
      </Button>
      <Button icon="bell-outline" mode='outlined' onPress={getAllNotifications} style={styles.button}>
        Get All Notifications
      </Button> */}
      <Button 
        icon="delete" 
        mode='outlined' 
        onPress={() => {
          clearAllData();
        //   cancelAllNotifications();
        }} 
        style={styles.button}>
        Clear All Data
      </Button>
      {/* <Button
        icon="bell"
        mode='outlined'
        onPress={() => ToastAndroid.show('Check your notifications!', ToastAndroid.SHORT)}
        style={styles.button}>
        Test Notification
      </Button> */}
      {/* <Button icon='bell-cancel' mode='outlined' onPress={() => cancelAllNotifications()} style={styles.button}>
        Clear All Notifications
      </Button> */}
      {/* <Button icon="bell" mode='outlined' onPress={() => sendNotification()} style={styles.button}>
        Send Notification
      </Button> */}
      </View>
      {/* this is just for testing */}
      <View style={styles.buttonsContainer}>
      {/* <Button icon='bell' mode='outlined' onPress={() => getAllNotifications()} style={{width: 300}}>
        Get All Notifications
      </Button> */}

      </View>
      {/* <GoogleMaps.View style={{ height: 300, width: '100%' }} />; */}
    </View>
  )
});

export default MyAccount

const styles = StyleSheet.create({
  item: {
    height: 200,
    width: 200,
    backgroundColor: 'red'
  },
  hello: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  button: {
    marginBottom: 10,
    // marginHorizontal: 10,
    width: '48%',
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    // flexWrap: 'wrap',
    // justifyContent: 'center',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 20,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  card: { 
    padding: 16, 
    borderRadius: 8, 
    borderWidth: StyleSheet.hairlineWidth, 
    borderColor: 'gray',
    marginBottom: 16,
  },
  handle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  displayName: { 
    fontSize: 18, 
    marginBottom: 8 
  },
  bio: { 
    marginBottom: 12 
  },
  bioEmpty: { 
    fontStyle: 'italic', 
    color: 'gray', 
    marginBottom: 12 
  },
  meta: { 
    fontSize: 14, 
    color: 'gray' 
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
});
