import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { getStoredAuth } from '@/lib/auth';
import { StoredAuth } from '@/lib/types';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [auth, setAuth] = useState<StoredAuth | null | undefined>(undefined);

  useEffect(() => {
    // Re-read auth from storage every time the active route segment changes.
    // This ensures that after a successful login (which writes to AsyncStorage
    // then calls router.replace), we see the freshly-saved token before
    // deciding whether to redirect — avoiding the loop where the guard sees
    // stale null auth and immediately bounces back to /login.
    let cancelled = false;

    async function checkAndNavigate() {
      const stored = await getStoredAuth();
      if (cancelled) return;

      setAuth(stored);

      const onLogin = segments[0] === 'login';
      if (!stored && !onLogin) {
        router.replace('/login');
      } else if (stored && onLogin) {
        router.replace('/(tabs)');
      }
    }

    checkAndNavigate();
    return () => { cancelled = true; };
  }, [segments]);

  // Splash while determining auth state
  if (auth === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="new-check"
          options={{
            title: 'New Field Check',
            headerStyle: { backgroundColor: '#1d4ed8' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="check/[id]"
          options={{
            title: 'Field Check',
            headerStyle: { backgroundColor: '#1d4ed8' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
