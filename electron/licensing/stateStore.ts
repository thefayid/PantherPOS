import fs from 'fs';
import path from 'path';
import { app, safeStorage } from 'electron';

export interface LicenseStateV1 {
  state_version: 1;
  /**
   * Highest observed UTC time (never decreases).
   */
  max_seen_utc: string; // ISO
  /**
   * Last observed UTC time.
   */
  last_seen_utc: string; // ISO
  /**
   * License id (if present) to bind state to a specific license.
   */
  license_id?: string;
}

function getStorePaths() {
  const dir = app.getPath('userData');
  return {
    dir,
    licenseBlobPath: path.join(dir, 'license.blob'),
    stateBlobPath: path.join(dir, 'license_state.blob'),
  };
}

function atomicWriteFile(filePath: string, data: Buffer) {
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}

export function loadEncryptedStringBlob(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const blob = fs.readFileSync(filePath);
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(blob);
  } catch {
    return null;
  }
}

export function saveEncryptedStringBlob(filePath: string, plaintext: string) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS encryption is not available (safeStorage).');
  }
  const blob = safeStorage.encryptString(plaintext);
  atomicWriteFile(filePath, blob);
}

export function loadLicenseFileText(): string | null {
  const { licenseBlobPath } = getStorePaths();
  return loadEncryptedStringBlob(licenseBlobPath);
}

export function saveLicenseFileText(licenseJsonText: string) {
  const { dir, licenseBlobPath } = getStorePaths();
  fs.mkdirSync(dir, { recursive: true });
  saveEncryptedStringBlob(licenseBlobPath, licenseJsonText);
}

export function loadState(): LicenseStateV1 | null {
  const { stateBlobPath } = getStorePaths();
  const text = loadEncryptedStringBlob(stateBlobPath);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.state_version !== 1) return null;
    return parsed as LicenseStateV1;
  } catch {
    return null;
  }
}

export function saveState(state: LicenseStateV1) {
  const { dir, stateBlobPath } = getStorePaths();
  fs.mkdirSync(dir, { recursive: true });
  saveEncryptedStringBlob(stateBlobPath, JSON.stringify(state));
}

