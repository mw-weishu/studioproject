# Findora — University Lost & Found Platform

## Documentation

---

## Overview

Findora is a cross-platform mobile and web application (Expo / React Native) that connects university students with the lost-and-found office. Admins post items that have been handed in; students browse the list, submit claims, and report their own missing belongings. The app uses Firebase Authentication and Realtime Database for data storage, `@legendapp/state` for reactive state management with Firebase persistence, and Expo Router for file-based navigation.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native + Web) |
| Routing | Expo Router (file-based) |
| State management | `@legendapp/state` — `observable`, `observer`, `useSelector`, `persistObservable` |
| Backend / Auth | Firebase Authentication (email + password) |
| Database | Firebase Realtime Database |
| UI components | `react-native-paper` (Buttons, TextInput, Chips, Menus, Modals) |
| Image uploads | Firebase Storage via `utilities/ImageUpload.ts` |
| Styling | `StyleSheet` + `theme/Themed.tsx` dark-theme wrapper |

---

## Feature Reference

---

### 1. Account Registration `[Must-be]`

**User story:** As a guest, I want to create an account so that I can start using Findora.

**Files involved:**
- `app/auth.tsx` — route that hosts all auth screens
- `components/auth/AuthSignUp.tsx` — sign-up form component
- `utilities/UserProfile.ts` — `checkHandleAvailability`, `claimHandle`, `persistUserProfile`
- `utilities/EventsStore.ts` — `persistEvents`, `lastUserId$`, `lastUserHandle$`

**How it works:**

1. The user fills in **username** (handle), **email**, and **password** on the Sign Up screen.
2. `checkHandleAvailability(username)` queries `/handles/{username}` in Firebase to verify the handle is not taken.
3. `firebase.auth().createUserWithEmailAndPassword(email, password)` creates the Firebase Auth account.
4. On success, `claimHandle(uid, username)` writes `uid` to `/handles/{username}`.
5. `persistUserProfile(username)` sets up the `@legendapp/state` observable for the new user's profile and syncs it to `/profiles/{uid}/` in Firebase.
6. `persistEvents(uid)` activates persistence for `lostItems$` and `foundItems$`.
7. The user is redirected to `/(tabs)`.

**Acceptance criteria behaviour:**
- **Duplicate email** — Firebase Auth throws `auth/email-already-in-use`; the error message is shown via `alert`.
- **Invalid email** — Firebase Auth throws `auth/invalid-email`; shown as an alert.
- **Missing fields** — `username` is checked explicitly before the Firebase call; missing email/password surfaces as a Firebase Auth error.
- **Password confirmation mismatch** — currently both passwords are entered once; the field acts as a single password entry (no second confirmation field in this implementation).

---

### 2. User Login `[Must-be]`

**User story:** As a registered user, I want to log in so that I can access my posts and claims.

**Files involved:**
- `app/auth.tsx` — route entry point
- `components/auth/AuthSignIn.tsx` — sign-in form
- `utilities/EventsStore.ts` — `persistEvents`

**How it works:**

1. The user enters **email** and **password** on the Sign In screen.
2. `firebase.auth().signInWithEmailAndPassword(email, password)` authenticates the user.
3. On success, `persistEvents(uid)` activates real-time Firebase sync for the user's observables.
4. The user is redirected to `/(tabs)`.
5. `app/(tabs)/_layout.tsx` listens to `onAuthStateChanged`; on sign-in it calls `checkAndSetAdmin(uid)` to determine whether the session is an admin session.

**Acceptance criteria behaviour:**
- **Invalid credentials** — Firebase Auth throws `auth/wrong-password` or `auth/user-not-found`; shown as an alert.
- **Empty fields** — Firebase Auth throws `auth/invalid-email` or similar; shown as an alert.
- **Invalid email format** — caught by Firebase Auth before a network call is made.

---

### 3. Admin: Post a Found Item `[Must-be]`

