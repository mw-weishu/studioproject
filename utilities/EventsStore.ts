import { observable } from '@legendapp/state';

import { configureObservablePersistence, persistObservable } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { ObservablePersistFirebase } from "@legendapp/state/persist-plugins/firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { firebase } from '../firebase.config';
import { isAdmin$ } from './AdminUtils';
import { userProfile$ } from './UserProfile';

// ==== TypeScript Types ====

export type LostItemCategory =
  | 'electronics'
  | 'clothing'
  | 'documents'
  | 'accessories'
  | 'keys'
  | 'bags'
  | 'books'
  | 'other';

export interface LostItem {
  id: string;
  userId: string;
  userHandle: string;
  title: string;
  description: string;
  category: LostItemCategory;
  status: 'lost' | 'found' | 'claimed';
  imageUrl?: string;
  location: string;
  dateLostFound: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  addedByAdmin?: boolean;
}

// ==== Helpers ====

export const getCurrentUserId = (): string =>
  firebase.auth().currentUser?.uid || '';

export const formatDateKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const getLostItemID = (): string =>
  firebase.database().ref('/lostItems').push().key || Date.now().toString();

export const getFoundItemID = (): string =>
  firebase.database().ref('/foundItems').push().key || Date.now().toString();

export const getClaimID = (): string =>
  firebase.database().ref('/userClaims').push().key || Date.now().toString();

// ==== Observables ====

// Global lost/found items store persisted to Firebase /lostItems/
export const lostItems$ = observable<Record<string, LostItem>>({});

// Admin-submitted found items — separate store at /foundItems/
export const foundItems$ = observable<Record<string, LostItem>>({}); 

// ==== Claim Types ====

export interface UserClaim {
  id: string;
  itemId: string;
  itemTitle: string;
  userId: string;
  userHandle: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  contactPhone?: string;
  contactEmail?: string;
}

export const userClaims$ = observable<Record<string, UserClaim>>({}); 

// Identifiers kept for auth/profile flows
export const lastUserId$ = observable<string>('');
export const lastUserHandle$ = observable<string>('');

// Stub observables kept so existing MyAccount.tsx clearAllData does not crash
export const private$ = observable<Record<string, any>>({});
export const public$ = observable<Record<string, any>>({});

// ==== CRUD ====

export const saveLostItem = async (item: LostItem): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  lostItems$[item.id].set(item);
};

export const saveFoundItem = async (item: LostItem): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  await firebase.database().ref(`/foundItems/${item.id}`).set(item);
  foundItems$[item.id].set(item);
};

export const deleteLostItem = async (itemId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  const item = lostItems$[itemId].get();
  if (item && !item.addedByAdmin && item.userId !== userId && !isAdmin$.get()) throw new Error('Not authorized');
  lostItems$[itemId].delete();
};

export const deleteFoundItem = async (itemId: string): Promise<void> => {
  if (!isAdmin$.get()) throw new Error('Not authorized');
  await firebase.database().ref(`/foundItems/${itemId}`).remove();
  foundItems$[itemId].delete();
};

export const updateLostItem = async (itemId: string, updates: Partial<LostItem>): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  const item = lostItems$[itemId].get();
  if (item && !item.addedByAdmin && item.userId !== userId && !isAdmin$.get()) throw new Error('Not authorized');
  lostItems$[itemId].set({ ...item, ...updates, updatedAt: new Date().toISOString() });
};

export const updateFoundItem = async (itemId: string, updates: Partial<LostItem>): Promise<void> => {
  if (!isAdmin$.get()) throw new Error('Not authorized');
  const item = foundItems$[itemId].get();
  const updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
  await firebase.database().ref(`/foundItems/${itemId}`).set(updated);
  foundItems$[itemId].set(updated);
};

// ==== Claim CRUD ====

export const saveClaim = async (claim: UserClaim): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  await firebase.database().ref(`/userClaims/${claim.id}`).set(claim);
  userClaims$[claim.id].set(claim);
};

