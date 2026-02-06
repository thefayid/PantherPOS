"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLicenseTextOffline = validateLicenseTextOffline;
exports.validateCachedLicenseOffline = validateCachedLicenseOffline;
const canonicalJson_1 = require("./canonicalJson");
const publicKey_1 = require("./publicKey");
const cryptoRsa_1 = require("./cryptoRsa");
const deviceFingerprint_1 = require("./deviceFingerprint");
const stateStore_1 = require("./stateStore");
function isIsoDateString(s) {
    return typeof s === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/.test(s);
}
function parseLicenseJson(text) {
    try {
        const obj = JSON.parse(text);
        if (!obj || typeof obj !== 'object')
            return null;
        if (!obj.payload || typeof obj.payload !== 'object')
            return null;
        if (typeof obj.signature !== 'string')
            return null;
        return obj;
    }
    catch {
        return null;
    }
}
function nowUtcIso() {
    return new Date().toISOString();
}
function compareIso(a, b) {
    // ISO strings in UTC lexicographically compare by time.
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
function validatePayloadShape(payload) {
    if (!payload || typeof payload !== 'object')
        return false;
    if (payload.license_version !== 1)
        return false;
    if (typeof payload.customer_name !== 'string' || payload.customer_name.trim().length < 1)
        return false;
    if (typeof payload.device_hash !== 'string' || payload.device_hash.length < 32)
        return false;
    if (payload.license_type !== 'trial' && payload.license_type !== 'yearly' && payload.license_type !== 'lifetime')
        return false;
    if (typeof payload.expiry_date !== 'string')
        return false;
    if (!Array.isArray(payload.enabled_features))
        return false;
    if (!payload.enabled_features.every((x) => typeof x === 'string'))
        return false;
    // Normalize optional values
    if (payload.issued_at && !isIsoDateString(payload.issued_at))
        return false;
    if (payload.license_id && typeof payload.license_id !== 'string')
        return false;
    return true;
}
async function validateLicenseTextOffline(licenseJsonText) {
    const parsed = parseLicenseJson(licenseJsonText);
    if (!parsed)
        return { ok: false, reason: 'INVALID_FORMAT' };
    const { payload, signature } = parsed;
    if (!validatePayloadShape(payload))
        return { ok: false, reason: 'INVALID_FORMAT' };
    const publicKeyPem = (0, publicKey_1.getEmbeddedPublicKeyPem)();
    const canonicalPayload = (0, canonicalJson_1.canonicalizeJson)(payload);
    const sigOk = (0, cryptoRsa_1.verifyRsaPssSha256Base64Signature)({
        publicKeyPem,
        dataUtf8: canonicalPayload,
        signatureBase64: signature,
    });
    if (!sigOk)
        return { ok: false, reason: 'SIGNATURE_INVALID' };
    const fp = await (0, deviceFingerprint_1.getDeviceFingerprintV1)();
    if (fp.device_hash !== payload.device_hash) {
        return { ok: false, reason: 'DEVICE_MISMATCH', details: `expected ${payload.device_hash} got ${fp.device_hash}` };
    }
    // Expiry check
    const nowIso = nowUtcIso();
    if (!isIsoDateString(payload.expiry_date))
        return { ok: false, reason: 'INVALID_FORMAT' };
    if (compareIso(nowIso, payload.expiry_date) > 0)
        return { ok: false, reason: 'EXPIRED' };
    // Anti-rollback: compare against stored max_seen_utc and last_seen_utc.
    // We allow a small negative drift for RTC jitter.
    const state = (0, stateStore_1.loadState)();
    const driftToleranceMs = 5 * 60 * 1000; // 5 minutes
    if (state?.last_seen_utc && isIsoDateString(state.last_seen_utc)) {
        const last = new Date(state.last_seen_utc).getTime();
        const now = new Date(nowIso).getTime();
        if (now + driftToleranceMs < last) {
            return { ok: false, reason: 'CLOCK_ROLLBACK', details: `now=${nowIso} last=${state.last_seen_utc}` };
        }
    }
    if (state?.max_seen_utc && isIsoDateString(state.max_seen_utc)) {
        const max = new Date(state.max_seen_utc).getTime();
        const now = new Date(nowIso).getTime();
        if (now + driftToleranceMs < max) {
            return { ok: false, reason: 'CLOCK_ROLLBACK', details: `now=${nowIso} max=${state.max_seen_utc}` };
        }
    }
    // Update state (max_seen never decreases)
    const nextMax = state?.max_seen_utc && isIsoDateString(state.max_seen_utc) && compareIso(state.max_seen_utc, nowIso) > 0
        ? state.max_seen_utc
        : nowIso;
    (0, stateStore_1.saveState)({
        state_version: 1,
        last_seen_utc: nowIso,
        max_seen_utc: nextMax,
        license_id: payload.license_id,
    });
    return { ok: true, payload };
}
async function validateCachedLicenseOffline() {
    const cached = (0, stateStore_1.loadLicenseFileText)();
    if (!cached)
        return { ok: false, reason: 'NO_LICENSE' };
    return validateLicenseTextOffline(cached);
}
