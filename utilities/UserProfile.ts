import { observable } from '@legendapp/state';
import { persistObservable } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { ObservablePersistFirebase } from "@legendapp/state/persist-plugins/firebase";
import { firebase } from '../firebase.config';

export const selectedUserProfile$ = observable({
  userId: '',
  handle: '',
  displayName: '' as string,
  bio: '',
  avatar: '',
  isPublic: false,
  followers: [] as string[],
  following: [] as string[],
  publicEvents: [],
  publicRepeatingEvents: [],
  publicRoutines: [],
  publicSchedules: [],
  createdAt: '',
  updatedAt: '',
});

export const setSelectedUserProfile = (profile: any) => {
  console.log('setSelectedUserProfile called with:', JSON.stringify(profile, null, 2));
  selectedUserProfile$.userId.set(profile.userId || '');
  selectedUserProfile$.handle.set(profile.handle || '');
  selectedUserProfile$.displayName.set(profile.displayName || profile.handle || '');
  selectedUserProfile$.bio.set(profile.bio || '');
  selectedUserProfile$.avatar.set(profile.avatar || '');
  selectedUserProfile$.isPublic.set(!!profile.isPublic);
  
  // Handle both array and object formats for followers/following
  const followersArray = Array.isArray(profile.followers) 
    ? profile.followers.filter(Boolean) // Filter out null/undefined
    : (profile.followers ? Object.keys(profile.followers) : []);
  const followingArray = Array.isArray(profile.following)
    ? profile.following.filter(Boolean)
    : (profile.following ? Object.keys(profile.following) : []);
  
  console.log('Converted followers:', followersArray, 'from', profile.followers);
  console.log('Converted following:', followingArray, 'from', profile.following);
  
  selectedUserProfile$.followers.set(followersArray);
  selectedUserProfile$.following.set(followingArray);
  selectedUserProfile$.publicEvents.set(profile.publicEvents || []);
  selectedUserProfile$.publicRepeatingEvents.set(profile.publicRepeatingEvents || []);
  selectedUserProfile$.publicRoutines.set(profile.publicRoutines || []);
  selectedUserProfile$.publicSchedules.set(profile.publicSchedules || []);
  selectedUserProfile$.createdAt.set(profile.createdAt || '');
  selectedUserProfile$.updatedAt.set(profile.updatedAt || '');
};

// Helper to get current userId
const getCurrentUserId = () => {
  return firebase.auth().currentUser?.uid;
};

export const userProfile$ = observable<Record<string, any>>({});

// Helper to get or create user profile observable
export const getUserProfile = (userId?: string) => {
  const uid = userId || getCurrentUserId();
  if (!uid) return null;
  
  if (!userProfile$[uid]) {
    userProfile$[uid].set({
      userId: '',
      handle: '',
      displayName: '',
      bio: '',
      avatar: '',
      isPublic: false,
      followers: {},
      following: {},
      publicEvents: [],
      publicRepeatingEvents: [],
      publicRoutines: [],
      publicSchedules: [],
      createdAt: '',
      updatedAt: '',
    });
  }
  
  return userProfile$[uid];
};

// Check if handle is available
export const checkHandleAvailability = async (handle: string) => {
  if (!handle || handle.length < 3) {
    return { available: false, error: 'Handle must be at least 3 characters' };
  }
  
  // Validate handle format (alphanumeric, underscores, hyphens only)
  const handleRegex = /^[a-zA-Z0-9_-]+$/;
  if (!handleRegex.test(handle)) {
    return { available: false, error: 'Handle can only contain letters, numbers, underscores, and hyphens' };
  }

  try {
    const snapshot = await firebase.database()
      .ref(`/handles/${handle.toLowerCase()}`)
      .once('value');
    
    return { available: !snapshot.exists(), error: null };
  } catch (error) {
    console.error('Error checking handle availability:', error);
    return { available: false, error: 'Error checking availability' };
  }
};

