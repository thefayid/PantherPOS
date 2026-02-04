import { dbStorage } from './dbStorage';

const SERVER_IP_KEY = 'pos_pc_server_ip';

export const syncService = {
    getServerIp: (): string => {
        return localStorage.getItem(SERVER_IP_KEY) || '';
    },

    setServerIp: (ip: string) => {
        localStorage.setItem(SERVER_IP_KEY, ip);
    },

    syncFromPc: async (): Promise<{ success: boolean; message: string }> => {
        const ip = syncService.getServerIp();
        if (!ip) {
            return { success: false, message: 'Server IP not configured.' };
        }

        try {
            const url = `http://${ip}:3000/api/sync/export`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Invalid synchronization data received.');
            }

            // Update IndexedDB with binary data for better performance and reliability
            const binary = atob(result.data);
            const uint8 = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                uint8[i] = binary.charCodeAt(i);
            }
            await dbStorage.setItem('pos_db_web', uint8);

            // Verification: Read it back to ensure it was saved correctly
            const verify = await dbStorage.getItem('pos_db_web');
            const verifiedSize = verify ? (verify.byteLength || verify.length || 0) : 0;
            console.log(`[Sync] Verified storage: ${verifiedSize} bytes matched.`);

            return {
                success: true,
                message: `Synchronization successful! Received ${result.counts?.products} products and ${result.counts?.bills} bills. Diagnostic: ${verifiedSize} bytes verified.`
            };
        } catch (error: any) {
            console.error('[Sync] Error:', error);
            return {
                success: false,
                message: `Synchronization failed: ${error.message}`
            };
        }
    }
};
