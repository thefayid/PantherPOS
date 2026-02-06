export type LicenseType = 'trial' | 'yearly' | 'lifetime';

export interface LicensePayloadV1 {
  /**
   * Schema/versioning for forward compatibility.
   * Keep stable once shipped.
   */
  license_version: 1;

  customer_name: string;
  device_hash: string; // sha256 hex
  license_type: LicenseType;

  /**
   * ISO 8601 UTC string (e.g. 2026-12-31T23:59:59Z).
   * For lifetime licenses you can set a far-future date.
   */
  expiry_date: string;

  /**
   * Feature flags to enable in-app.
   * Keep as a list (not an object) to avoid signing ambiguity.
   */
  enabled_features: string[];

  /**
   * Optional metadata for operational use (also signed).
   */
  issued_at?: string; // ISO UTC
  license_id?: string; // UUID/opaque
  fingerprint_version?: 1;
  device_hash_alg?: 'sha256';
}

export interface LicenseFileV1 {
  payload: LicensePayloadV1;
  /**
   * Base64 signature over canonicalized `payload` bytes.
   * Algorithm: RSA-2048 PSS, SHA-256, saltLength=32.
   */
  signature: string;
  /**
   * Optional key id if you later rotate signing keys.
   */
  kid?: string;
}

export type LicenseStatus =
  | { ok: true; payload: LicensePayloadV1 }
  | {
      ok: false;
      reason:
        | 'NO_LICENSE'
        | 'INVALID_FORMAT'
        | 'SIGNATURE_INVALID'
        | 'DEVICE_MISMATCH'
        | 'EXPIRED'
        | 'CLOCK_ROLLBACK';
      details?: string;
    };

