import { firebase } from '@/firebase.config';
import { Text, View } from '@/theme/Themed';
import { formatDateKey } from '@/utilities/EventsStore';
import { canAccessContent, followUser, getUserProfile, loadProfileByHandle, recordSentFollowRequest, selectedUserProfile$, setSelectedUserProfile, unfollowUser, watchFollowAcceptance } from '@/utilities/UserProfile';
import { observer } from '@legendapp/state/react';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import PublicEventItem from '../items/PublicEventItem';

// This component expects route params with { profile: handle }
const SelectedProfile = observer(() => {
  const params = useLocalSearchParams();
  const handle: string | undefined = typeof params.profile === 'string' ? params.profile : undefined;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [finalEvents, setFinalEvents] = React.useState<any[]>([]);
  const [dayOffset, setDayOffset] = React.useState<number>(0);
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [isFollowing, setIsFollowing] = React.useState<boolean>(false);
  const [followRequestPending, setFollowRequestPending] = React.useState<boolean>(false);
  const [followLoading, setFollowLoading] = React.useState<boolean>(false);
  const watchRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    const run = async () => {
        console.log('Loading profile for handle:', handle);
      if (!handle) return;

      // If already loaded for same handle, skip
    //   if (selectedUserProfile$.handle.get() === handle) return;
      setLoading(true);
      setError(null);
      try {
        const profile = await loadProfileByHandle(handle);
        console.log('Loaded profile:', profile);
        if (profile) {
          setSelectedUserProfile(profile);
          console.log('Profile userId:', profile.userId);
          console.log('Profile isPublic:', profile.isPublic);
          
          // Check access permission
          console.log('Checking access for handle:', handle);
          const viewerUid = firebase.auth().currentUser?.uid ?? null;
          console.log('Viewer UID:', viewerUid);
          const allowed = await canAccessContent(viewerUid, handle.toLowerCase());
          console.log('Access allowed:', allowed);
          setHasAccess(allowed);
          
          // Check follow status
          if (viewerUid && profile.userId !== viewerUid) {
            const following = profile.followers && Object.keys(profile.followers || {}).includes(viewerUid);
            setIsFollowing(following);
            
            // Check if follow request is pending (read from sent path where requester has access)
            if (!following && !profile.isPublic) {
              try {
                const sentSnap = await firebase.database()
                  .ref(`/followRequestsSent/${viewerUid}/${profile.userId}`)
                  .once('value');
                if (sentSnap.exists() && sentSnap.val().status === 'pending') {
                  setFollowRequestPending(true);
                }
              } catch (e: any) {
                console.log('Pending request check skipped:', e?.message || e);
              }
            }
          }
        } else {
          setError('Profile not found');
        }
      } catch (e: any) {
        setError(e?.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      if (watchRef.current) {
        watchRef.current();
        watchRef.current = null;
      }
    };
  }, [handle]);

  const getEventsForDateFromHandle = async (h: string, dateKey: string) => {
    try {
      const handleLower = (h || '').toLowerCase();
      if (!handleLower || !dateKey) return [] as any[];

      // Resolve userId from handle
      const uidSnap = await firebase.database().ref(`/handles/${handleLower}`).once('value');
      const uid: string | null = uidSnap.exists() ? String(uidSnap.val()) : null;
      if (!uid) return [] as any[];

      // Read the events object for this userId, then extract the specific dateKey
      const snap = await firebase.database().ref(`/sharedContent/${uid}/events/${dateKey}`)?.once('value');
      
      if (!snap.exists()) return [] as any[];
      
      const eventsForDate = snap.val();
      // The value should be an array of events for this date
      const list = Array.isArray(eventsForDate) 
        ? eventsForDate.filter(Boolean)
        : (eventsForDate ? Object.values(eventsForDate) : []);
      
      // Sort by startDate if present
      return list.sort((a: any, b: any) => {
        const as = a?.startDate ? new Date(a.startDate).getTime() : 0;
        const bs = b?.startDate ? new Date(b.startDate).getTime() : 0;
        return as - bs;
      });
    } catch (e: any) {
      console.error('Error loading events:', e);
      return [];
    }
  };

  // Helpers adapted from MyPager
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayIndexFromToday = (d: Date) => {
    const today = new Date();
    const utcD = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.trunc((utcD - utcToday) / msPerDay);
  };

  const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  const getTitle = (index: number) => {
    if (index === 0) return 'Today';
    else if (index === 1) return 'Tomorrow';
    else if (index === -1) return 'Yesterday';
    else if (index > 1 && index < 11) return `in ${index} days`;
    else if (index < -1 && index > -11) return `${-index} days ago`;
    return '';
  };

  // Load events for the current dayOffset
  useEffect(() => {
    const loadEvents = async () => {
      // Only fetch events when we explicitly have access
      if (!handle || hasAccess !== true) {
        setEvents([]);
        setFinalEvents([]);
        return;
      }

      try {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const key = formatDateKey(date);
        const list = await getEventsForDateFromHandle(handle, key);
        // Normalize to Date objects
        const normalized = (list || []).map((ev: any) => ({
          ...ev,
          startDate: ev.startDate ? new Date(ev.startDate) : null,
          endDate: ev.endDate ? new Date(ev.endDate) : null,
        }));
        setEvents(normalized);

        // Build empty blocks similar to MyPager
        const filteredEvents = normalized
          .filter((e: any) => e.startDate && e.endDate)
          .sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());

        const compareBase = new Date();
        compareBase.setDate(new Date().getDate() + dayOffset);
        compareBase.setHours(0, 0, 0, 0);
        const endOfDay = new Date(compareBase);
        endOfDay.setDate(endOfDay.getDate() + 1);

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
              description: '',
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
            description: '',
            blank: true,
            id: `${formatDateKey(compareBase)}-${emptyBlocks.length + 1}-blank`,
          });
        }

        const merged = [...filteredEvents, ...emptyBlocks].sort(
          (a: any, b: any) => (a.startDate?.getTime?.() || 0) - (b.startDate?.getTime?.() || 0)
        );
        setFinalEvents(merged);
      } catch (e: any) {
        // Don't set error for permission issues - just clear events
        setEvents([]);
        setFinalEvents([]);
      }
    };
    loadEvents();
  }, [handle, dayOffset, hasAccess]);

  const handleFollow = async () => {
    if (!handle) return;
    const viewerUid = firebase.auth().currentUser?.uid;
    if (!viewerUid) {
      alert('Please sign in to follow users');
      return;
    }
    
    setFollowLoading(true);
    try {
      const result = await followUser(handle.toLowerCase(), viewerUid);
      if (result.autoFollowed) {
        setIsFollowing(true);
        setHasAccess(true);
        // Refresh profile to update follower count
        const profile = await loadProfileByHandle(handle);
        if (profile) setSelectedUserProfile(profile);
      } else {
        setFollowRequestPending(true);
        // Record sent follow request for offline sync
        try {
          recordSentFollowRequest(viewerUid, selectedUserProfile$.userId.get());
        } catch (e) {
          console.log('Failed to record sent follow request:', e);
        }
        alert('Follow request sent!');
        // Start watcher if not already watching
        if (!watchRef.current) {
          watchRef.current = watchFollowAcceptance(handle, async () => {
            setIsFollowing(true);
            setHasAccess(true);
            setFollowRequestPending(false);
            const profile = await loadProfileByHandle(handle);
            if (profile) setSelectedUserProfile(profile);
          });
        }
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!handle) return;
    const viewerUid = firebase.auth().currentUser?.uid;
    if (!viewerUid) return;
    
    const myProf = getUserProfile();
    const myHandle = myProf?.handle.get();
    if (!myHandle) {
      alert('Profile not set up');
      return;
    }
    
    setFollowLoading(true);
    try {
      const targetUserId = selectedUserProfile$.userId.get();
      await unfollowUser(myHandle, targetUserId);
      setIsFollowing(false);
      setHasAccess(selectedUserProfile$.isPublic.get());
      // Refresh profile to update follower count
      const profile = await loadProfileByHandle(handle);
      if (profile) setSelectedUserProfile(profile);
    } catch (error: any) {
      alert(error?.message || 'Failed to unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!handle) return;
    const viewerUid = firebase.auth().currentUser?.uid;
    if (!viewerUid) return;
    
    setFollowLoading(true);
    try {
      const targetUserId = selectedUserProfile$.userId.get();
      
      // Remove from both paths using userIds
      const updates: Record<string, any> = {};
      updates[`/followRequestsReceived/${targetUserId}/${viewerUid}`] = null;
      updates[`/followRequestsSent/${viewerUid}/${targetUserId}`] = null;
      
      await firebase.database().ref().update(updates);
      setFollowRequestPending(false);
    } catch (error: any) {
      alert(error?.message || 'Failed to cancel request');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!handle && <Text>No handle provided.</Text>}
      {handle && loading && <ActivityIndicator />}
      {handle && !!selectedUserProfile$.userId.get() && (
        <View style={styles.card}>
          {!!error && !loading && (
            <Text style={styles.error}>{String(error)}</Text>
          )}
          {/* <Text style={styles.header}>Profile: {handle},</Text> */}
          {selectedUserProfile$.avatar.get() ? (
            <Image source={{ uri: selectedUserProfile$.avatar.get() }} style={styles.avatar} />
          ) : null}
          <Text style={styles.handle}>{selectedUserProfile$.handle.get()}</Text>
          {selectedUserProfile$.displayName && selectedUserProfile$.displayName.get() !== selectedUserProfile$.handle.get() && (
            <Text style={styles.displayName}>{selectedUserProfile$.displayName.get()}</Text>
          )}
          {(() => {
            const viewerUidNow = firebase.auth().currentUser?.uid;
            const isOwner = viewerUidNow && viewerUidNow === selectedUserProfile$.userId.get();
            const canSeeDetails = hasAccess === true || isOwner;
            if (!canSeeDetails) return null;
            return selectedUserProfile$.bio.get() ? (
              <Text style={styles.bio}>{selectedUserProfile$.bio.get()}</Text>
            ) : null;
          })()}
          <Text style={styles.meta}>Followers: {selectedUserProfile$.followers.get().length}</Text>
          <Text style={styles.meta}>Following: {selectedUserProfile$.following.get().length}</Text>
          {/* <Text style={styles.meta}>Visibility: {selectedUserProfile$.isPublic.get() ? 'Public' : 'Private'}</Text> */}
          
          {/* Follow/Unfollow Button */}
          {firebase.auth().currentUser?.uid && firebase.auth().currentUser?.uid !== selectedUserProfile$.userId.get() && (
            <View style={{ marginTop: 12 }}>
              {isFollowing ? (
                <Button mode="contained-tonal" onPress={handleUnfollow} loading={followLoading} disabled={followLoading}>
                  Unfollow
                </Button>
              ) : followRequestPending ? (
                <Button mode="outlined" onPress={handleCancelRequest} loading={followLoading} disabled={followLoading}>
                  Cancel Request
                </Button>
              ) : (
                <Button mode="contained" onPress={handleFollow} loading={followLoading} disabled={followLoading}>
                  {selectedUserProfile$.isPublic.get() ? 'Follow' : 'Request to Follow'}
                </Button>
              )}
            </View>
          )}
          {hasAccess === true ? (
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button mode="text" onPress={() => setDayOffset((v) => v - 1)}>Prev</Button>
              <Text style={styles.header}>{getTitle(dayOffset)}</Text>
              <Button mode="text" onPress={() => setDayOffset((v) => v + 1)}>Next</Button>
            </View>
            <Text style={[styles.meta, { textAlign: 'center', marginBottom: 8 }]}>
              {format(new Date(new Date().setDate(new Date().getDate() + dayOffset)), 'EEE, MMM d')}
            </Text>
            {finalEvents.length === 0 ? (
              <Text style={styles.bioEmpty}>No events for this day.</Text>
            ) : (
              finalEvents.map((ev: any) => (
                <PublicEventItem key={ev.id} event={ev} />
              ))
            )}
          </View>
            ) : (
              <View style={{ marginTop: 16, padding: 16, alignItems: 'center' }}>
                <Text style={styles.bioEmpty}>This account is private</Text>
              </View>
            )}
        </View>
      )}
    </View>
  );
});

export default SelectedProfile;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginHorizontal: 200 },
  card: { padding: 16, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'gray' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  handle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  displayName: { fontSize: 18, marginBottom: 8 },
  bio: { marginBottom: 12 },
  bioEmpty: { fontStyle: 'italic', color: 'gray', marginBottom: 12 },
  meta: { fontSize: 14, color: 'gray' },
  error: { color: 'red', marginVertical: 12 },
    header: { fontSize: 18, fontWeight: 'bold' },
});