**User story:** As an admin, I want to post a found item so that students can see what has been handed in.

**Files involved:**
- `utilities/AdminUtils.ts` — `isAdmin$`, `checkAndSetAdmin`
- `utilities/Events.ts` — `setDefaultFoundItemData`, `handleSaveLostItem`, `ADMIN_USER_ID`
- `utilities/EventsStore.ts` — `foundItems$`, `saveFoundItem`, `getFoundItemID`
- `components/edit/Event.tsx` — item creation/edit form
- `components/pages/MyPager.tsx` — the index feed (admin sees + button)
- `app/(tabs)/index.tsx` — entry point for the home tab

**How it works:**

1. When an admin taps `+` in the home feed, `setDefaultFoundItemData()` is called:
   - Sets `isAdminAdd$` to `true`.
   - Pre-fills `selectedLostItemData$` with `userId: "__admin__"`, `status: "found"`, `isPublic: true`, and a fresh key from `/foundItems` via `getFoundItemID()`.
2. The user is navigated to `/edit-event` which renders `components/edit/Event.tsx`.
3. The form title shows **"Add Found Item"**. The photo section is hidden (admin items have no image upload). The status chip is locked to **Found**.
4. On tapping **"Add Found Item"**, `handleSaveLostItem()` runs:
   - Builds a `LostItem` object with `addedByAdmin: true` and `userId: ADMIN_USER_ID`.
   - Calls `saveFoundItem(item)` which writes to the `foundItems$` observable → persisted to Firebase at `/foundItems/{id}`.
   - Resets `selectedLostItemData$` to a blank state and clears `isAdminAdd$`.
5. The index feed (`MyPager`) reactively updates because it reads directly from `foundItems$`.

**Acceptance criteria behaviour:**
- **Missing required fields** — `handleSaveLostItem` attempts to save; fields like `title` and `location` are required in the form via UI controls, but no additional server-side re-validation occurs beyond what the form enforces.
- **Unauthorized access** — `isAdmin$` is checked in `MyPager`; non-admin users do not see the `+` button. The edit form also reads `isAdminAdd$` to lock admin-specific UI.

---

### 4. Post a Lost Item `[Must-be]`

**User story:** As a registered user, I want to post a lost item with details and photos.

**Files involved:**
- `utilities/Events.ts` — `setDefaultLostItemData`, `handleSaveLostItem`
- `utilities/EventsStore.ts` — `lostItems$`, `saveLostItem`, `getLostItemID`
- `components/edit/Event.tsx` — item creation/edit form

**How it works:**

1. (The `+` button for regular users was present in earlier versions. In the current design, the home feed is admin-only. Users can still report items; the route `/edit-event` is accessible via navigation.)
2. `setDefaultLostItemData()` pre-fills `selectedLostItemData$` with the user's `uid`, `userHandle`, `status: "lost"`, `isPublic: false`, and a fresh key from `/lostItems` via `getLostItemID()`.
3. The form shows the full item form including the **photo picker** (via `expo-image-picker`).
4. On save, `handleSaveLostItem()`:
   - Uploads the selected image to Firebase Storage via `uploadEventImage` if a new image was chosen.
   - Saves to `lostItems$` → persisted to `/lostItems/{id}` in Firebase.
   - Resets the form observable.

**Acceptance criteria behaviour:**
- **Missing required fields** — form UI controls and button labels guide the user; empty critical fields surface as validation alerts before the Firebase call.
- **Photo upload — unsupported type** — `expo-image-picker` is configured with `mediaTypes: Images` only, preventing non-image files from being selected.

---

### 5. Browse Found Items `[Must-be]`

**User story:** As a registered user, I want to browse items found and posted by admins.

**Files involved:**
- `app/(tabs)/index.tsx` — home tab entry, shows `LandingPage` when signed out, `LostItemFeed` when signed in
- `components/pages/MyPager.tsx` — the feed component
- `components/items/LostItemCard.tsx` — individual item card
- `utilities/EventsStore.ts` — `foundItems$`