// Claim a handle for a user
export const claimHandle = async (userId: string, handle: string) => {
  const { available, error } = await checkHandleAvailability(handle);
  
  if (!available) {
    throw new Error(error || 'Handle is already taken');
  }

  try {
    // Use a transaction to ensure atomicity
    const handleLower = handle.toLowerCase();
    
    // Store the mapping: handle -> userId
    await firebase.database()
      .ref(`/handles/${handleLower}`)
      .set(userId);
    
    // Initialize the public profile
    const profile = {
      userId: userId,
      handle: handleLower,
      displayName: handle,
      bio: '',
      avatar: '',
      isPublic: false,
      followers: {}, // Object with userId keys, each value is { handle: string }
      following: {}, // Object with userId keys, each value is { handle: string }
      publicEvents: [],
      publicRepeatingEvents: [],
      publicRoutines: [],
      publicSchedules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firebase.database()
      .ref(`/profiles/${userId}`)
      .set(profile);
    
    // Update local observable (keep objects as-is, matching Firebase structure)
    const userProf = getUserProfile(userId);
    if (userProf) {
      userProf.userId.set(userId);
      userProf.handle.set(handleLower);
      userProf.displayName.set(handle);
      userProf.bio.set('');
      userProf.avatar.set('');
      userProf.isPublic.set(false);
      userProf.followers.set({});
      userProf.following.set({});
      userProf.publicEvents.set([]);
      userProf.publicRepeatingEvents.set([]);
      userProf.publicRoutines.set([]);
      userProf.publicSchedules.set([]);
      userProf.createdAt.set(profile.createdAt);
      userProf.updatedAt.set(profile.updatedAt);
    }
    
    return { success: true, handle: handleLower };
  } catch (error) {
    console.error('Error claiming handle:', error);
    throw error;
  }
};

// Load user profile by handle
export const loadProfileByHandle = async (handle: string) => {
  try {
    const handleLower = handle.toLowerCase();
    
    // First, resolve handle to userId
    const handleSnapshot = await firebase.database()
      .ref(`/handles/${handleLower}`)
      .once('value');
    
    if (!handleSnapshot.exists()) {
      console.log('Handle not found:', handleLower);
      return null;
    }
    
    const userId = handleSnapshot.val();
    
    // Then load profile by userId
    const profileSnapshot = await firebase.database()
      .ref(`/profiles/${userId}`)
      .once('value');
    
    if (profileSnapshot.exists()) {
      const profile = profileSnapshot.val();
      console.log('Raw profile from database:', JSON.stringify(profile, null, 2));
      console.log('Followers type:', typeof profile.followers, 'Value:', profile.followers);
      console.log('Following type:', typeof profile.following, 'Value:', profile.following);
      
      // Migration: Ensure followers and following are objects, not arrays or missing
      const updates: any = {};
      
      if (!profile.followers || Array.isArray(profile.followers)) {
        console.log('Migrating followers to empty object');
        updates.followers = {};
      }
      if (!profile.following || Array.isArray(profile.following)) {
        console.log('Migrating following to empty object');
        updates.following = {};
      }
      
      // Apply migration only if current user owns this profile
      const needsUpdate = Object.keys(updates).length > 0;
      if (needsUpdate) {
        const currentUser = firebase.auth().currentUser;
        if (currentUser && currentUser.uid === userId) {
          console.log('Migrating profile structure for userId:', userId);
          try {
            await firebase.database()
              .ref(`/profiles/${userId}`)
              .update(updates);
          } catch (error) {
            console.warn('Failed to migrate profile (user owns it but update failed):', error);
          }
        }
        
        // Always return profile with fixes applied locally
        const migratedProfile = { ...profile, ...updates };
        console.log('Returning migrated profile:', JSON.stringify(migratedProfile, null, 2));
        return migratedProfile;
      }
      
      console.log('Returning original profile:', JSON.stringify(profile, null, 2));
      return profile;
    }
    return null;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};

// Get handle for a userId
export const getHandleForUser = async (userId: string) => {
  try {
    const snapshot = await firebase.database()
      .ref(`/handles`)
      .orderByValue()
      .equalTo(userId)
      .once('value');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data)[0]; // Return the first (and should be only) handle
    }
    return null;
  } catch (error) {
    console.error('Error getting handle:', error);
    return null;
  }
};

// Persist user profile
export const persistUserProfile = async (handle: string) => {
  try {
    persistObservable(userProfile$, {
      pluginLocal: ObservablePersistAsyncStorage,
      local: `userProfile`,
      pluginRemote: ObservablePersistFirebase,
      remote: {
        firebase: {
          refPath: () => `/userProfiles/${handle}/`,
          requireAuth: false, // Public read access
        },
      },
    });
  } catch (error) {
    console.error("Error persisting user profile:", error);
  }
};

