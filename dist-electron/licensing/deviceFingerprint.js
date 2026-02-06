"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceFingerprintV1 = getDeviceFingerprintV1;
const crypto_1 = __importDefault(require("crypto"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
function sha256Hex(input) {
    return crypto_1.default.createHash('sha256').update(input, 'utf8').digest('hex');
}
function normalizePart(s) {
    return (s || '')
        .toString()
        .trim()
        .replace(/\s+/g, '')
        .toUpperCase();
}
async function runPowerShell(command) {
    // Windows-only; POS target is Windows.
    return new Promise((resolve, reject) => {
        (0, child_process_1.execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command], { windowsHide: true, timeout: 8000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            if (err)
                return reject(new Error(stderr || err.message));
            resolve(String(stdout || '').trim());
        });
    });
}
async function getCpuId() {
    try {
        const out = await runPowerShell("(Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty ProcessorId)");
        return normalizePart(out);
    }
    catch {
        return '';
    }
}
async function getVolumeSerial(systemDrive = 'C:') {
    try {
        const out = await runPowerShell(`(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${systemDrive}'" | Select-Object -First 1 -ExpandProperty VolumeSerialNumber)`);
        return normalizePart(out);
    }
    catch {
        return '';
    }
}
function getMacFromNode() {
    const ifaces = os_1.default.networkInterfaces();
    const macs = [];
    for (const name of Object.keys(ifaces)) {
        for (const i of ifaces[name] || []) {
            if (!i)
                continue;
            if (i.internal)
                continue;
            if (!i.mac || i.mac === '00:00:00:00:00:00')
                continue;
            macs.push(i.mac);
        }
    }
    macs.sort(); // stable choice
    return normalizePart(macs[0] || '');
}
async function getMacFromWmi() {
    try {
        const out = await runPowerShell("(Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true -and $_.MACAddress } | Select-Object -First 1 -ExpandProperty MACAddress)");
        return normalizePart(out);
    }
    catch {
        return '';
    }
}
async function getDeviceFingerprintV1() {
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
