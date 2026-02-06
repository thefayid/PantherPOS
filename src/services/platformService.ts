export type Platform = 'electron' | 'capacitor' | 'web';

export const platformService = {
    getPlatform: (): Platform => {
        // Hard check for Electron
        const isElectron = window.electronAPI && navigator.userAgent.includes('Electron');

        if (isElectron) {
            return 'electron';
        }

        // Capacitor check
        if ((window as any).Capacitor) {
            return 'capacitor';
        }

        return 'web';
    },

    isElectron: () => platformService.getPlatform() === 'electron',
    isCapacitor: () => platformService.getPlatform() === 'capacitor',
    isWeb: () => platformService.getPlatform() === 'web',
    isNative: () => platformService.isElectron() || platformService.isCapacitor(),

    getServerIp: async (): Promise<string> => {
        if (platformService.isElectron()) {
            try {
                // Fetch the IP from our own local server
                const response = await fetch('http://localhost:3000/api/ip');
                const data = await response.json();
                if (data && data.ip) {
                    // If it's localhost, we might want to warn or let the user know, 
                    // but usually the server tries to find a real IP.
                    return data.ip;
                }
                return 'localhost';
            } catch (e) {
                console.error("Failed to get server IP", e);
                return 'localhost';
            }
        }
        return window.location.hostname;
    }
};