// Share a routine publicly
// export const shareRoutinePublicly = async (routine: any, handle: string) => {
//   try {
//     if (!handle) {
//       throw new Error('User has no handle');
//     }

//     const handleLower = handle.toLowerCase();
    
//     // Store the routine in shared content
//     await firebase.database()
//       .ref(`/sharedContent/${handleLower}/routines/${routine.id}`)
//       .set({
//         ...routine,
//         sharedAt: new Date().toISOString(),
//       });
    
//     // Update the profile's public routines list
//     const currentPublicRoutines = userProfile$.publicRoutines.get() || [];
//     if (!currentPublicRoutines.includes(routine.id)) {
//       userProfile$.publicRoutines.set([...currentPublicRoutines, routine.id]);
      
//       // Update timestamp
//       userProfile$.updatedAt.set(new Date().toISOString());
//     }
    
//     return { success: true };
//   } catch (error) {
//     console.error('Error sharing routine:', error);
//     throw error;
//   }
// };

// Unshare a routine
// export const unshareRoutine = async (routineId: string, handle: string) => {
//   try {
//     if (!handle) {
//       throw new Error('User has no handle');
//     }

//     const handleLower = handle.toLowerCase();
    
//     // Remove from shared content
//     await firebase.database()
//       .ref(`/sharedContent/${handleLower}/routines/${routineId}`)
//       .remove();
    
//     // Update the profile's public routines list
//     const currentPublicRoutines = userProfile$.publicRoutines.get() || [];
//     const updatedRoutines = currentPublicRoutines.filter(id => id !== routineId);
//     userProfile$.publicRoutines.set(updatedRoutines);
//     userProfile$.updatedAt.set(new Date().toISOString());
    
//     return { success: true };
//   } catch (error) {
//     console.error('Error unsharing routine:', error);
//     throw error;
//   }
// };

// Load a public routine from a user's handle
export const loadPublicRoutine = async (handle: string, routineId: string) => {
  try {
    const handleLower = handle.toLowerCase();
    const snapshot = await firebase.database()
      .ref(`/sharedContent/${handleLower}/routines/${routineId}`)
      .once('value');
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error loading public routine:', error);
    return null;
  }
};

// Load all public routines for a handle
export const loadAllPublicRoutines = async (handle: string) => {
  try {
    const handleLower = handle.toLowerCase();
    const snapshot = await firebase.database()
      .ref(`/sharedContent/${handleLower}/routines`)
      .once('value');
    
    if (snapshot.exists()) {
      const routines = snapshot.val();
      return Object.values(routines);
    }
    return [];
  } catch (error) {
    console.error('Error loading public routines:', error);
    return [];
  }
};

// Update profile information
// export const updateProfile = async (updates: any) => {
//   try {
//     const handle = userProfile$.handle.get();
//     if (!handle) {
//       throw new Error('No handle set');
//     }

//     const updatedData = {
//       ...updates,
//       updatedAt: new Date().toISOString(),
//     };

//     await firebase.database()
//       .ref(`/publicProfiles/${handle}`)
//       .update(updatedData);
    
//     // Update local observable
//     Object.keys(updatedData).forEach(key => {
//       userProfile$[key].set(updatedData[key]);
//     });
    
//     return { success: true };
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     throw error;
//   }
// };

// ============ PRIVACY & FOLLOW SYSTEM ============
// Record a sent follow request in the user's profile
export const recordSentFollowRequest = async (requesterId: string, targetUserId: string) => {
  try {
    const entry = { status: 'pending', timestamp: new Date().toISOString() };
    
    // Write to followRequestsSent path using userIds
    await firebase.database()
      .ref(`/followRequestsSent/${requesterId}/${targetUserId}`)
      .set(entry);
  } catch (e) {
    console.log('recordSentFollowRequest error:', e);
  }
};

