"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEncryptedStringBlob = loadEncryptedStringBlob;
exports.saveEncryptedStringBlob = saveEncryptedStringBlob;
exports.loadLicenseFileText = loadLicenseFileText;
exports.saveLicenseFileText = saveLicenseFileText;
exports.loadState = loadState;
exports.saveState = saveState;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
function getStorePaths() {
    const dir = electron_1.app.getPath('userData');
    return {
        dir,
        licenseBlobPath: path_1.default.join(dir, 'license.blob'),
        stateBlobPath: path_1.default.join(dir, 'license_state.blob'),
    };
}
function atomicWriteFile(filePath, data) {
    const tmp = `${filePath}.${process.pid}.tmp`;
    fs_1.default.writeFileSync(tmp, data);
    fs_1.default.renameSync(tmp, filePath);
}
function loadEncryptedStringBlob(filePath) {
    try {
        if (!fs_1.default.existsSync(filePath))
            return null;
        const blob = fs_1.default.readFileSync(filePath);
        if (!electron_1.safeStorage.isEncryptionAvailable())
            return null;
        return electron_1.safeStorage.decryptString(blob);
    }
    catch {
        return null;
    }
}
function saveEncryptedStringBlob(filePath, plaintext) {
    if (!electron_1.safeStorage.isEncryptionAvailable()) {
        throw new Error('OS encryption is not available (safeStorage).');
    }
    const blob = electron_1.safeStorage.encryptString(plaintext);
    atomicWriteFile(filePath, blob);
}
function loadLicenseFileText() {
    const { licenseBlobPath } = getStorePaths();
    return loadEncryptedStringBlob(licenseBlobPath);
}
function saveLicenseFileText(licenseJsonText) {
    const { dir, licenseBlobPath } = getStorePaths();
    fs_1.default.mkdirSync(dir, { recursive: true });
    saveEncryptedStringBlob(licenseBlobPath, licenseJsonText);
}
function loadState() {
    const { stateBlobPath } = getStorePaths();
    const text = loadEncryptedStringBlob(stateBlobPath);
    if (!text)
        return null;
    try {
        const parsed = JSON.parse(text);
        if (!parsed || parsed.state_version !== 1)
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function saveState(state) {
    const { dir, stateBlobPath } = getStorePaths();
    fs_1.default.mkdirSync(dir, { recursive: true });
    saveEncryptedStringBlob(stateBlobPath, JSON.stringify(state));
}
