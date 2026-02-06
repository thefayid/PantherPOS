"use strict";
/**
 * Public key embedded in the POS app.
 *
 * Obfuscation note:
 * - This is not cryptographic protection; it only adds friction to casual patching.
 * - Real resistance comes from code-signing, anti-debug, and server-side controls (not available offline).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddedPublicKeyPem = getEmbeddedPublicKeyPem;
// PEM chunks (intentionally split).
const P = [
    '-----BEGIN PUBLIC KEY-----\n',
    // Replace this with your real public key (see tools/license-generator/README)
    // Default placeholder key is intentionally invalid.
    'REPLACE_ME_WITH_REAL_PUBLIC_KEY_BASE64\n',
    '-----END PUBLIC KEY-----\n',
];
function getEmbeddedPublicKeyPem() {
    return P.join('');
}