**How it works:**

1. `app/(tabs)/index.tsx` listens to `onAuthStateChanged`. Unauthenticated users see the `LandingPage` (sign-in / create-account CTAs). Authenticated users see `LostItemFeed` wrapped in `GestureHandlerRootView`.
2. `MyPager` reads `foundItems$` reactively via `useSelector`. Every value in the observable is an `LostItem` with `addedByAdmin: true`.
3. Items are sorted newest-first by `createdAt`.
4. Status filter chips (**All / Found / Claimed**) filter the list client-side.
5. Each item is rendered as a `LostItemCard` showing: category icon, title, handle, status chip, image (if any), description, location, and date.
6. Admin users additionally see the `+` button and can interact with the action modal on any card.

**Acceptance criteria behaviour:**
- **No found items** — `sorted.length === 0` renders an empty state with 🔍 icon and "No items yet."
- **Not logged in** — `LandingPage` is shown with Sign In / Create Account buttons routing to `/auth`.

---

### 6. Submit a Claim on a Found Item `[Must-be]`

**User story:** As a registered user, I want to submit a claim on a found item.

**Files involved:**
- `components/items/LostItemCard.tsx` — card with interactive modal
- `utilities/EventsStore.ts` — `updateFoundItem`
- `utilities/Events.ts` — `handleUpdateLostItemStatus`

**How it works:**

1. Any authenticated non-admin user can tap a `LostItemCard`. The `canInteract` flag is `isOwner || isAdminView`; for the found items feed, admin users can manage items while regular users can tap to view details.
2. The action modal (bottom sheet) shows **"Mark as Claimed"** (hidden when `item.status === 'claimed'`), and **"Delete"** (admin only).
3. Tapping **"Mark as Claimed"** calls `updateFoundItem(item.id, { status: 'claimed' })`, which updates `foundItems$[id]` → synced to `/foundItems/{id}` in Firebase.
4. The status chip on the card reactively updates to **CLAIMED** (grey).

> **Note on claims flow:** In the current implementation the "claim" action is admin-controlled (admin marks an item as claimed after a student contacts them). A dedicated student-facing "Claim This Item" button with a separate `/claimsReceived` Firebase path is defined in the acceptance criteria as a **Should-be** / **Could-be** extension.

**Acceptance criteria behaviour:**
- **Item already claimed** — the "Mark as Claimed" option is conditionally hidden when `item.status === 'claimed'`.
- **Not logged in** — `app/(tabs)/index.tsx` renders `LandingPage`; the feed is never shown.

---

### 7. Admin: Approve or Reject a Student Claim `[Should-be]`

**User story:** As an admin, I want to approve or reject a student claim.

**Current implementation status:** The admin can mark any found item as **Claimed** via the card's action modal (`updateFoundItem`). A dedicated approve/reject flow with per-claim records at `/claimsReceived/{itemId}/{userId}` and in-app notifications is defined in the acceptance criteria but not yet implemented as a separate UI module. The current "Mark as Claimed" action on the admin modal satisfies the core accept scenario.

---

### 8. Add Contact Info to Profile `[Should-be]`

**User story:** As a registered user, I want to add contact info to my profile.

**Files involved:**
- `components/pages/MyAccount.tsx` — own profile screen
- `utilities/UserProfile.ts` — user profile observable

**How it works:**

The user profile (stored at `/profiles/{uid}/`) includes a `bio` field which can hold contact information. Profile editing is available through the handle/display name/bio fields. A dedicated contact info field with phone validation is defined in the acceptance criteria as a **Should-be** extension.

---

### 9. Search Items by Keyword or Category `[Should-be]`

**Files involved:**
- `app/(tabs)/search.tsx` — search tab route
- `components/pages/SearchProfile.tsx` — search UI component

**How it works:**

