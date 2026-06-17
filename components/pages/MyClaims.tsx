import { Text, View } from '@/theme/Themed';
import { isAdmin$ } from '@/utilities/AdminUtils';
import { UserClaim, approveClaim, deleteClaim, getCurrentUserId, userClaims$ } from '@/utilities/EventsStore';
import { useSelector } from '@legendapp/state/react';
import React from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { Chip, Divider } from 'react-native-paper';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
] as const;

type FilterValue = (typeof STATUS_FILTERS)[number]['value'];

const STATUS_COLORS: Record<UserClaim['status'], string> = {
  pending: '#fcba03',
  approved: '#43a047',
  rejected: '#757575',
};

const MyClaims = () => {
  const [filter, setFilter] = React.useState<FilterValue>('all');
  const [actionClaim, setActionClaim] = React.useState<UserClaim | null>(null);
  const [loading, setLoading] = React.useState(false);

  const isAdmin = useSelector(() => isAdmin$.get());
  const currentUserId = getCurrentUserId();

  const claims = useSelector(() => {
    const all = Object.values(userClaims$.get() || {}) as UserClaim[];
    const filtered = isAdmin
      ? all.filter((c) => !!c && (filter === 'all' || c.status === filter))
      : all.filter((c) => !!c && c.userId === currentUserId && (filter === 'all' || c.status === filter));
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const handleApprove = async (claim: UserClaim) => {
    setLoading(true);
    try {
      await approveClaim(claim.id);
      setActionClaim(null);
    } catch (e: any) {
      alert(e?.message || 'Failed to approve claim');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (claim: UserClaim) => {
    setLoading(true);
    try {
      await deleteClaim(claim.id);
      setActionClaim(null);
    } catch (e: any) {
      alert(e?.message || 'Failed to delete claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Claims</Text>
          <Text style={styles.subtitle}>
            {isAdmin ? 'All student claims' : 'Your submitted claims'}
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterContent}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {/* Claims list */}
      {claims.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No claims yet.</Text>
          <Text style={styles.emptyHint}>
            {isAdmin ? 'No claims have been submitted.' : 'Tap on a found item to submit a claim.'}
          </Text>
        </View>
      ) : (
        claims.map((claim) => {
          const statusColor = STATUS_COLORS[claim.status] || '#888';
          return (
            <TouchableOpacity
              key={claim.id}
              style={styles.card}
              activeOpacity={isAdmin ? 0.7 : 1}
              onPress={() => { if (isAdmin) setActionClaim(claim); }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{claim.itemTitle}</Text>
                <Chip
                  style={[styles.statusChip, { backgroundColor: statusColor + '33' }]}
                  textStyle={[styles.statusText, { color: statusColor }]}
                  compact
                >
                  {claim.status.toUpperCase()}
                </Chip>
              </View>
              {isAdmin && (
                <Text style={styles.cardHandle}>@{claim.userHandle}</Text>
              )}
              {isAdmin && (claim.contactPhone || claim.contactEmail) && (
                <View style={styles.contactRow}>
                  {claim.contactPhone ? (
                    <Text style={styles.contactInfo}>📞 {claim.contactPhone}</Text>
                  ) : null}
                  {claim.contactEmail ? (
                    <Text style={styles.contactInfo}>✉️ {claim.contactEmail}</Text>
                  ) : null}
                </View>
              )}
              {claim.message ? (
                <Text style={styles.cardMessage} numberOfLines={3}>{claim.message}</Text>
              ) : (
                <Text style={styles.cardMessageEmpty}>No message provided</Text>
              )}
              <Text style={styles.cardDate}>
                {new Date(claim.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Admin action modal */}
      <Modal
        visible={!!actionClaim}
        transparent
        animationType="slide"
        onRequestClose={() => setActionClaim(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActionClaim(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle} numberOfLines={1}>{actionClaim?.itemTitle}</Text>
            <Text style={styles.modalSubtitle}>@{actionClaim?.userHandle}</Text>
            {(actionClaim?.contactPhone || actionClaim?.contactEmail) && (
              <View style={styles.modalContactRow}>
                {actionClaim?.contactPhone ? (
                  <Text style={styles.modalContact}>📞 {actionClaim.contactPhone}</Text>
                ) : null}
                {actionClaim?.contactEmail ? (
                  <Text style={styles.modalContact}>✉️ {actionClaim.contactEmail}</Text>
                ) : null}
              </View>
            )}
            {actionClaim?.message ? (
              <Text style={styles.modalMessage}>{actionClaim.message}</Text>
            ) : null}
            <Divider style={styles.modalDivider} />
            {actionClaim?.status === 'pending' && (
              <TouchableOpacity
                style={[styles.modalAction, loading && { opacity: 0.5 }]}
                onPress={() => actionClaim && handleApprove(actionClaim)}
                disabled={loading}
              >
                <Text style={[styles.modalActionText, { color: '#43a047' }]}>✅  Approve Claim</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.modalAction, loading && { opacity: 0.5 }]}
              onPress={() => actionClaim && handleDelete(actionClaim)}
              disabled={loading}
            >
              <Text style={[styles.modalActionText, { color: '#e53935' }]}>🗑️  Delete Claim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalAction, styles.modalCancel]} onPress={() => setActionClaim(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default MyClaims;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4,
  },
  heading: { fontSize: 28, fontWeight: '800', color: '#fcba03' },
  subtitle: { fontSize: 13, color: '#888' },
  filterContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: { marginRight: 4 },
  filterChipText: { fontSize: 12 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#ccc' },
  emptyHint: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  cardHandle: { fontSize: 13, color: '#888', marginBottom: 6 },
  cardMessage: { fontSize: 14, color: '#ccc', marginBottom: 6 },
  cardMessageEmpty: { fontSize: 14, color: '#555', fontStyle: 'italic', marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#555' },
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 6, flexWrap: 'wrap' },
  contactInfo: { fontSize: 13, color: '#aaa' },
  modalContactRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 8, flexWrap: 'wrap' },
  modalContact: { fontSize: 13, color: '#aaa' },
  statusChip: { borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 2 },
  modalSubtitle: { fontSize: 14, color: '#888', paddingHorizontal: 20, marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#ccc', paddingHorizontal: 20, marginBottom: 8 },
  modalDivider: { marginVertical: 8, backgroundColor: '#333' },
  modalAction: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  modalActionText: { fontSize: 16, color: '#fff' },
  modalCancel: { marginTop: 4, borderBottomWidth: 0 },
  modalCancelText: { fontSize: 16, color: '#888', textAlign: 'center' },
});