export const deleteClaim = async (claimId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');
  const claim = userClaims$[claimId].get();
  if (claim && claim.userId !== userId && !isAdmin$.get()) throw new Error('Not authorized');
  await firebase.database().ref(`/userClaims/${claimId}`).remove();
  userClaims$[claimId].delete();
};

export const approveClaim = async (claimId: string): Promise<void> => {
  if (!isAdmin$.get()) throw new Error('Not authorized');
  const claim = userClaims$[claimId].get();
  if (!claim) throw new Error('Claim not found');
  // Mark the found item as claimed
  await updateFoundItem(claim.itemId, { status: 'claimed' });
  // Update claim status
  const updated = { ...claim, status: 'approved' as const };
  await firebase.database().ref(`/userClaims/${claimId}`).set(updated);
  userClaims$[claimId].set(updated);
};

// Real-time listener for /userClaims/
let userClaimsUnsubscribe: (() => void) | null = null;
export const setupUserClaimsListener = (): void => {
  if (userClaimsUnsubscribe) return;
  const ref = firebase.database().ref('/userClaims');
  const handler = ref.on('value', (snapshot) => {
    userClaims$.set(snapshot.exists() ? (snapshot.val() as Record<string, UserClaim>) : {});
  });
  userClaimsUnsubscribe = () => ref.off('value', handler);
};

// ==== Query helpers ====

export const getAllPublicItems = (): LostItem[] => {
  const items = lostItems$.get() || {};
  return Object.values(items).filter((item): item is LostItem => !!item && item.isPublic);
};

export const getMyItems = (): LostItem[] => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const items = lostItems$.get() || {};
  return Object.values(items).filter((item): item is LostItem => !!item && item.userId === userId);
};

export const getItemsByStatus = (status: LostItem['status']): LostItem[] => {
  const items = lostItems$.get() || {};
  return Object.values(items).filter(
    (item): item is LostItem => !!item && item.isPublic && item.status === status
  );
};

export const getItemsByCategory = (category: LostItemCategory): LostItem[] => {
  const items = lostItems$.get() || {};
  return Object.values(items).filter(
    (item): item is LostItem => !!item && item.isPublic && item.category === category
  );
};

// Real-time listener for /foundItems/ — call once after auth, returns unsubscribe fn
let foundItemsUnsubscribe: (() => void) | null = null;
export const setupFoundItemsListener = (): void => {
  if (foundItemsUnsubscribe) return; // already listening
  const ref = firebase.database().ref('/foundItems');
  const handler = ref.on('value', (snapshot) => {
    foundItems$.set(snapshot.exists() ? (snapshot.val() as Record<string, LostItem>) : {});
  });
  foundItemsUnsubscribe = () => ref.off('value', handler);
};

const configurePersistence = async (): Promise<void> => {
  try {
    configureObservablePersistence({
      pluginLocal: ObservablePersistAsyncStorage,
      localOptions: {
        asyncStorage: { AsyncStorage },
      },
    });
  } catch (error) {
    console.error('Error configuring persistence:', error);
  }
};

export const persistLostItems = async (userId: string): Promise<void> => {
  try {
    persistObservable(userProfile$[userId], {
      pluginLocal: ObservablePersistAsyncStorage,
      local: `/profile/${userId}/`,
      pluginRemote: ObservablePersistFirebase,
      remote: {
        onSetError: (err) => console.error(err),
        firebase: {
          refPath: () => `/profiles/${userId}/`,
          requireAuth: true,
        },
      },
    });

    persistObservable(lostItems$, {
      pluginLocal: ObservablePersistAsyncStorage,
      local: '/lostItems/',
      pluginRemote: ObservablePersistFirebase,
      remote: {
        onSetError: (err: unknown) => console.error(err),
        firebase: {
          refPath: () => '/lostItems/',
          requireAuth: true,
        },
      },
    });

    // foundItems$ and userClaims$ use direct Firebase listeners
    setupFoundItemsListener();
    setupUserClaimsListener();
  } catch (error) {
    console.error('Error persisting observable:', error);
  }
};

// Alias so existing auth components keep working
export const persistEvents = persistLostItems;

firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    await configurePersistence();
    await persistLostItems(user.uid);
  }
});
