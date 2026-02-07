// GST Service - Utilities for GSTIN validation and GST compliance

interface StateMapping {
    code: string;
    name: string;
}

const STATE_CODES: StateMapping[] = [
    { code: '01', name: 'Jammu and Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '25', name: 'Daman and Diu' },
    { code: '26', name: 'Dadra and Nagar Haveli' },
    { code: '27', name: 'Maharashtra' },
    { code: '28', name: 'Andhra Pradesh' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman and Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh (New)' },
    { code: '38', name: 'Ladakh' }
];

export const gstService = {
    /**
     * Validate GSTIN format
     * Format: 22AAAAA0000A1Z5 (15 characters)
     * - Positions 1-2: State Code (01-38)
     * - Positions 3-12: PAN (10 characters)
     * - Position 13: Entity number (1-9, A-Z)
     * - Position 14: Z (default)
     * - Position 15: Checksum digit
     */
    validateGSTIN: (gstin: string): { valid: boolean; error?: string } => {
        if (!gstin) {
            return { valid: false, error: 'GSTIN is required' };
        }

        // Remove spaces and convert to uppercase
        const cleanGSTIN = gstin.replace(/\s/g, '').toUpperCase();

        // Check length
        if (cleanGSTIN.length !== 15) {
            return { valid: false, error: 'GSTIN must be 15 characters' };
        }

        // Check format: 2 digits + 10 alphanumeric (PAN) + 1 alphanumeric + Z + 1 alphanumeric
        const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinPattern.test(cleanGSTIN)) {
            return { valid: false, error: 'Invalid GSTIN format' };
        }

        // Validate state code
        const stateCode = cleanGSTIN.substring(0, 2);
        const validState = STATE_CODES.find(s => s.code === stateCode);
        if (!validState) {
            return { valid: false, error: 'Invalid state code in GSTIN' };
        }

        // Validate PAN format (positions 3-12)
        const pan = cleanGSTIN.substring(2, 12);
        const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panPattern.test(pan)) {
            return { valid: false, error: 'Invalid PAN in GSTIN' };
        }

        return { valid: true };
    },

    /**
     * Extract state code from GSTIN
     */
    extractStateCodeFromGSTIN: (gstin: string): string | null => {
        if (!gstin || gstin.length < 2) return null;
        const cleanGSTIN = gstin.replace(/\s/g, '').toUpperCase();
        return cleanGSTIN.substring(0, 2);
    },

    /**
     * Extract state name from GSTIN
     */
    extractStateFromGSTIN: (gstin: string): string | null => {
        const stateCode = gstService.extractStateCodeFromGSTIN(gstin);
        if (!stateCode) return null;

        const state = STATE_CODES.find(s => s.code === stateCode);
        return state ? state.name : null;
    },

    /**
     * Get state name from state code
     */
    getStateName: (stateCode: string): string | null => {
        const state = STATE_CODES.find(s => s.code === stateCode);
        return state ? state.name : null;
    },

    /**
     * Get state code from state name
     */
    getStateCode: (stateName: string): string | null => {
        const state = STATE_CODES.find(s =>
            s.name.toLowerCase() === stateName.toLowerCase()
        );
        return state ? state.code : null;
    },

    /**
     * Get all states for dropdown
     */
    getAllStates: (): StateMapping[] => {
        return STATE_CODES;
    },

    /**
     * Check if customer is B2B (has valid GSTIN)
     */
    isB2B: (customerGSTIN?: string): boolean => {
        if (!customerGSTIN) return false;
        const validation = gstService.validateGSTIN(customerGSTIN);
        return validation.valid;
    },

    /**
     * Format GSTIN for display (add spaces for readability)
     * Example: 22AAAAA0000A1Z5 -> 22 AAAAA0000A 1Z5
     */
    formatGSTIN: (gstin: string): string => {
        if (!gstin) return '';
        const clean = gstin.replace(/\s/g, '').toUpperCase();
        if (clean.length !== 15) return gstin;

        return `${clean.substring(0, 2)} ${clean.substring(2, 12)} ${clean.substring(12, 15)}`;
    },

    /**
     * Determine if transaction is inter-state
     */
    isInterState: (companyStateCode: string, customerStateCode: string): boolean => {
        if (!companyStateCode || !customerStateCode) return false;
        return companyStateCode !== customerStateCode;
    }
};