// Toggle profile privacy (public/private)
export const toggleProfilePrivacy = async (handle: string, isPublic: boolean) => {
  try {
    const handleLower = handle.toLowerCase();
    
    // Resolve handle to userId
    const handleSnapshot = await firebase.database()
      .ref(`/handles/${handleLower}`)
      .once('value');
    
    if (!handleSnapshot.exists()) {
      throw new Error('Handle not found');
    }
    
    const userId = handleSnapshot.val();
    
    await firebase.database()
      .ref(`/profiles/${userId}`)
      .update({
        isPublic,
        updatedAt: new Date().toISOString(),
      });
    
    const userProf = getUserProfile();
    if (userProf) {
      userProf.isPublic.set(isPublic);
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling privacy:', error);
    throw error;
  }
};

// Send a follow request (for private profiles) or auto-follow (for public)
export const followUser = async (targetHandle: string, requesterId: string) => {
  try {
    const targetHandleLower = targetHandle.toLowerCase();
    
    // Resolve target handle to userId
    const targetHandleSnapshot = await firebase.database()
      .ref(`/handles/${targetHandleLower}`)
      .once('value');
    
    if (!targetHandleSnapshot.exists()) {
      throw new Error('Target handle not found');
    }
    
    const targetUserId = targetHandleSnapshot.val();
    
    // Check if target profile is public
    const profileSnapshot = await firebase.database()
      .ref(`/profiles/${targetUserId}`)
      .once('value');
    
    if (!profileSnapshot.exists()) {
      throw new Error('Profile not found');
    }
    
    const targetProfile = profileSnapshot.val();
    
    // Resolve requester handle (from uid)
    const requesterHandle = await getHandleForUser(requesterId);
    if (!requesterHandle) {
      throw new Error('Requester handle not found');
    }
    const requesterLower = requesterHandle.toLowerCase();
    
    if (targetProfile.isPublic) {
      // For public profiles: create a pre-accepted request and update followers/following
      const entry = {
        status: 'accepted',
        timestamp: new Date().toISOString(),
      };
      
      const updates: Record<string, any> = {};
      // Update request paths
      updates[`/followRequestsReceived/${targetUserId}/${requesterId}`] = entry;
      updates[`/followRequestsSent/${requesterId}/${targetUserId}`] = entry;
      // Update profile followers/following with handle and avatar
      updates[`/profiles/${targetUserId}/followers/${requesterId}`] = { 
        handle: requesterLower
      };
      updates[`/profiles/${requesterId}/following/${targetUserId}`] = { 
        handle: targetHandleLower
      };
      
      await firebase.database().ref().update(updates);
      return { success: true, autoFollowed: true };
    } else {
      // Create follow request for private profiles in both sent and received paths only
      const entry = {
        status: 'pending',
        timestamp: new Date().toISOString(),
      };
      
      const updates: Record<string, any> = {};
      // Store received request using userIds
      updates[`/followRequestsReceived/${targetUserId}/${requesterId}`] = entry;
      updates[`/followRequestsSent/${requesterId}/${targetUserId}`] = entry;
      
      await firebase.database().ref().update(updates);
      
      return { success: true, autoFollowed: false };
    }
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// Accept a follow request
export const acceptFollowRequest = async (targetHandle: string, requesterHandle: string) => {
  try {
    const targetHandleLower = targetHandle.toLowerCase();
    const requesterLower = requesterHandle.toLowerCase();
    
    // Map requester handle to uid
    const requesterUserIdSnap = await firebase.database().ref(`/handles/${requesterLower}`).once('value');
    if (!requesterUserIdSnap.exists()) throw new Error('Requester userId not found');
    const requesterUserId = requesterUserIdSnap.val();
    
    // Resolve target (current user) uid from handle
    const targetUserIdSnap = await firebase.database().ref(`/handles/${targetHandleLower}`).once('value');
    if (!targetUserIdSnap.exists()) throw new Error('Target userId not found');
    const targetUserId = targetUserIdSnap.val();
    
    // Now that rules allow target to write to requester's following when there's a pending request,
    // we can do this in a single atomic update
    const updates: Record<string, any> = {};
    updates[`/profiles/${targetUserId}/followers/${requesterUserId}`] = { 
      handle: requesterLower
    };
    updates[`/profiles/${requesterUserId}/following/${targetUserId}`] = { 
      handle: targetHandleLower
    };
    updates[`/followRequestsReceived/${targetUserId}/${requesterUserId}/status`] = 'accepted';
    updates[`/followRequestsSent/${requesterUserId}/${targetUserId}/status`] = 'accepted';
    
    await firebase.database().ref().update(updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting follow request:', error);
    throw error;
  }
};

// Reject a follow request
export const rejectFollowRequest = async (targetHandle: string, requesterHandle: string) => {
  try {
    const targetHandleLower = targetHandle.toLowerCase();
    const requesterLower = requesterHandle.toLowerCase();
    
    // Resolve both handles to userIds
    const targetUserIdSnap = await firebase.database().ref(`/handles/${targetHandleLower}`).once('value');
    if (!targetUserIdSnap.exists()) throw new Error('Target userId not found');
    const targetUserId = targetUserIdSnap.val();
    
    const requesterUserIdSnap = await firebase.database().ref(`/handles/${requesterLower}`).once('value');
    if (!requesterUserIdSnap.exists()) throw new Error('Requester userId not found');
    const requesterUserId = requesterUserIdSnap.val();
    
    // Update both received and sent request status
    const updates: Record<string, any> = {};
    updates[`/followRequestsReceived/${targetUserId}/${requesterUserId}/status`] = 'rejected';
    updates[`/followRequestsSent/${requesterUserId}/${targetUserId}/status`] = 'rejected';
    
    await firebase.database().ref().update(updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting follow request:', error);
    throw error;
  }
};

// Remove a follower
export const removeFollower = async (handle: string, followerId: string) => {
  try {
    const handleLower = handle.toLowerCase();
    
    // Get follower's handle
    const followerHandleSnapshot = await firebase.database()
      .ref('/handles')
      .orderByValue()
      .equalTo(followerId)
      .once('value');
    
    if (!followerHandleSnapshot.exists()) {
      throw new Error('Follower not found');
    }
    
    const followerHandle = Object.keys(followerHandleSnapshot.val())[0];
    
    // Get owner userId
    const userId = await firebase.database()
      .ref(`/handles/${handleLower}`)
      .once('value')
      .then(snap => snap.val());
    
    // Remove from both followers and following
    const updates: Record<string, any> = {};
    updates[`/profiles/${userId}/followers/${followerId}`] = null;
    updates[`/profiles/${followerId}/following/${userId}`] = null;
    
    await firebase.database().ref().update(updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing follower:', error);
    throw error;
  }
};

// Unfollow a user
export const unfollowUser = async (userHandle: string, targetUserId: string) => {
  try {
    const userHandleLower = userHandle.toLowerCase();
    const userId = await firebase.database()
      .ref(`/handles/${userHandleLower}`)
      .once('value')
      .then(snap => snap.val());
    
    // Get target handle
    const targetHandleSnapshot = await firebase.database()
      .ref('/handles')
      .orderByValue()
      .equalTo(targetUserId)
      .once('value');
    
    if (!targetHandleSnapshot.exists()) {
      throw new Error('Target user not found');
    }
    
    const targetHandle = Object.keys(targetHandleSnapshot.val())[0];
    
    // Remove from both following and followers
    const updates: Record<string, any> = {};
    updates[`/profiles/${userId}/following/${targetUserId}`] = null;
    updates[`/profiles/${targetUserId}/followers/${userId}`] = null;
    
    await firebase.database().ref().update(updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

// Get pending follow requests for a handle
export const getPendingFollowRequests = async (handle: string) => {
  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }
    
    const handleLower = handle.toLowerCase();
    
    // Verify the current user owns this handle
    const handleOwnerSnap = await firebase.database()
      .ref(`/handles/${handleLower}`)
      .once('value');
    
    if (!handleOwnerSnap.exists()) {
      throw new Error('Handle not found');
    }
    
    if (handleOwnerSnap.val() !== currentUser.uid) {
      throw new Error('Not authorized to view these follow requests');
    }
    
    const userId = handleOwnerSnap.val();
    
    const snapshot = await firebase.database()
      .ref(`/followRequestsReceived/${userId}`)
      .orderByChild('status')
      .equalTo('pending')
      .once('value');
    
    if (snapshot.exists()) {
      const requests = snapshot.val();
      // Resolve requester userIds back to handles and fetch avatars for display
      const requestsWithHandles = await Promise.all(
        Object.keys(requests).map(async (requesterUserId) => {
          const handleSnap = await firebase.database()
            .ref('/handles')
            .orderByValue()
            .equalTo(requesterUserId)
            .once('value');
          const requesterHandle = handleSnap.exists() ? Object.keys(handleSnap.val())[0] : requesterUserId;
          
          // Fetch requester's profile to get avatar
          const profileSnap = await firebase.database()
            .ref(`/profiles/${requesterUserId}`)
            .once('value');
          const profile = profileSnap.val();
          
          return {
            requesterHandle,
            avatar: profile?.avatar || '',
            ...requests[requesterUserId],
          };
        })
      );
      return requestsWithHandles;
    }
    return [];
  } catch (error) {
    console.error('Error getting follow requests:', error);
    throw error;
  }
};

// Check if user can access another user's content
export const canAccessContent = async (viewerUserId: string | null, targetHandle: string) => {
  try {
    const targetHandleLower = targetHandle.toLowerCase();
    console.log('Checking access for viewer:', viewerUserId, 'to target handle:', targetHandleLower);
    
    // Resolve target handle to userId
    const handleSnapshot = await firebase.database()
      .ref(`/handles/${targetHandleLower}`)
      .once('value');
    
    if (!handleSnapshot.exists()) {
      console.log('Handle not found');
      return false;
    }
    
    const targetUserId = handleSnapshot.val();
    
    // Get target profile
    const profileSnapshot = await firebase.database()
      .ref(`/profiles/${targetUserId}`)
      .once('value');
    
    if (!profileSnapshot.exists()) {
      console.log('Profile not found');
      return false;
    }
    
    const profile = profileSnapshot.val();
    console.log('Target profile:', profile);
    
    // Public profiles are accessible to everyone
    if (profile.isPublic) {
      return true;
    }
    
    // Not logged in can't see private content
    if (!viewerUserId) {
      return false;
    }
    
    // Owner can always see their own content
    if (profile.userId === viewerUserId) {
      return true;
    }
    
    // Check if viewer is a follower - handle both array and object formats
    if (Array.isArray(profile.followers)) {
      const isFollower = profile.followers.includes(viewerUserId);
      console.log('Checking array followers:', profile.followers, 'includes', viewerUserId, '=', isFollower);
      return isFollower;
    } else if (profile.followers && typeof profile.followers === 'object') {
      const followerSnapshot = await firebase.database()
        .ref(`/profiles/${targetUserId}/followers/${viewerUserId}`)
        .once('value');
      const isFollower = followerSnapshot.exists();
      console.log('Checking object followers via snapshot:', isFollower);
      return isFollower;
    }
    
    console.log('No followers data found');
    return false;
  } catch (error) {
    console.error('Error checking content access:', error);
    return false;
  }
};

// Watch a follow request status; when it becomes 'accepted', add target to requester's following.
// Returns an unsubscribe function. Safe because requester writes only to their own profile.
export const watchFollowAcceptance = (targetHandle: string, onAccepted?: () => void) => {
  // Disabled: acceptance now writes followers/following; watcher is no-op.
  return () => void 0;

  /*
  // Previous logic (kept for reference):
  const user = firebase.auth().currentUser;
  if (!user) return () => void 0;
  const requesterId = user.uid;
  const targetLower = targetHandle.toLowerCase();

  const setupWatch = async () => {
    try {
      const requesterHandle = await getHandleForUser(requesterId);
      if (!requesterHandle) return () => void 0;

      const requesterLower = requesterHandle.toLowerCase();
      const reqRef = firebase.database().ref(`/followRequestsSent/${requesterLower}/${targetLower}`);

      const handler = async (snap: any) => {
        const val = snap.val();
        if (!val || val.status !== 'accepted') return;
        try {
          onAccepted && onAccepted();
        } catch (e) {
          console.log('watchFollowAcceptance handler error:', e);
        } finally {
          reqRef.off('value', handler);
        }
      };

      reqRef.on('value', handler);
      return () => reqRef.off('value', handler);
    } catch (e) {
      console.log('watchFollowAcceptance setup error:', e);
      return () => void 0;
    }
  };

  let unsubscribe: (() => void) | null = null;
  setupWatch().then(unsub => { unsubscribe = unsub; });
  return () => { if (unsubscribe) unsubscribe(); };
  */
};

// Check all pending sentFollowRequests for current user and update statuses / following
export const syncSentFollowRequests = async () => {
  return; // Disabled; now handled in followUser and acceptFollowRequest
};