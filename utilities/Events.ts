import { observable } from "@legendapp/state";
import { firebase } from "../firebase.config";
import {
    LostItem,
    LostItemCategory,
    deleteFoundItem,
    deleteLostItem,
    getFoundItemID,
    getLostItemID,
    saveFoundItem,
    saveLostItem,
    updateLostItem,
} from "./EventsStore";
import { deleteEventImage, uploadEventImage } from "./ImageUpload";
import { getUserProfile } from "./UserProfile";

// Observable for the currently selected/editing lost item
export const selectedLostItemData$ = observable({
  id: "" as string,
  userId: "" as string,
  userHandle: "" as string,
  title: "",
  description: "",
  category: "other" as LostItemCategory,
  status: "lost" as "lost" | "found" | "claimed",
  imageUrl: "",
  image: null as string | null,
  location: "",
  dateLostFound: new Date().toISOString(),
  contactInfo: "",
  createdAt: "",
  updatedAt: "",
  isPublic: false,
});

// Signals the edit form that an admin is adding a found item (no image, locked status)
export const isAdminAdd$ = observable(false);

export const setDefaultLostItemData = () => {
  isAdminAdd$.set(false);
  const uid = firebase.auth().currentUser?.uid || "";
  const profile = getUserProfile();
  const handle = profile?.handle.get() || "";
  selectedLostItemData$.set({
    id: getLostItemID(),
    userId: uid,
    userHandle: handle,
    title: "",
    description: "",
    category: "other",
    status: "lost",
    imageUrl: "",
    image: null,
    location: "",
    dateLostFound: new Date().toISOString(),
    contactInfo: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false,
  });
};

// Admin saves use this shared sentinel so items belong to no specific admin user
export const ADMIN_USER_ID = "__admin__";

// Admin uses this to pre-fill a "found item" entry (no image, public, status="found")
export const setDefaultFoundItemData = () => {
  isAdminAdd$.set(true);
  const profile = getUserProfile();
  const handle = profile?.handle.get() || "";
  selectedLostItemData$.set({
    id: getFoundItemID(),
    userId: ADMIN_USER_ID,
    userHandle: handle,
    title: "",
    description: "",
    category: "other",
    status: "found",
    imageUrl: "",
    image: null,
    location: "",
    dateLostFound: new Date().toISOString(),
    contactInfo: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: true,
  });
};

export const setLostItemData = (item: LostItem) => {
  isAdminAdd$.set(item.addedByAdmin === true);
  selectedLostItemData$.set({
    ...item,
    image: item.imageUrl || null,
  });
};

export const handleSaveLostItem = async (): Promise<void> => {
  const data = selectedLostItemData$.get();
  const uid = firebase.auth().currentUser?.uid || "";
  if (!uid) throw new Error("Not authenticated");
  const adminMode = isAdminAdd$.get();

  let imageUrl = data.imageUrl || "";
  if (!adminMode && data.image && data.image !== data.imageUrl) {
    try {
      imageUrl = await uploadEventImage(data.image);
    } catch (e) {
      console.error("Image upload failed", e);
    }
  }

  const item: LostItem = {
    id: data.id || (adminMode ? getFoundItemID() : getLostItemID()),
    userId: adminMode ? ADMIN_USER_ID : uid,
    userHandle: data.userHandle || "",
    title: data.title,
    description: data.description,
    category: data.category,
    status: adminMode ? "found" : data.status,
    imageUrl,
    location: data.location,
    dateLostFound: data.dateLostFound,
    contactInfo: data.contactInfo,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: adminMode ? true : false,
    addedByAdmin: adminMode ? true : undefined,
  };

  if (adminMode) {
    await saveFoundItem(item);
    isAdminAdd$.set(false);
  } else {
    await saveLostItem(item);
  }

  // Reset the form so the next tap of + always starts clean
  selectedLostItemData$.set({
    id: "",
    userId: "",
    userHandle: "",
    title: "",
    description: "",
    category: "other",
    status: "lost",
    imageUrl: "",
    image: null,
    location: "",
    dateLostFound: new Date().toISOString(),
    contactInfo: "",
    createdAt: "",
    updatedAt: "",
    isPublic: false,
  });
};

export const handleDeleteLostItem = async (itemId: string): Promise<void> => {
  const item = selectedLostItemData$.get();
  if (item.imageUrl) {
    try {
      await deleteEventImage(item.imageUrl);
    } catch (e) {
      console.error("Image delete failed", e);
    }
  }
  if (isAdminAdd$.get()) {
    await deleteFoundItem(itemId);
  } else {
    await deleteLostItem(itemId);
  }
};

export const handleUpdateLostItemStatus = async (
  itemId: string,
  status: "lost" | "found" | "claimed"
): Promise<void> => {
  await updateLostItem(itemId, { status });
};
