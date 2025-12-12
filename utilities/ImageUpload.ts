import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase.config';

export const uploadEventImage = async (
  imageUri: string, 
  eventId: string, 
  userId: string
): Promise<string> => {
  try {
    // Fetch the image from local URI
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create a reference with path: users/{userId}/events/{eventId}/image.jpg
    const filename = `${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/events/${eventId}/${filename}`);
    
    // Upload the blob
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadAvatarImage = async (
  imageUri: string, 
  handle: string, 
  userId: string,
  oldAvatarUrl?: string
): Promise<string> => {
  try {
    // Delete old avatar if it exists
    if (oldAvatarUrl) {
      await deleteAvatarImage(oldAvatarUrl);
    }
    
    // Fetch the image from local URI
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create a reference with path: users/{userId}/avatar/image.jpg
    const filename = `${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/avatar/${filename}`);
    
    // Upload the blob
    await uploadBytes(storageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Delete avatar image
export const deleteAvatarImage = async (avatarUrl: string) => {
  try {
    if (!avatarUrl) return;
    // Firebase download URL format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
    const parts = avatarUrl.split('/o/');
    if (parts.length < 2) {
      console.warn('Unrecognized avatar URL format, cannot delete:', avatarUrl);
      return;
    }
    const pathAndParams = parts[1];
    const pathEncoded = pathAndParams.split('?')[0];
    const storagePath = decodeURIComponent(pathEncoded);
    const avatarRef = ref(storage, storagePath);
    await deleteObject(avatarRef);
    console.log('Successfully deleted old avatar');
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't throw - we don't want to block the upload if delete fails
  }
};

// Optional: Delete image when event is deleted
export const deleteEventImage = async (imageUrl: string) => {
  try {
    if (!imageUrl) return;
    // Firebase download URL format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
    const parts = imageUrl.split('/o/');
    if (parts.length < 2) {
      console.warn('Unrecognized image URL format, cannot delete:', imageUrl);
      return;
    }
    const pathAndParams = parts[1];
    const pathEncoded = pathAndParams.split('?')[0];
    const storagePath = decodeURIComponent(pathEncoded);
    const imageRef = ref(storage, storagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};