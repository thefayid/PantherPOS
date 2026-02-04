import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { platformService } from './platformService';

export const barcodeService = {
    /**
     * Mobile Specific: Starts a full-screen camera scanner
     */
    scanMobile: async (): Promise<string | null> => {
        if (!platformService.isCapacitor()) {
            console.warn('[BarcodeService] Scan mobile called on non-capacitor platform');
            return null;
        }

        try {
            // Check permissions
            const { camera } = await BarcodeScanner.checkPermissions();
            if (camera !== 'granted') {
                await BarcodeScanner.requestPermissions();
            }

            // Hide webview background and start scanning
            document.querySelector('body')?.classList.add('barcode-scanner-active');

            const { barcodes } = await (BarcodeScanner.startScan({
                formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.QrCode, BarcodeFormat.Code128]
            }) as any);

            document.querySelector('body')?.classList.remove('barcode-scanner-active');
            return barcodes && barcodes.length > 0 ? barcodes[0].displayValue : null;
        } catch (error) {
            console.error('[BarcodeService] Mobile scan error:', error);
            document.querySelector('body')?.classList.remove('barcode-scanner-active');
            return null;
        }
    },

    /**
     * Stop scanning (if needed for cancel button)
     */
    stopMobileScan: async () => {
        if (platformService.isCapacitor()) {
            await BarcodeScanner.stopScan();
            document.querySelector('body')?.classList.remove('barcode-scanner-active');
        }
    }
};
