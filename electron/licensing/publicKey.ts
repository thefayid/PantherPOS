/**
 * Public key embedded in the POS app.
 *
 * Obfuscation note:
 * - This is not cryptographic protection; it only adds friction to casual patching.
 * - Real resistance comes from code-signing, anti-debug, and server-side controls (not available offline).
 */

// PEM chunks (intentionally split).
const P = [
  '-----BEGIN PUBLIC KEY-----\n',
  // Replace this with your real public key (see tools/license-generator/README)
  // Default placeholder key is intentionally invalid.
  'REPLACE_ME_WITH_REAL_PUBLIC_KEY_BASE64\n',
  '-----END PUBLIC KEY-----\n',
];

export function getEmbeddedPublicKeyPem(): string {
  return P.join('');
}

