import { dbStorage } from './dbStorage';
import { databaseService } from './databaseService';
import { eventBus } from '../utils/EventBus';

export interface CloudConfig {
    serverUrl: string;
    apiKey: string;
    autoSync: boolean;
    syncInterval: number; // in minutes
    lastSync?: string;
}

const CONFIG_KEY = 'cloud_sync_config';

export const cloudService = {
    getConfig: (): CloudConfig => {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : {
            serverUrl: '',
            apiKey: '',
            autoSync: false,
            syncInterval: 60
        };
    },

    saveConfig: (config: CloudConfig) => {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        // If auto-sync changed, we might need to restart the timer (handled by App.tsx or similar usually, 
        // or we can expose a method to restart it).
        // For simplicity, we'll let the polling mechanism read the latest config.
    },

    // --- SYNC OPERATIONS ---

    uploadData: async (): Promise<{ success: boolean; message: string }> => {
        const config = cloudService.getConfig();
        if (!config.serverUrl) {
            return { success: false, message: 'Server URL not configured' };
        }

        console.log('[Cloud] Starting Upload to', config.serverUrl);
        eventBus.emit('SYNC_STATUS', 'SYNCING');

        try {
            // SIMULATION: Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In real world: Fetch unsynced data from DB
            // const pendingSales = await databaseService.query("SELECT * FROM bills WHERE synced = 0");

            // Mock Success
            const success = true;

            if (success) {
                const now = new Date().toISOString();
                cloudService.saveConfig({ ...config, lastSync: now });
                eventBus.emit('SYNC_STATUS', 'ONLINE');
                eventBus.emit('LAST_SYNC_UPDATE', now);
                return { success: true, message: 'Data uploaded successfully' };
            } else {
                throw new Error('Upload failed');
            }

        } catch (e: any) {
            console.error('[Cloud] Upload Error:', e);
            eventBus.emit('SYNC_STATUS', 'ERROR');
            return { success: false, message: e.message || 'Upload failed' };
        }
    },

    downloadData: async (): Promise<{ success: boolean; message: string }> => {
        const config = cloudService.getConfig();
        if (!config.serverUrl) {
            return { success: false, message: 'Server URL not configured' };
        }

        console.log('[Cloud] Starting Download from', config.serverUrl);
        eventBus.emit('SYNC_STATUS', 'SYNCING');

        try {
            // SIMULATION
            await new Promise(resolve => setTimeout(resolve, 2000));

            const now = new Date().toISOString();
            cloudService.saveConfig({ ...config, lastSync: now });
            eventBus.emit('SYNC_STATUS', 'ONLINE');
            eventBus.emit('LAST_SYNC_UPDATE', now);

            return { success: true, message: 'Data downloaded successfully' };

        } catch (e: any) {
            console.error('[Cloud] Download Error:', e);
            eventBus.emit('SYNC_STATUS', 'ERROR');
            return { success: false, message: e.message || 'Download failed' };
        }
    },

    // Check connection / heartbeat
    checkConnection: async (): Promise<boolean> => {
        // Should ping the server
        return true;
    }
};
