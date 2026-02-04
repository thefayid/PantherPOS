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
    isNative: () => platformService.isElectron() || platformService.isCapacitor()
};
