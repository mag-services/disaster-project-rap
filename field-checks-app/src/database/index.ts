import Dexie, { Table } from 'dexie';

export interface FieldCheck {
  id?: number;
  uuid: string;
  deviceId: string;
  timestamp: number;
  synced: boolean;
  syncError?: string;
  
  // Location data
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
  
  // Asset identification
  assetType: 'education' | 'health' | 'shelter' | 'telecom' | 'energy' | 'wash' | 'food_security' | 'logistics';
  assetId: string;
  assetName: string;
  educationLevel?: 'ecce' | 'primary' | 'secondary';
  constructionType: 'wood' | 'concrete' | 'metal' | 'mixed';
  
  // Council information
  council: string;
  province: string;
  
  // Damage assessment (component-based)
  roofDamage: {
    condition: 'intact' | 'minor' | 'major' | 'destroyed';
    percentage: number;
    notes: string;
  };
  
  wallDamage: {
    condition: 'intact' | 'minor' | 'major' | 'destroyed';
    percentage: number;
    notes: string;
  };
  
  // Overall assessment
  functionality: 'usable' | 'partially_usable' | 'not_usable';
  immediateNeeds: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Media
  photos: {
    id: string;
    type: 'roof' | 'wall' | 'overall' | 'interior';
    dataUrl: string;
    timestamp: number;
    caption?: string;
  }[];
  
  // Assessor information
  assessorName: string;
  assessorId: string;
  teamLead?: string;
  
  // Metadata
  weatherConditions: string;
  accessIssues: string;
  additionalNotes: string;
}

export interface SyncQueue {
  id?: number;
  fieldCheckId: number;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface AppConfig {
  id?: number;
  key: string;
  value: any;
  lastUpdated: number;
}

class Database extends Dexie {
  fieldChecks!: Table<FieldCheck>;
  syncQueue!: Table<SyncQueue>;
  appConfig!: Table<AppConfig>;

  constructor() {
    super('DRMISFieldChecks');
    
    this.version(1).stores({
      fieldChecks: '++id, uuid, deviceId, timestamp, synced, council, province, assetType, priority',
      syncQueue: '++id, fieldCheckId, action, timestamp, retryCount',
      appConfig: '++id, key, value, lastUpdated'
    });
  }
}

export const db = new Database();

// Database helper functions
export const dbHelpers = {
  async addFieldCheck(fieldCheck: Omit<FieldCheck, 'id'>): Promise<number> {
    const id = await db.fieldChecks.add({
      ...fieldCheck,
      synced: false
    });
    
    // Add to sync queue
    await db.syncQueue.add({
      fieldCheckId: id,
      action: 'create',
      timestamp: Date.now(),
      retryCount: 0
    });
    
    return id;
  },
  
  async updateFieldCheck(id: number, updates: Partial<FieldCheck>): Promise<void> {
    await db.fieldChecks.update(id, {
      ...updates,
      synced: false
    });
    
    // Add to sync queue if not already there
    const existing = await db.syncQueue.where('fieldCheckId').equals(id).first();
    if (!existing) {
      await db.syncQueue.add({
        fieldCheckId: id,
        action: 'update',
        timestamp: Date.now(),
        retryCount: 0
      });
    }
  },
  
  async getUnsyncedFieldChecks(): Promise<FieldCheck[]> {
    return await db.fieldChecks.where('synced').equals(false).toArray();
  },
  
  async getSyncQueue(): Promise<SyncQueue[]> {
    return await db.syncQueue.toArray();
  },
  
  async markAsSynced(fieldCheckId: number): Promise<void> {
    await db.fieldChecks.update(fieldCheckId, { synced: true });
    await db.syncQueue.where('fieldCheckId').equals(fieldCheckId).delete();
  },
  
  async getConfig(key: string): Promise<any> {
    const config = await db.appConfig.where('key').equals(key).first();
    return config?.value;
  },
  
  async setConfig(key: string, value: any): Promise<void> {
    const existing = await db.appConfig.where('key').equals(key).first();
    if (existing) {
      await db.appConfig.update(existing.id!, {
        value,
        lastUpdated: Date.now()
      });
    } else {
      await db.appConfig.add({
        key,
        value,
        lastUpdated: Date.now()
      });
    }
  }
};
