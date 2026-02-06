"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalizeJson = canonicalizeJson;
/**
 * Minimal JSON canonicalization for signing/verifying offline licenses.
 *
 * We follow the important bits of RFC 8785 (JCS):
 * - Objects have keys sorted lexicographically (Unicode code points)
 * - Arrays preserve order
 * - No whitespace
 *
 * Notes:
 * - Dates must already be normalized to a single representation (we use ISO-8601 UTC strings).
 * - Numbers should be avoided in signed payloads unless you enforce formatting rules.
 */
function canonicalizeJson(value) {
    return JSON.stringify(canonicalizeValue(value));
}
function canonicalizeValue(value) {
    if (value === null)
        return null;
    const t = typeof value;
    if (t === 'string' || t === 'boolean' || t === 'number')
        return value;
    if (Array.isArray(value))
        return value.map(canonicalizeValue);
    if (t === 'object') {
        const out = {};
        const keys = Object.keys(value).sort();
        for (const k of keys)
            out[k] = canonicalizeValue(value[k]);
        return out;
    }
    // undefined / function / symbol are not valid in JSON payloads
    return null;
}
