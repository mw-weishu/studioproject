import { Text } from '@/theme/Themed';
import { setLostItemData } from '@/utilities/Events';
import { LostItem, UserClaim, deleteFoundItem, deleteLostItem, getClaimID, getCurrentUserId, saveClaim, updateFoundItem, updateLostItem, userClaims$ } from '@/utilities/EventsStore';
import { getUserProfile } from '@/utilities/UserProfile';
import { useSelector } from '@legendapp/state/react';
import { router } from 'expo-router';
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Divider } from 'react-native-paper';

const STATUS_COLORS: Record<LostItem['status'], string> = {
  lost: '#e53935',
  found: '#43a047',
  claimed: '#757575',
};

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '📱',
  clothing: '👕',
  documents: '📄',
  accessories: '👜',
  keys: '🔑',
  bags: '🎒',
  books: '📚',
  other: '📦',
};

interface LostItemCardProps {
  item: LostItem;
  showActions?: boolean;
  isAdminView?: boolean;
  allowClaim?: boolean;
}

const LostItemCard = ({ item, showActions = false, isAdminView = false, allowClaim = false }: LostItemCardProps) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [claimMessage, setClaimMessage] = React.useState('');
  const [claimLoading, setClaimLoading] = React.useState(false);
  const currentUserId = getCurrentUserId();
  const isOwner = item.userId === currentUserId;
  const canInteract = isOwner || isAdminView || (allowClaim && item.addedByAdmin && item.status !== 'claimed');

  // Check if the current user already has a pending/approved claim on this item
  const existingClaim = useSelector(() => {
    const claims = Object.values(userClaims$.get() || {}) as UserClaim[];
    return claims.find((c) => c.itemId === item.id && c.userId === currentUserId);
  });

  const statusColor = STATUS_COLORS[item.status] || '#757575';
  const categoryIcon = CATEGORY_ICONS[item.category] || '📦';

  const formattedDate = (() => {
    try {
      return new Date(item.dateLostFound).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return item.dateLostFound;
    }
  })();

  const handleMarkClaimed = async () => {
    setModalVisible(false);
    try {
      if (item.addedByAdmin) {
        await updateFoundItem(item.id, { status: 'claimed' });
      } else {
        await updateLostItem(item.id, { status: 'claimed' });
      }
    } catch (e) {
      console.error('Mark claimed failed', e);
    }
  };

  const handleRevertClaimed = async () => {
    setModalVisible(false);
    try {
      if (item.addedByAdmin) {
        await updateFoundItem(item.id, { status: 'found' });
      } else {
        await updateLostItem(item.id, { status: 'lost' });
      }
    } catch (e) {
      console.error('Revert claimed failed', e);
    }
  };

  const handleSubmitClaim = async () => {
    // Not logged in
    if (!currentUserId) {
      setModalVisible(false);
      router.push('/auth');
      return;
    }
    // Duplicate claim
    if (existingClaim) {
      alert('You have already submitted a claim for this item.');
      return;
    }
    setClaimLoading(true);
    try {
      const userProf = getUserProfile();
      const claim: UserClaim = {
        id: getClaimID(),
        itemId: item.id,
        itemTitle: item.title,
        userId: currentUserId,
        userHandle: userProf?.handle.get() || '',
        message: claimMessage.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        contactPhone: (userProf as any)?.phone?.get?.() || '',
        contactEmail: (userProf as any)?.contactEmail?.get?.() || '',
      };
      await saveClaim(claim);
      setClaimMessage('');
      setModalVisible(false);
      alert('Claim submitted successfully!');
    } catch (e: any) {
      alert(e?.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleEdit = () => {
    setModalVisible(false);
    setLostItemData(item);
    router.navigate('/edit-event');
  };

  const handleDelete = async () => {
    setModalVisible(false);
    try {
      if (item.addedByAdmin) {
        await deleteFoundItem(item.id);
      } else {
        await deleteLostItem(item.id);
      }
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={canInteract ? 0.7 : 1}
        onPress={() => {
          if (!canInteract) return;
          if (allowClaim && item.addedByAdmin && !currentUserId) {
            router.push('/auth');
            return;
          }
          setModalVisible(true);
        }}
        style={styles.card}
      >
      <View style={styles.cardBody}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : null}
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {!item.addedByAdmin && (
                  <Text style={styles.handle}>@{item.userHandle}</Text>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '33' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
          ) : null}

          <View style={styles.footer}>
            {!!item.location && (
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          </View>

          {item.contactInfo ? (
            <View style={styles.contactRow}>
              <Text style={styles.metaIcon}>📞</Text>
              <Text style={styles.contactText}>{item.contactInfo}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>

      {/* Edit/Delete modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.modalImage} resizeMode="cover" />
            ) : null}
            <Text style={styles.modalTitle} numberOfLines={1}>{item.title}</Text>
            {isAdminView && !isOwner && !item.addedByAdmin && (
              <Text style={styles.modalSubtitle}>@{item.userHandle}</Text>
            )}
            <Divider style={styles.modalDivider} />
            {isAdminView ? (
              <>
                {item.status !== 'claimed' && (
                  <TouchableOpacity style={styles.modalAction} onPress={handleMarkClaimed}>
                    <Text style={styles.modalActionText}>✅  Mark as Claimed</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'claimed' && (
                  <TouchableOpacity style={styles.modalAction} onPress={handleRevertClaimed}>
                    <Text style={[styles.modalActionText, { color: '#fcba03' }]}>↩️  Mark as Not Claimed</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.modalAction} onPress={handleDelete}>
                  <Text style={[styles.modalActionText, { color: '#e53935' }]}>🗑️  Delete Item</Text>
                </TouchableOpacity>
              </>
            ) : allowClaim && item.addedByAdmin ? (
              <>
                {existingClaim ? (
                  <Text style={styles.modalSubtitle}>
                    {existingClaim.status === 'approved'
                      ? '✅ Your claim was approved.'
                      : '⏳ You already submitted a claim for this item.'}
                  </Text>
                ) : item.status === 'claimed' ? (
                  <Text style={styles.modalSubtitle}>This item has already been claimed.</Text>
                ) : (
                  <>
                    <Text style={[styles.modalSubtitle, { marginBottom: 8 }]}>Describe why this item is yours:</Text>
                    <TextInput
                      value={claimMessage}
                      onChangeText={setClaimMessage}
                      placeholder="Your message (optional)"
                      placeholderTextColor="#666"
                      style={styles.claimInput}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={[styles.modalAction, claimLoading && { opacity: 0.5 }]}
                      onPress={handleSubmitClaim}
                      disabled={claimLoading}
                    >
                      <Text style={styles.modalActionText}>📨  Submit Claim</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <>
                {item.status !== 'claimed' && (
                  <TouchableOpacity style={styles.modalAction} onPress={handleEdit}>
                    <Text style={styles.modalActionText}>✏️  Edit Item</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'claimed' && (
                  <TouchableOpacity style={styles.modalAction} onPress={handleRevertClaimed}>
                    <Text style={[styles.modalActionText, { color: '#fcba03' }]}>↩️  Mark as Not Claimed</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.modalAction} onPress={handleDelete}>
                  <Text style={[styles.modalActionText, { color: '#e53935' }]}>🗑️  Delete Item</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.modalAction, styles.modalCancel]} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default LostItemCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 14,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    maxWidth: 220,
  },
  handle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#aaa',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  contactText: {
    fontSize: 13,
    color: '#90caf9',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDivider: {
    backgroundColor: '#333',
    marginBottom: 8,
  },
  modalAction: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalActionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: 4,
    borderBottomWidth: 0,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  claimInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
