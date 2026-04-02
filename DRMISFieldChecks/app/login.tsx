import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { login, getStoredAuth } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState('https://drmis.gov.vu/api');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasOfflineCredentials, setHasOfflineCredentials] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function init() {
      // Check network status
      const net = await NetInfo.fetch();
      setIsOnline(!!net.isConnected);

      // Check if already authenticated
      const stored = await getStoredAuth();
      if (stored) {
        setHasOfflineCredentials(true);
        setUsername(stored.username);
        // If online, attempt silent token refresh; if offline load cached session
        if (net.isConnected) {
          // Let user log in manually to refresh token
        }
      }

      // Pre-fill API URL from settings
      const settings = await getSettings();
      if (settings.drmisApiUrl) setApiUrl(settings.drmisApiUrl);

      setCheckingAuth(false);
    }
    init();

    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return unsub;
  }, []);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Required', 'Please enter your username.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }
    if (!apiUrl.trim()) {
      Alert.alert('Required', 'Please enter the DRMIS API URL.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(apiUrl.trim(), username.trim(), password, isOnline);

      if (!result.success) {
        Alert.alert('Login Failed', result.error ?? 'Invalid credentials.');
        return;
      }

      // Save API URL to settings for future use
      await saveSettings({ drmisApiUrl: apiUrl.trim(), drmisApiToken: '' });

      if (result.offline) {
        Alert.alert(
          'Offline Mode',
          'Signed in using cached credentials. Assignments loaded from last sync.',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }],
        );
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#ffffff" />
          </View>
          <Text style={styles.appName}>DRMIS Field Checks</Text>
          <Text style={styles.appSub}>Vanuatu National Disaster Risk Management</Text>
        </View>

        {/* Offline banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#92400e" />
            <Text style={styles.offlineText}>
              {hasOfflineCredentials
                ? 'Offline — sign in with your cached credentials'
                : 'No internet connection. Connect to log in for the first time.'}
            </Text>
          </View>
        )}

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>
            {isOnline
              ? 'Use your DRMIS account credentials.'
              : hasOfflineCredentials
              ? 'Enter your credentials to access cached data.'
              : 'Internet required for first-time login.'}
          </Text>

          {/* API URL — only shown when online (no need to change offline) */}
          {isOnline && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DRMIS Server URL</Text>
              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://drmis.gov.vu/api"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. john.smith"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!(!isOnline && !hasOfflineCredentials)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!(!isOnline && !hasOfflineCredentials)}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginBtn,
              (loading || (!isOnline && !hasOfflineCredentials)) && styles.loginBtnDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading || (!isOnline && !hasOfflineCredentials)}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="log-in-outline" size={20} color="#ffffff" />
            )}
            <Text style={styles.loginBtnText}>
              {loading ? 'Signing in…' : isOnline ? 'Sign In' : 'Sign In (Offline)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info footer */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
          <Text style={styles.infoText}>
            Accounts are created by your DRMIS administrator. Contact them if you
            don't have access.
          </Text>
        </View>

        <Text style={styles.version}>v1.0 · DRMIS Field Checks</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', gap: 16 },

  header: { alignItems: 'center', paddingVertical: 24 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  appSub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  offlineText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },

  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, gap: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 18 },

  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeBtn: {
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#d1d5db',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#f9fafb',
  },

  loginBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.45 },
  loginBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  infoBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: '#6b7280', lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 11, color: '#9ca3af' },
});
