import crypto from 'crypto';
import os from 'os';
import { execFile } from 'child_process';

export interface DeviceFingerprintV1 {
  cpu_id: string;
  volume_serial: string;
  mac_address: string;
  device_hash: string; // sha256 hex
  fingerprint_version: 1;
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function normalizePart(s: string): string {
  return (s || '')
    .toString()
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

async function runPowerShell(command: string): Promise<string> {
  // Windows-only; POS target is Windows.
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 8000, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(String(stdout || '').trim());
      },
    );
  });
}

async function getCpuId(): Promise<string> {
  try {
    const out = await runPowerShell(
      "(Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty ProcessorId)",
    );
    return normalizePart(out);
  } catch {
    return '';
  }
}

async function getVolumeSerial(systemDrive = 'C:'): Promise<string> {
  try {
    const out = await runPowerShell(
      `(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${systemDrive}'" | Select-Object -First 1 -ExpandProperty VolumeSerialNumber)`,
    );
    return normalizePart(out);
  } catch {
    return '';
  }
}

function getMacFromNode(): string {
  const ifaces = os.networkInterfaces();
  const macs: string[] = [];
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name] || []) {
      if (!i) continue;
      if (i.internal) continue;
      if (!i.mac || i.mac === '00:00:00:00:00:00') continue;
      macs.push(i.mac);
    }
  }
  macs.sort(); // stable choice
  return normalizePart(macs[0] || '');
}

async function getMacFromWmi(): Promise<string> {
  try {
    const out = await runPowerShell(
      "(Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true -and $_.MACAddress } | Select-Object -First 1 -ExpandProperty MACAddress)",
    );
    return normalizePart(out);
  } catch {
    return '';
  }
}

export async function getDeviceFingerprintV1(): Promise<DeviceFingerprintV1> {
  const [cpu_id, volume_serial, mac1] = await Promise.all([
    getCpuId(),
    getVolumeSerial(),
    getMacFromWmi(),
  ]);
  const mac_address = mac1 || getMacFromNode();

  // Requirement: combine CPU ID + Disk/Volume Serial + MAC and hash with SHA-256
  const raw = `${normalizePart(cpu_id)}|${normalizePart(volume_serial)}|${normalizePart(mac_address)}`;
  const device_hash = sha256Hex(raw);

  return {
    cpu_id: cpu_id || 'UNKNOWN',
    volume_serial: volume_serial || 'UNKNOWN',
    mac_address: mac_address || 'UNKNOWN',
    device_hash,
    fingerprint_version: 1,
  };
}

