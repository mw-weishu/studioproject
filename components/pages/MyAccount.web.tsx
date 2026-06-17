import { Text, View } from '@/theme/Themed';
import React from 'react';
import { Button, Chip, Icon, TextInput } from 'react-native-paper';

import { firebase } from '@/firebase.config';
import { lastUserHandle$, lastUserId$, private$, public$ } from '@/utilities/EventsStore';
import { uploadAvatarImage } from '@/utilities/ImageUpload';
import { observer, useSelector } from '@legendapp/state/react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { reauthenticateWithCredential } from 'firebase/auth';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

import { isAdmin$ } from '@/utilities/AdminUtils';
import { acceptFollowRequest, getPendingFollowRequests, getUserProfile, loadProfileByHandle, rejectFollowRequest, setSelectedUserProfile, syncSentFollowRequests } from '@/utilities/UserProfile';
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
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState(false);
  const [localExists, setLocalExists] = React.useState(false);
  const [remoteExists, setRemoteExists] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const isAdmin = useSelector(() => isAdmin$.get());

  const [contactPhone, setContactPhone] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactSaving, setContactSaving] = React.useState(false);
  const [contactErrors, setContactErrors] = React.useState<{ phone?: string; email?: string }>({});

  const profilePhone = useSelector(() => (getUserProfile() as any)?.phone?.get?.() || '');
  const profileContactEmail = useSelector(() => (getUserProfile() as any)?.contactEmail?.get?.() || '');

  React.useEffect(() => {
    setContactPhone(profilePhone);
    setContactEmail(profileContactEmail);
  }, [profilePhone, profileContactEmail]);

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

  const handleSaveContactInfo = async () => {
    const errors: { phone?: string; email?: string } = {};
    const phoneVal = contactPhone.trim();
    const emailVal = contactEmail.trim();
    if (phoneVal && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/.test(phoneVal)) {
      errors.phone = 'Invalid phone number format.';
    }
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errors.email = 'Invalid email address format.';
    }
    setContactErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setContactSaving(true);
    try {
      const userId = firebase.auth().currentUser?.uid;
      if (!userId) return;
      await firebase.database().ref(`/profiles/${userId}`).update({
        phone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
      });
      const prof = getUserProfile();
      if (prof) {
        (prof as any).phone?.set?.(contactPhone.trim());
        (prof as any).contactEmail?.set?.(contactEmail.trim());
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to save contact info');
    } finally {
      setContactSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Profile Card */}
      {userProf?.handle.get() && (
        <View style={styles.card}>
          {/* Logout button top-right */}
          <TouchableOpacity onPress={signOutUser} style={styles.logoutButton}>
            <Icon source="logout" size={20} color="#888" />
          </TouchableOpacity>

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
          {isAdmin && (
            <Chip icon="shield-account" style={styles.adminChip} textStyle={styles.adminChipText}>
              Admin Account
            </Chip>
          )}

          {/* Contact Info — regular users only */}
          {!isAdmin && (
            <View style={styles.contactSection}>
              <Text style={styles.contactHeader}>Contact Info</Text>
              <TextInput
                label="Phone Number"
                value={contactPhone}
                onChangeText={(v) => { setContactPhone(v); if (contactErrors.phone) setContactErrors((e) => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.contactInput}
                dense
                error={!!contactErrors.phone}
              />
              {contactErrors.phone ? <Text style={styles.contactError}>{contactErrors.phone}</Text> : null}
              <TextInput
                label="Contact Email"
                value={contactEmail}
                onChangeText={(v) => { setContactEmail(v); if (contactErrors.email) setContactErrors((e) => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.contactInput}
                dense
                error={!!contactErrors.email}
              />
              {contactErrors.email ? <Text style={styles.contactError}>{contactErrors.email}</Text> : null}
              <Button
                mode="contained"
                onPress={handleSaveContactInfo}
                loading={contactSaving}
                style={styles.contactSave}
                buttonColor="#fcba03"
                textColor="#000"
              >
                Save Contact Info
              </Button>
            </View>
          )}

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
          
        </View>
      )}

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
    borderRadius: 14,
    backgroundColor: '#1c1c1e',
    marginBottom: 16,
  },
  logoutButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  contactSection: {
    marginTop: 16,
    gap: 10,
  },
  contactHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  contactInput: {
    backgroundColor: 'transparent',
  },
  contactError: {
    fontSize: 12,
    color: '#e53935',
    marginTop: 2,
    marginBottom: 4,
  },
  contactSave: {
    marginTop: 4,
    borderRadius: 8,
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
  adminChip: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    backgroundColor: 'rgba(252, 186, 3, 0.15)',
  },
  adminChipText: {
    color: '#fcba03',
    fontWeight: 'bold',
  },
});
