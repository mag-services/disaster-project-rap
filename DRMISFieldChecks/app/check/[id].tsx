import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFieldCheck, deleteFieldCheck } from '@/lib/storage';
import { FieldCheck } from '@/lib/types';
import {
  ASSET_TYPE_LABELS,
  PRIORITY_COLOR,
  DAMAGE_CONDITION_COLOR,
  FUNCTIONALITY_COLOR,
} from '@/lib/data';

export default function FieldCheckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [check, setCheck] = useState<FieldCheck | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getFieldCheck(id).then(c => {
        setCheck(c);
        if (c) {
          navigation.setOptions({ title: c.assetName || 'Field Check' });
        }
      });
    }, [id])
  );

  const handleDelete = () => {
    if (!check) return;
    Alert.alert('Delete Field Check', `Delete "${check.assetName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFieldCheck(check.id);
          router.back();
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!check) return;
    const lines = [
      `DRMIS Field Check Report`,
      `========================`,
      `Asset: ${check.assetName} (${ASSET_TYPE_LABELS[check.assetType]})`,
      `Asset ID: ${check.assetId}`,
      `Council: ${check.council}, ${check.province}`,
      `Date: ${new Date(check.timestamp).toLocaleDateString('en-AU')}`,
      ``,
      `DAMAGE`,
      `Roof: ${check.roofDamage.condition} (${check.roofDamage.percentage}%)`,
      check.roofDamage.notes ? `  Notes: ${check.roofDamage.notes}` : '',
      `Wall: ${check.wallDamage.condition} (${check.wallDamage.percentage}%)`,
      check.wallDamage.notes ? `  Notes: ${check.wallDamage.notes}` : '',
      ``,
      `ASSESSMENT`,
      `Functionality: ${check.functionality.replace('_', ' ')}`,
      `Priority: ${check.priority}`,
      check.immediateNeeds.length ? `Immediate Needs: ${check.immediateNeeds.join(', ')}` : '',
      ``,
      `GPS: ${check.gpsCoordinates.latitude.toFixed(6)}, ${check.gpsCoordinates.longitude.toFixed(6)}`,
      `Assessor: ${check.assessorName} (${check.assessorId})`,
    ].filter(Boolean).join('\n');

    await Share.share({ message: lines, title: `Field Check — ${check.assetName}` });
  };

  if (!check) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const date = new Date(check.timestamp).toLocaleDateString('en-AU', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const time = new Date(check.timestamp).toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.assetTypePill}>
              <Text style={styles.assetTypePillText}>{ASSET_TYPE_LABELS[check.assetType]}</Text>
            </View>
            {!check.synced && (
              <View style={styles.unsyncedBadge}>
                <Ionicons name="cloud-offline-outline" size={12} color="#92400e" />
                <Text style={styles.unsyncedText}>Unsynced</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroTitle}>{check.assetName}</Text>
          <Text style={styles.heroSub}>{check.assetId} · {check.council}, {check.province}</Text>
          <Text style={styles.heroDate}>{date} at {time}</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#1d4ed8" />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status badges */}
        <View style={styles.badgeRow}>
          <StatusBadge
            label="Priority"
            value={check.priority.charAt(0).toUpperCase() + check.priority.slice(1)}
            color={PRIORITY_COLOR[check.priority]}
            icon="flag"
          />
          <StatusBadge
            label="Functionality"
            value={check.functionality === 'partially_usable' ? 'Partial' : check.functionality === 'not_usable' ? 'Not Usable' : 'Usable'}
            color={FUNCTIONALITY_COLOR[check.functionality]}
            icon="business"
          />
          <StatusBadge
            label="Construction"
            value={check.constructionType.charAt(0).toUpperCase() + check.constructionType.slice(1)}
            color="#6366f1"
            icon="construct"
          />
        </View>

        {/* Damage section */}
        <SectionCard title="Damage Assessment">
          <DamageRow
            label="Roof"
            condition={check.roofDamage.condition}
            percentage={check.roofDamage.percentage}
            notes={check.roofDamage.notes}
          />
          <DamageRow
            label="Walls"
            condition={check.wallDamage.condition}
            percentage={check.wallDamage.percentage}
            notes={check.wallDamage.notes}
          />
        </SectionCard>

        {/* GPS */}
        <SectionCard title="GPS Location">
          {check.gpsCoordinates.latitude !== 0 ? (
            <View style={styles.gpsRow}>
              <Ionicons name="location" size={22} color="#1d4ed8" />
              <View style={styles.gpsInfo}>
                <Text style={styles.gpsCoord}>
                  {check.gpsCoordinates.latitude.toFixed(6)}, {check.gpsCoordinates.longitude.toFixed(6)}
                </Text>
                <Text style={styles.gpsAccuracy}>Accuracy: ±{check.gpsCoordinates.accuracy.toFixed(0)} m</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No GPS coordinates recorded.</Text>
          )}
        </SectionCard>

        {/* Immediate needs */}
        {check.immediateNeeds.length > 0 && (
          <SectionCard title="Immediate Needs">
            <View style={styles.needsWrap}>
              {check.immediateNeeds.map(need => (
                <View key={need} style={styles.needTag}>
                  <Text style={styles.needTagText}>{need}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* Context notes */}
        <SectionCard title="Field Notes">
          {check.weatherConditions ? (
            <InfoRow icon="partly-sunny-outline" label="Weather" value={check.weatherConditions} />
          ) : null}
          {check.accessIssues ? (
            <InfoRow icon="warning-outline" label="Access Issues" value={check.accessIssues} />
          ) : null}
          {check.additionalNotes ? (
            <InfoRow icon="document-text-outline" label="Notes" value={check.additionalNotes} />
          ) : null}
          {!check.weatherConditions && !check.accessIssues && !check.additionalNotes && (
            <Text style={styles.noDataText}>No field notes recorded.</Text>
          )}
        </SectionCard>

        {/* Assessor */}
        <SectionCard title="Assessor">
          <InfoRow icon="person-outline" label="Name" value={`${check.assessorName} (${check.assessorId})`} />
          {check.teamLead ? (
            <InfoRow icon="people-outline" label="Team Lead" value={check.teamLead} />
          ) : null}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ label, value, color, icon }: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <View style={[styles.statusBadge, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DamageRow({ label, condition, percentage, notes }: {
  label: string;
  condition: string;
  percentage: number;
  notes: string;
}) {
  const color = DAMAGE_CONDITION_COLOR[condition as keyof typeof DAMAGE_CONDITION_COLOR] ?? '#6b7280';
  return (
    <View style={styles.damageRow}>
      <View style={styles.damageRowLeft}>
        <Text style={styles.damageRowLabel}>{label}</Text>
        <View style={[styles.conditionBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.conditionBadgeText, { color }]}>
            {condition.charAt(0).toUpperCase() + condition.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.damageRowRight}>
        <Text style={[styles.damagePercent, { color }]}>{percentage}%</Text>
        {notes ? <Text style={styles.damageNotes}>{notes}</Text> : null}
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color="#6b7280" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 14, gap: 12, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6b7280', fontSize: 16 },

  heroCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  assetTypePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  assetTypePillText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  unsyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unsyncedText: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  heroSub: { fontSize: 14, color: '#bfdbfe', marginBottom: 2 },
  heroDate: { fontSize: 12, color: '#93c5fd', marginBottom: 16 },
  heroActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionBtnDanger: { backgroundColor: '#fff1f2' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#1d4ed8' },

  badgeRow: { flexDirection: 'row', gap: 8 },
  statusBadge: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderTopWidth: 3,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  statusValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  statusLabel: { fontSize: 10, color: '#9ca3af' },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  damageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  damageRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  damageRowLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  conditionBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  conditionBadgeText: { fontSize: 12, fontWeight: '600' },
  damageRowRight: { alignItems: 'flex-end', flex: 1 },
  damagePercent: { fontSize: 20, fontWeight: 'bold' },
  damageNotes: { fontSize: 12, color: '#6b7280', marginTop: 2, textAlign: 'right', maxWidth: 180 },

  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gpsInfo: { flex: 1 },
  gpsCoord: { fontSize: 15, fontWeight: '600', color: '#111827' },
  gpsAccuracy: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  needsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  needTag: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  needTagText: { fontSize: 12, color: '#1d4ed8', fontWeight: '500' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  infoIcon: { marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 1 },
  infoValue: { fontSize: 14, color: '#374151', lineHeight: 20 },

  noDataText: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
});