The search tab currently provides **user/profile search** by handle. Found-item keyword and category search is available via the **filter chips** (All / Found / Claimed) on the home feed. A full-text keyword search bar filtering `foundItems$` by title/description/category is defined in the acceptance criteria as a **Should-be** extension.

---

### 10. Mark Lost Item Post as Resolved `[Should-be]`

**Files involved:**
- `components/items/LostItemCard.tsx` — action modal
- `utilities/EventsStore.ts` — `updateLostItem`

**How it works:**

A user who owns a lost item can open the action modal and **Delete** the post to remove it, or an admin can mark it as **Claimed**. A dedicated "Mark as Resolved" status toggle that sets `status: "resolved"` with a visual Resolved badge is defined in the acceptance criteria as a **Should-be** extension.

---

### 11. Edit a Lost Item Post `[Could-be]`

**Files involved:**
- `components/items/LostItemCard.tsx` — **Edit Item** action in owner modal
- `utilities/Events.ts` — `setLostItemData`
- `components/edit/Event.tsx` — shared create/edit form

**How it works:**

1. Tapping **"Edit Item"** in the owner action modal calls `setLostItemData(item)`, which:
   - Sets `isAdminAdd$` to `false` (or `true` if `item.addedByAdmin === true`).
   - Populates `selectedLostItemData$` with the existing item fields including `id` and `createdAt`.
2. The user is navigated to `/edit-event`.
3. `isEdit` is computed as `!!data.createdAt && !!data.id && data.title !== "" && !isAdminMode` — all must be true for edit mode to activate.
4. The form title shows **"Edit Item"** and the save button shows **"Update Item"**.
5. On save, `handleSaveLostItem()` re-uses the existing `id` and `createdAt`, updating the record in-place via `saveLostItem` (which calls `lostItems$[item.id].set(item)`).

**Acceptance criteria behaviour:**
- **Edit button hidden on other users' posts** — `canInteract = isOwner || isAdminView`; non-owners never see the action modal.
- **Claimed posts cannot be edited** — the **Edit Item** option is hidden in the modal when `item.status === 'claimed'`.

---

### 12. Admin: Mark a Found Item as Returned / Claimed `[Could-be]`

**User story:** As an admin, I want to mark a found item as returned so the post is closed.

**Files involved:**
- `components/items/LostItemCard.tsx` — admin action modal
- `utilities/EventsStore.ts` — `updateFoundItem`

**How it works:**

1. Admin taps a `LostItemCard` in the home feed.
2. The action modal shows **"Mark as Claimed"** (when `item.status !== 'claimed'`) and **"Delete Item"**.
3. **"Mark as Claimed"** calls `updateFoundItem(item.id, { status: 'claimed' })` → sets `foundItems$[id].status` to `'claimed'` → synced to `/foundItems/{id}` in Firebase.
4. The card's status chip immediately updates to **CLAIMED**.
5. **"Delete Item"** calls `deleteFoundItem(item.id)` → removes the key from `foundItems$` → deleted from `/foundItems/{id}`.

**Acceptance criteria behaviour:**
- **Unauthorized access** — `isAdminView` prop is only `true` when `isAdmin$.get()` is `true`; regular users never receive the admin modal.
- **Reopen / undo** — not yet implemented as a separate "Reopen" button; the admin can re-edit the status.

---

## Data Model

### Firebase Realtime Database paths

| Path | Description |
|---|---|
| `/lostItems/{itemId}` | Items reported as lost by registered users |
| `/foundItems/{itemId}` | Items posted as found by admins (shown on home feed) |
| `/profiles/{uid}/` | User profile: handle, displayName, bio, avatar, followers, following, isPublic |
| `/handles/{handle}` | Maps lowercased handle → uid |
| `/adminHandles/{handle}` | Maps admin handle → uid; presence here grants admin access |
| `/followRequestsReceived/{targetUid}/{requesterUid}` | Pending follow requests |
| `/followRequestsSent/{requesterUid}/{targetUid}` | Mirror of sent follow requests for offline sync |

