import { observable } from '@legendapp/state';
import { firebase } from '../firebase.config';

// Admin state — re-checked from Firebase on every auth state change,
// so no local persistence needed (avoids AsyncStorage init-time crash).
export const isAdmin$ = observable(false);

/**
 * Checks /adminHandles in Firebase and updates isAdmin$ accordingly.
 * Call this after every sign-in and on auth state restoration.
 */
export const checkAndSetAdmin = async (uid: string): Promise<boolean> => {
  try {
    const snapshot = await firebase.database()
      .ref('/adminHandles')
      .orderByValue()
      .equalTo(uid)
      .once('value');
    const result = snapshot.exists();
    isAdmin$.set(result);
    return result;
  } catch (e) {
    console.error('checkAndSetAdmin error:', e);
    isAdmin$.set(false);
    return false;
  }
};

/**
 * Stores handle -> uid in /adminHandles, making this user an admin.
 */
export const claimAdminHandle = async (userId: string, handle: string): Promise<void> => {
  await firebase.database()
    .ref(`/adminHandles/${handle.toLowerCase()}`)
    .set(userId);
};
