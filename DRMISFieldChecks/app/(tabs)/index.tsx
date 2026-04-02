import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import {
  getStoredAuth,
  getStoredAssignments,
  refreshAssignments,
} from '@/lib/auth';
import { getAllFieldChecks } from '@/lib/storage';
import { Assignment, StoredAuth, FieldCheck } from '@/lib/types';
import { ASSET_TYPE_LABELS, PRIORITY_COLOR } from '@/lib/data';

type Tab = 'assigned' | 'completed' | 'submitted';

const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706',
  in_progress: '#3b82f6',
  completed: '#16a34a',
  skipped: '#9ca3af',
};

export default function DashboardScreen() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [localChecks, setLocalChecks] = useState<FieldCheck[]>([]);
  const [tab, setTab] = useState<Tab>('assigned');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [storedAuth, storedAssignments, checks] = await Promise.all([
      getStoredAuth(),
      getStoredAssignments(),
      getAllFieldChecks(),
    ]);
    setAuth(storedAuth);
    setAssignments(storedAssignments);
    setLocalChecks(checks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected && auth) {
        const apiUrl = (await import('@/lib/storage').then(m => m.getSettings()))
          .drmisApiUrl;
        const updated = await refreshAssignments(apiUrl, auth.token);
        setAssignments(updated);
      }
      const checks = await getAllFieldChecks();
      setLocalChecks(checks);
    } catch {
      // silently ignore refresh errors — user still has cached data
    } finally {
      setRefreshing(false);
    }
  };

  const pendingAssignments = assignments.filter(
    a => a.status === 'pending' || a.status === 'in_progress',
  );
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  const unsyncedChecks = localChecks.filter(c => !c.synced);

  const stats = {
    assigned: pendingAssignments.length,
    completed: completedAssignments.length,
    unsynced: unsyncedChecks.length,
  };

  const displayList =
    tab === 'assigned'
      ? pendingAssignments
      : tab === 'completed'
      ? completedAssignments
      : [];
  const displayLocalChecks = tab === 'submitted' ? localChecks : [];

  const renderAssignment = ({ item }: { item: Assignment }) => {
    const sectorLabel =
      ASSET_TYPE_LABELS[item.sectorFamily as keyof typeof ASSET_TYPE_LABELS] ??
      item.sectorFamily;
    const priorityColor = PRIORITY_COLOR[item.priority] ?? '#6b7280';
    const statusColor = STATUS_COLOR[item.status] ?? '#6b7280';
    const hasLocalCheck = !!item.localCheckId;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/new-check',
            params: { assignmentId: String(item.id) },
          })
        }
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={[styles.sectorDot, { backgroundColor: priorityColor }]} />
            <Text style={styles.sectorLabel}>{sectorLabel}</Text>
            {item.intensity && (
              <View style={styles.intensityBadge}>
                <Text style={styles.intensityText}>Cat {item.intensity}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.councilName}>{item.councilName}</Text>
        <Text style={styles.eventName}>{item.eventName} · {item.provinceName}</Text>

        {item.estimatedValue !== null && (
          <Text style={styles.estimatedValue}>
            RAP estimate: {formatValue(item.estimatedValue)}
          </Text>
        )}

        {item.adminNotes ? (
          <View style={styles.notesBox}>
            <Ionicons name="information-circle-outline" size={13} color="#6b7280" />
            <Text style={styles.notesText} numberOfLines={2}>{item.adminNotes}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Assigned {new Date(item.assignedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
          </Text>
          {hasLocalCheck ? (
            <View style={styles.localCheckBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
              <Text style={styles.localCheckText}>Draft saved</Text>
            </View>
          ) : (
            <View style={styles.startBtn}>
              <Ionicons name="arrow-forward" size={14} color="#1d4ed8" />
              <Text style={styles.startBtnText}>Start check</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderLocalCheck = ({ item }: { item: FieldCheck }) => {
    const sectorLabel =
      ASSET_TYPE_LABELS[item.assetType as keyof typeof ASSET_TYPE_LABELS] ??
      item.assetType;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/check/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.sectorLabel}>{sectorLabel}</Text>
          {!item.synced && (
            <View style={styles.unsyncedBadge}>
              <Text style={styles.unsyncedText}>Unsynced</Text>
            </View>
          )}
          {item.synced && (
            <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.statusText, { color: '#16a34a' }]}>Synced</Text>
            </View>
          )}
        </View>
        <Text style={styles.councilName}>{item.assetName}</Text>
        <Text style={styles.eventName}>{item.council}, {item.province}</Text>
        <Text style={styles.dateText}>
          {new Date(item.timestamp).toLocaleDateString('en-AU', {
            day: '2-digit', month: 'short', year: 'numeric',
          })} · {item.assessorName}
        </Text>
      </TouchableOpacity>
    );
  };

  const userName = auth?.profile
    ? `${auth.profile.firstName || auth.profile.username}`
    : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Field Checks</Text>
          {userName ? (
            <Text style={styles.headerSub}>
              {auth?.profile.areaCouncils.length
                ? auth.profile.areaCouncils.join(', ')
                : auth?.profile.isStaff
                ? 'Staff — all councils'
                : 'No council assigned'}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/new-check')}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsRow}>
        <StatChip
          value={stats.assigned}
          label="To Check"
          color="#d97706"
          active={tab === 'assigned'}
          onPress={() => setTab('assigned')}
        />
        <StatChip
          value={stats.completed}
          label="Completed"
          color="#16a34a"
          active={tab === 'completed'}
          onPress={() => setTab('completed')}
        />
        <StatChip
          value={stats.unsynced}
          label="Unsynced"
          color="#dc2626"
          active={tab === 'submitted'}
          onPress={() => setTab('submitted')}
        />
      </View>

      {/* List */}
      {tab !== 'submitted' ? (
        <FlatList
          data={displayList}
          keyExtractor={item => String(item.id)}
          renderItem={renderAssignment}
          contentContainerStyle={[
            styles.list,
            displayList.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'assigned' ? 'clipboard-outline' : 'checkmark-done-outline'}
              title={tab === 'assigned' ? 'No pending assignments' : 'No completed checks yet'}
              subtitle={
                tab === 'assigned'
                  ? 'Your DRMIS administrator will assign damage estimates to verify. Pull down to refresh.'
                  : 'Complete an assigned check to see it here.'
              }
            />
          }
        />
      ) : (
        <FlatList
          data={displayLocalChecks}
          keyExtractor={item => item.id}
          renderItem={renderLocalCheck}
          contentContainerStyle={[
            styles.list,
            displayLocalChecks.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="cloud-upload-outline"
              title="No submitted checks"
              subtitle="Ad-hoc checks you submit appear here. Go to Settings to sync them to DRMIS."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({
  value, label, color, active, onPress,
}: {
  value: number; label: string; color: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statChip, active && { borderBottomColor: color, borderBottomWidth: 3 }]}
      onPress={onPress}
    >
      <Text style={[styles.statValue, { color: active ? color : '#374151' }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: active ? color : '#9ca3af' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon as any} size={52} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `VUV ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `VUV ${(v / 1_000).toFixed(0)}K`;
  return `VUV ${v}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  headerSub: { fontSize: 12, color: '#bfdbfe', marginTop: 2 },
  newBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 22,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 1 },

  list: { padding: 12, gap: 10 },
  listEmpty: { flexGrow: 1 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectorDot: { width: 8, height: 8, borderRadius: 4 },
  sectorLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  intensityBadge: { backgroundColor: '#fef3c7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  intensityText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  unsyncedBadge: { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  unsyncedText: { fontSize: 11, color: '#92400e', fontWeight: '600' },

  councilName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  eventName: { fontSize: 13, color: '#6b7280' },
  estimatedValue: { fontSize: 12, color: '#3b82f6', fontWeight: '600', marginTop: 2 },

  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  notesText: { flex: 1, fontSize: 12, color: '#6b7280', lineHeight: 17 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: { fontSize: 11, color: '#9ca3af' },
  localCheckBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  localCheckText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  startBtnText: { fontSize: 12, color: '#1d4ed8', fontWeight: '700' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 19 },
});