### LostItem schema

```ts
interface LostItem {
  id: string;
  userId: string;           // uid of submitting user, or "__admin__" for admin items
  userHandle: string;
  title: string;
  description: string;
  category: LostItemCategory;
  status: 'lost' | 'found' | 'claimed';
  imageUrl?: string;
  location: string;
  dateLostFound: string;    // ISO string
  contactInfo?: string;
  createdAt: string;        // ISO string
  updatedAt: string;        // ISO string
  isPublic: boolean;
  addedByAdmin?: boolean;   // true for all items in /foundItems/
}
```

---

## Admin System

### How admin access works

1. Admin accounts are registered via `/admin-auth` route → `components/auth/AdminSignUp.tsx`.
2. On registration, `claimAdminHandle(uid, handle)` writes the handle→uid mapping to `/adminHandles/{handle}`.
3. On every sign-in, `checkAndSetAdmin(uid)` queries `/adminHandles` ordered by value for the current uid.
4. If a match exists, `isAdmin$.set(true)` is called; otherwise `false`.
5. `isAdmin$` is an `@legendapp/state` observable — any component that subscribes via `useSelector(() => isAdmin$.get())` reacts immediately.
6. On sign-out, `isAdmin$.set(false)` is called from `app/(tabs)/_layout.tsx`.

### What admins can do that regular users cannot

| Action | Admin | User |
|---|---|---|
| Post found items to the shared `/foundItems/` store | ✅ | ❌ |
| See the `+` button on the home feed | ✅ | ❌ |
| Mark any found item as Claimed | ✅ | ❌ |
| Delete any found item | ✅ | ❌ |
| See all lost item reports (`/lostItems/`) in their profile pager | ✅ | own only |
| Profile shows "Admin Account" chip | ✅ | ❌ |

---

## Navigation Structure

```
app/
├── index.tsx              (redirect logic)
├── auth.tsx               (Sign In / Sign Up / Reset Password)
├── admin-auth.tsx         (Admin Sign In / Admin Sign Up)
├── edit-event.tsx         (Create / Edit item form)
├── (tabs)/
│   ├── _layout.tsx        (Tab bar, auth guard, admin check)
│   ├── index.tsx          (Home — found items feed + landing page)
│   ├── [profile].tsx      (Own profile = MyAccount, other = SelectedProfile)
│   ├── search.tsx         (User/profile search)
│   ├── saved.tsx          (Saved items)
│   └── ai.tsx             (AI tab — href:null, hidden)
```

---

## State Management

All reactive state uses `@legendapp/state`:

| Observable | Location | Persisted to |
|---|---|---|
| `lostItems$` | `EventsStore.ts` | Firebase `/lostItems/` + AsyncStorage |
| `foundItems$` | `EventsStore.ts` | Firebase `/foundItems/` + AsyncStorage |
| `userProfile$[uid]` | `UserProfile.ts` | Firebase `/profiles/{uid}/` + AsyncStorage |
| `selectedLostItemData$` | `Events.ts` | In-memory only (reset after every save) |
| `isAdminAdd$` | `Events.ts` | In-memory only |
| `isAdmin$` | `AdminUtils.ts` | In-memory only (re-checked on every auth change) |
| `lastUserId$`, `lastUserHandle$` | `EventsStore.ts` | AsyncStorage |

Persistence is activated in `persistLostItems(uid)` which is called:
- After sign-in (`AuthSignIn`, `AdminSignIn`, `AuthSignUp`)
- In the `onAuthStateChanged` handler in `EventsStore.ts` as a fallback

---

## Build & Deployment

| Target | Command |
|---|---|
| Local development | `npx expo start -c` |
| Web export | `expo export -p web` |
| Vercel production | `npx vercel --prod` |

Config files: `app.json` (Expo), `eas.json` (EAS Build), `vercel.json` (Vercel routing), `tsconfig.json`.
