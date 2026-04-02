import { dbHelpers, FieldCheck } from '../database';
import { drmisApi, DRMISFieldCheckSubmission } from '../api/drmis';

export interface SyncStatus {
  pending: number;
  syncing: boolean;
  lastSync?: Date;
  errors: string[];
}

class SyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private retryDelays = [1000, 5000, 15000, 60000, 300000]; // Progressive retry delays

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Start periodic sync when online
    this.startPeriodicSync();
  }

  private handleOnline(): void {
    console.log('Device is online - starting sync');
    this.isOnline = true;
    this.syncPendingFieldChecks();
  }

  private handleOffline(): void {
    console.log('Device is offline - pausing sync');
    this.isOnline = false;
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingFieldChecks();
      }
    }, 5 * 60 * 1000);
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const unsynced = await dbHelpers.getUnsyncedFieldChecks();
    const syncQueue = await dbHelpers.getSyncQueue();
    
    return {
      pending: unsynced.length,
      syncing: false, // TODO: Track actual sync state
      lastSync: await dbHelpers.getConfig('lastSyncTime'),
      errors: syncQueue
        .filter(item => item.lastError)
        .map(item => item.lastError!)
    };
  }

  async syncPendingFieldChecks(): Promise<void> {
    if (!this.isOnline || !drmisApi.isAuthenticated()) {
      console.log('Cannot sync: offline or not authenticated');
      return;
    }

    try {
      const unsyncedFieldChecks = await dbHelpers.getUnsyncedFieldChecks();
      
      if (unsyncedFieldChecks.length === 0) {
        console.log('No pending field checks to sync');
        return;
      }

      console.log(`Syncing ${unsyncedFieldChecks.length} field checks...`);

      // Convert to DRMIS format
      const submissions: DRMISFieldCheckSubmission[] = unsyncedFieldChecks.map(fc => ({
        uuid: fc.uuid,
        deviceId: fc.deviceId,
        timestamp: new Date(fc.timestamp).toISOString(),
        gpsCoordinates: fc.gpsCoordinates,
        assetType: fc.assetType,
        assetId: fc.assetId,
        assetName: fc.assetName,
        educationLevel: fc.educationLevel,
        constructionType: fc.constructionType,
        council: fc.council,
        province: fc.province,
        roofDamage: fc.roofDamage,
        wallDamage: fc.wallDamage,
        functionality: fc.functionality,
        immediateNeeds: fc.immediateNeeds,
        priority: fc.priority,
        photos: fc.photos,
        assessorName: fc.assessorName,
        assessorId: fc.assessorId,
        teamLead: fc.teamLead,
        weatherConditions: fc.weatherConditions,
        accessIssues: fc.accessIssues,
        additionalNotes: fc.additionalNotes
      }));

      // Submit to DRMIS
      const results = await drmisApi.syncFieldChecks(submissions);

      // Process results
      for (let i = 0; i < results.length; i++) {
        const fieldCheck = unsyncedFieldChecks[i];
        const result = results[i];

        if (result.success) {
          // Mark as synced
          await dbHelpers.markAsSynced(fieldCheck.id!);
          
          // Upload photos separately
          if (fieldCheck.photos.length > 0) {
            await this.uploadPhotos(fieldCheck.uuid, fieldCheck.photos);
          }
          
          console.log(`Successfully synced field check ${fieldCheck.uuid}`);
        } else {
          // Handle sync failure
          await this.handleSyncFailure(fieldCheck.id!, result.error || 'Unknown error');
          console.error(`Failed to sync field check ${fieldCheck.uuid}:`, result.error);
        }
      }

      // Update last sync time
      await dbHelpers.setConfig('lastSyncTime', new Date());
      
    } catch (error) {
      console.error('Sync process failed:', error);
    }
  }

  private async uploadPhotos(fieldCheckUuid: string, photos: FieldCheck['photos']): Promise<void> {
    for (const photo of photos) {
      try {
        const result = await drmisApi.uploadPhoto(fieldCheckUuid, photo.dataUrl, photo.type);
        if (!result.success) {
          console.error(`Failed to upload photo ${photo.id}:`, result.error);
        }
      } catch (error) {
        console.error(`Error uploading photo ${photo.id}:`, error);
      }
    }
  }

  private async handleSyncFailure(fieldCheckId: number, error: string): Promise<void> {
    const syncQueue = await dbHelpers.getSyncQueue();
    const queueItem = syncQueue.find(item => item.fieldCheckId === fieldCheckId);
    
    if (queueItem) {
      const retryCount = queueItem.retryCount + 1;
      const maxRetries = this.retryDelays.length;
      
      if (retryCount <= maxRetries) {
        // Update retry count and schedule retry
        await db.db.syncQueue.update(queueItem.id!, {
          retryCount,
          lastError: error,
          timestamp: Date.now()
        });

        // Schedule retry with progressive delay
        const delay = this.retryDelays[Math.min(retryCount - 1, maxRetries - 1)];
        setTimeout(() => {
          this.syncPendingFieldChecks();
        }, delay);
        
        console.log(`Scheduling retry ${retryCount}/${maxRetries} for field check ${fieldCheckId} in ${delay}ms`);
      } else {
        // Max retries reached - mark as failed
        await db.db.syncQueue.update(queueItem.id!, {
          lastError: `Max retries reached. Last error: ${error}`
        });
        console.error(`Max retries reached for field check ${fieldCheckId}`);
      }
    }
  }

  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync: device is offline');
    }
    
    if (!drmisApi.isAuthenticated()) {
      throw new Error('Cannot sync: not authenticated');
    }

    await this.syncPendingFieldChecks();
  }

  async clearFailedSyncs(): Promise<void> {
    const syncQueue = await dbHelpers.getSyncQueue();
    const failedItems = syncQueue.filter(item => item.lastError && item.retryCount >= this.retryDelays.length);
    
    for (const item of failedItems) {
      await db.db.syncQueue.delete(item.id!);
      // Optionally delete the field check or mark it as needs manual review
    }
    
    console.log(`Cleared ${failedItems.length} failed sync items`);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

export const syncManager = new SyncManager();
