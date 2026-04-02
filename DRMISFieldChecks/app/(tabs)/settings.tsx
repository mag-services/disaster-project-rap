import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, saveSettings, getAllFieldChecks, getPendingSyncCount, syncAllToServer, SyncSummary } from '@/lib/storage';
import { clearAuth, getStoredAuth } from '@/lib/auth';
import { AppSettings, StoredAuth } from '@/lib/types';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({
    assessorName: '',
    assessorId: '',
    teamLead: '',
    drmisApiUrl: 'http://localhost:8080',
    drmisApiToken: '',
  });
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const [s, storedAuth, pending, all] = await Promise.all([
      getSettings(),
      getStoredAuth(),
      getPendingSyncCount(),
      getAllFieldChecks(),
    ]);
    setSettings(s);
    setAuth(storedAuth);
    setPendingCount(pending);
    setTotalCount(all.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      Alert.alert('Saved', 'Settings saved successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!settings.drmisApiToken) {
      Alert.alert(
        'Token Required',
        'Enter your DRMIS API token in the settings below before syncing.',
      );
      return;
    }
    if (!settings.drmisApiUrl) {
      Alert.alert('API URL Required', 'Enter the DRMIS API URL below.');
      return;
    }
    if (pendingCount === 0) {
      Alert.alert('Nothing to Sync', 'All field checks are already synced.');
      return;
    }
    setSyncing(true);
    try {
      const summary: SyncSummary = await syncAllToServer(
        settings.drmisApiUrl,
        settings.drmisApiToken,
      );
      await load();

      const failedDetails = summary.results
        .filter(r => !r.success)
        .map(r => `• ${r.id.slice(-8)}: ${r.error}`)
        .join('\n');

      if (summary.failed === 0) {
        Alert.alert(
          'Sync Complete ✓',
          `${summary.succeeded} record(s) synced to DRMIS.\n` +
            `Total DRMIS records created: ${summary.results.reduce((a, r) => a + r.recordsCreated, 0)}`,
        );
      } else {
        Alert.alert(
          `Sync Partial — ${summary.failed} failed`,
          `Succeeded: ${summary.succeeded}\nFailed: ${summary.failed}\n\n${failedDetails}\n\nFailed records will retry on next sync.`,
        );
      }
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.message ?? 'Could not reach the DRMIS server. Records saved locally.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'This will clear your cached credentials and assignments. You will need internet access to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const profile = auth?.profile;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Profile &amp; Sync Configuration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User profile card */}
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(profile.firstName?.[0] ?? profile.username[0]).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.username}
              </Text>
              <Text style={styles.profileUsername}>@{profile.username}</Text>
              <Text style={styles.profileRole}>
                {profile.isStaff
                  ? 'Staff — full access'
                  : profile.areaCouncils.length
                  ? profile.areaCouncils.join(', ')
                  : 'No council assigned'}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}
        {/* Sync status card */}
        <View style={styles.syncCard}>
          <View style={styles.syncRow}>
            <View style={styles.syncStat}>
              <Text style={styles.syncStatValue}>{totalCount}</Text>
              <Text style={styles.syncStatLabel}>Total Checks</Text>
            </View>
            <View style={styles.syncDivider} />
            <View style={styles.syncStat}>
              <Text style={[styles.syncStatValue, pendingCount > 0 && styles.pendingValue]}>
                {pendingCount}
              </Text>
              <Text style={styles.syncStatLabel}>Pending Sync</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
            )}
            <Text style={styles.syncButtonText}>
              {syncing ? 'Syncing…' : 'Sync to DRMIS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Assessor profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessor Profile</Text>
          <Text style={styles.sectionHint}>
            Pre-fill your details so each new check is auto-populated.
          </Text>

          <InputField
            label="Full Name"
            value={settings.assessorName}
            onChangeText={v => setSettings(s => ({ ...s, assessorName: v }))}
            placeholder="e.g. John Smith"
          />
          <InputField
            label="Assessor ID"
            value={settings.assessorId}
            onChangeText={v => setSettings(s => ({ ...s, assessorId: v }))}
            placeholder="e.g. VAN-ASS-001"
          />
          <InputField
            label="Team Lead (optional)"
            value={settings.teamLead}
            onChangeText={v => setSettings(s => ({ ...s, teamLead: v }))}
            placeholder="e.g. Jane Doe"
          />
        </View>

        {/* API configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DRMIS API</Text>
          <Text style={styles.sectionHint}>
            Configure the server endpoint for syncing field checks.
          </Text>

          <InputField
            label="API URL"
            value={settings.drmisApiUrl}
            onChangeText={v => setSettings(s => ({ ...s, drmisApiUrl: v }))}
            placeholder="https://drmis.gov.vu/api"
            autoCapitalize="none"
            keyboardType="url"
          />
          <InputField
            label="API Token"
            value={settings.drmisApiToken}
            onChangeText={v => setSettings(s => ({ ...s, drmisApiToken: v }))}
            placeholder="Bearer token"
            autoCapitalize="none"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
          )}
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DRMIS Field Checks v1.0</Text>
          <Text style={styles.footerText}>Vanuatu National Disaster Risk Management</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url' | 'email-address';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'words'}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    padding: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  profileUsername: { fontSize: 12, color: '#bfdbfe', marginTop: 1 },
  profileRole: { fontSize: 12, color: '#93c5fd', marginTop: 2 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
  content: { padding: 16, gap: 16 },
  syncCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    padding: 18,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncStat: { flex: 1, alignItems: 'center' },
  syncStatValue: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  pendingValue: { color: '#fbbf24' },
  syncStatLabel: { fontSize: 12, color: '#93c5fd', marginTop: 2 },
  syncDivider: { width: 1, height: 36, backgroundColor: '#3b82f6' },
  syncButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', paddingBottom: 8 },
  footerText: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
});
