import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, FieldCheck } from './types';

const FIELD_CHECKS_KEY = 'drmis_field_checks';
const SETTINGS_KEY = 'drmis_settings';

// ─── DRMIS Sync ──────────────────────────────────────────────────────────────

export interface SyncResult {
  id: string;
  success: boolean;
  recordsCreated: number;
  itemsMatched: { tabular_item_id: number; dataset: string; status: string }[];
  error?: string;
}

export interface SyncSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  results: SyncResult[];
}

/**
 * Sync all unsynced field checks to the DRMIS server.
 * Calls POST /api/v1/field-check/records/mobile/ for each pending check.
 * If the check was created from an assignment, also PATCHes the assignment to completed.
 */
export async function syncAllToServer(
  apiUrl: string,
  apiToken: string,
): Promise<SyncSummary> {
  const checks = await getAllFieldChecks();
  const pending = checks.filter(c => !c.synced);
  const results: SyncResult[] = [];

  for (const check of pending) {
    const result = await syncOneToServer(check, apiUrl, apiToken);
    results.push(result);
    if (result.success) {
      await updateFieldCheck(check.id, { synced: true, syncedAt: Date.now() });
      // If linked to an assignment, mark it completed on the server
      if (check.assignmentId) {
        await patchAssignmentStatus(check.assignmentId, 'completed', apiUrl, apiToken);
      }
    }
  }

  return {
    attempted: pending.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

async function patchAssignmentStatus(
  assignmentId: number,
  newStatus: string,
  apiUrl: string,
  apiToken: string,
): Promise<void> {
  const url = `${apiUrl.replace(/\/$/, '')}/api/v1/field-check/assignments/${assignmentId}/`;
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    // Non-critical — assignment status update failure doesn't block the check sync
  }
}

async function syncOneToServer(
  check: FieldCheck,
  apiUrl: string,
  apiToken: string,
): Promise<SyncResult> {
  const baseUrl = apiUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/api/v1/field-check/records/mobile/`;

  const payload = {
    mobile_id: check.id,
    asset_type: check.assetType,
    asset_id: check.assetId,
    asset_name: check.assetName,
    province: check.province,
    council: check.council,
    roof_damage_condition: check.roofDamage.condition,
    roof_damage_percentage: check.roofDamage.percentage,
    roof_damage_notes: check.roofDamage.notes,
    wall_damage_condition: check.wallDamage.condition,
    wall_damage_percentage: check.wallDamage.percentage,
    wall_damage_notes: check.wallDamage.notes,
    functionality: check.functionality,
    priority: check.priority,
    immediate_needs: check.immediateNeeds,
    gps_latitude: check.gpsCoordinates.latitude || null,
    gps_longitude: check.gpsCoordinates.longitude || null,
    gps_accuracy: check.gpsCoordinates.accuracy || null,
    assessor_name: check.assessorName,
    assessor_id: check.assessorId,
    team_lead: check.teamLead ?? '',
    weather_conditions: check.weatherConditions,
    access_issues: check.accessIssues,
    notes: check.additionalNotes,
    observed_at: new Date(check.timestamp).toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const json = await response.json();

    if (response.status === 201 || response.status === 200) {
      return {
        id: check.id,
        success: true,
        recordsCreated: json.records_created ?? 0,
        itemsMatched: json.items_matched ?? [],
      };
    }

    return {
      id: check.id,
      success: false,
      recordsCreated: 0,
      itemsMatched: [],
      error: json.detail ?? `HTTP ${response.status}`,
    };
  } catch (err: any) {
    return {
      id: check.id,
      success: false,
      recordsCreated: 0,
      itemsMatched: [],
      error: err?.message ?? 'Network error',
    };
  }
}

function generateId(): string {
  return `fc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function getAllFieldChecks(): Promise<FieldCheck[]> {
  try {
    const raw = await AsyncStorage.getItem(FIELD_CHECKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FieldCheck[];
  } catch {
    return [];
  }
}

export async function getFieldCheck(id: string): Promise<FieldCheck | null> {
  const checks = await getAllFieldChecks();
  return checks.find(c => c.id === id) ?? null;
}

export async function saveFieldCheck(data: Omit<FieldCheck, 'id' | 'deviceId' | 'timestamp' | 'synced' | 'syncedAt'>): Promise<FieldCheck> {
  const checks = await getAllFieldChecks();
  const newCheck: FieldCheck = {
    ...data,
    id: generateId(),
    deviceId: 'device-001',
    timestamp: Date.now(),
    synced: false,
  };
  checks.unshift(newCheck);
  await AsyncStorage.setItem(FIELD_CHECKS_KEY, JSON.stringify(checks));
  return newCheck;
}

export async function updateFieldCheck(id: string, updates: Partial<FieldCheck>): Promise<FieldCheck | null> {
  const checks = await getAllFieldChecks();
  const idx = checks.findIndex(c => c.id === id);
  if (idx === -1) return null;
  checks[idx] = { ...checks[idx], ...updates, synced: false };
  await AsyncStorage.setItem(FIELD_CHECKS_KEY, JSON.stringify(checks));
  return checks[idx];
}

export async function deleteFieldCheck(id: string): Promise<void> {
  const checks = await getAllFieldChecks();
  const filtered = checks.filter(c => c.id !== id);
  await AsyncStorage.setItem(FIELD_CHECKS_KEY, JSON.stringify(filtered));
}

export async function getPendingSyncCount(): Promise<number> {
  const checks = await getAllFieldChecks();
  return checks.filter(c => !c.synced).length;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

function defaultSettings(): AppSettings {
  return {
    assessorName: '',
    assessorId: '',
    teamLead: '',
    drmisApiUrl: 'https://drmis.gov.vu/api',
    drmisApiToken: '',
  };
}
