/**
 * Authentication service for DRMIS Field Checks mobile app.
 *
 * Flow:
 *   First login (online)  → POST /api-token-auth/ → fetch profile + assignments
 *                           → cache token, password hash, profile, assignments
 *   Subsequent (offline)  → compare SHA-256(password) vs stored hash
 *                           → load cached profile + assignments
 *   Subsequent (online)   → same as first login (refreshes cache)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assignment, StoredAuth, UserProfile } from './types';

const AUTH_KEY = 'drmis_auth';
const ASSIGNMENTS_KEY = 'drmis_assignments';

// ─── Simple SHA-256 (pure JS, no native module needed) ───────────────────────
// Uses the SubtleCrypto Web API which is available in Hermes / React Native.
async function sha256hex(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback: deterministic but not cryptographic — only used when SubtleCrypto unavailable
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export async function getStoredAuth(): Promise<StoredAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

async function saveAuth(auth: StoredAuth): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_KEY, ASSIGNMENTS_KEY]);
}

export async function getStoredAssignments(): Promise<Assignment[]> {
  try {
    const raw = await AsyncStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? (JSON.parse(raw) as Assignment[]) : [];
  } catch {
    return [];
  }
}

async function saveAssignments(assignments: Assignment[]): Promise<void> {
  await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

// ─── DRMIS API calls ──────────────────────────────────────────────────────────

async function fetchToken(
  apiUrl: string,
  username: string,
  password: string,
): Promise<string> {
  const url = `${apiUrl.replace(/\/$/, '')}/api-token-auth/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.non_field_errors?.[0] ?? `Login failed (${res.status})`);
  }
  const data = await res.json();
  return data.token as string;
}

async function fetchProfile(apiUrl: string, token: string): Promise<UserProfile> {
  const url = `${apiUrl.replace(/\/$/, '')}/api/v1/field-check/me/`;
  const res = await fetch(url, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error(`Could not fetch profile (${res.status})`);
  const data = await res.json();
  return {
    id: data.id,
    username: data.username,
    email: data.email ?? '',
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    isStaff: data.is_staff ?? false,
    areaCouncils: data.area_councils ?? [],
    provinces: data.provinces ?? [],
  };
}

async function fetchAssignments(apiUrl: string, token: string): Promise<Assignment[]> {
  const url = `${apiUrl.replace(/\/$/, '')}/api/v1/field-check/assignments/`;
  const res = await fetch(url, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error(`Could not fetch assignments (${res.status})`);
  const data: any[] = await res.json();
  return data.map(d => ({
    id: d.id,
    tabularItemId: d.tabular_item_id,
    datasetName: d.dataset_name,
    sectorFamily: d.sector_family,
    councilName: d.council_name,
    provinceName: d.province_name,
    priority: d.priority,
    adminNotes: d.admin_notes ?? '',
    status: d.status,
    estimatedValue: d.estimated_value ?? null,
    intensity: d.intensity ?? null,
    eventName: d.event_name ?? '',
    eventSlug: d.event_slug ?? '',
    assignedAt: d.assigned_at,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  profile?: UserProfile;
  assignments?: Assignment[];
  error?: string;
  /** true when login succeeded using cached credentials (no network) */
  offline?: boolean;
}

/**
 * Attempt online login. On success caches token, password hash, profile, and assignments.
 */
export async function loginOnline(
  apiUrl: string,
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    const token = await fetchToken(apiUrl, username, password);
    const [profile, assignments, passwordHash] = await Promise.all([
      fetchProfile(apiUrl, token),
      fetchAssignments(apiUrl, token),
      sha256hex(password),
    ]);
    const auth: StoredAuth = {
      token,
      passwordHash,
      username,
      profile,
      tokenObtainedAt: Date.now(),
    };
    await saveAuth(auth);
    await saveAssignments(assignments);
    return { success: true, profile, assignments };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Login failed' };
  }
}

/**
 * Attempt offline login using cached credentials.
 * Verifies username + password hash against stored values.
 */
export async function loginOffline(
  username: string,
  password: string,
): Promise<LoginResult> {
  const stored = await getStoredAuth();
  if (!stored) {
    return {
      success: false,
      error: 'No offline credentials found. Connect to the internet and log in first.',
    };
  }
  if (stored.username.toLowerCase() !== username.toLowerCase()) {
    return { success: false, error: 'Incorrect username or password.' };
  }
  const hash = await sha256hex(password);
  if (hash !== stored.passwordHash) {
    return { success: false, error: 'Incorrect username or password.' };
  }
  const assignments = await getStoredAssignments();
  return {
    success: true,
    profile: stored.profile,
    assignments,
    offline: true,
  };
}

/**
 * Smart login: tries online first; falls back to offline if no network.
 */
export async function login(
  apiUrl: string,
  username: string,
  password: string,
  isOnline: boolean,
): Promise<LoginResult> {
  if (isOnline) {
    const result = await loginOnline(apiUrl, username, password);
    // If online login fails with a network error, try offline fallback
    if (!result.success && result.error?.includes('fetch')) {
      return loginOffline(username, password);
    }
    return result;
  }
  return loginOffline(username, password);
}

/**
 * Refresh assignments from server (call when back online after offline session).
 */
export async function refreshAssignments(
  apiUrl: string,
  token: string,
): Promise<Assignment[]> {
  const assignments = await fetchAssignments(apiUrl, token);
  await saveAssignments(assignments);
  return assignments;
}

/**
 * Mark an assignment completed locally (optimistic update before sync).
 */
export async function markAssignmentLocalCheckId(
  assignmentId: number,
  localCheckId: string,
): Promise<void> {
  const assignments = await getStoredAssignments();
  const updated = assignments.map(a =>
    a.id === assignmentId
      ? { ...a, status: 'in_progress' as const, localCheckId }
      : a,
  );
  await saveAssignments(updated);
}
