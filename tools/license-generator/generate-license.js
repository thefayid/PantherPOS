#!/usr/bin/env node
/**
 * Offline License Generator Tool (Admin-side).
 *
 * Algorithm: RSA-2048 PSS, SHA-256, saltLength=32
 * Output: JSON .lic with { payload, signature, kid? }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1];
    out[k] = v;
    i++;
  }
  return out;
}

function canonicalizeValue(value) {
  if (value === null) return null;
  const t = typeof value;
  if (t === 'string' || t === 'boolean' || t === 'number') return value;
  if (Array.isArray(value)) return value.map(canonicalizeValue);
  if (t === 'object') {
    const out = {};
    Object.keys(value)
      .sort()
      .forEach((k) => (out[k] = canonicalizeValue(value[k])));
    return out;
  }
  return null;
}

function canonicalizeJson(value) {
  return JSON.stringify(canonicalizeValue(value));
}

function signRsaPssSha256Base64(privateKeyPem, dataUtf8) {
  const sig = crypto.sign('sha256', Buffer.from(dataUtf8, 'utf8'), {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  });
  return sig.toString('base64');
}

function isIsoUtc(s) {
  return typeof s === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/.test(s);
}

async function main() {
  const args = parseArgs(process.argv);
  const keyPath = args.key;
  const customer = args.customer;
  const deviceHash = args['device-hash'];
  const type = args.type;
  const expiry = args.expiry;
  const features = (args.features || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .sort();
  const outPath = args.out || `${customer || 'license'}.lic`;
  const kid = args.kid;

  if (!keyPath) die('Missing --key private.pem');
  if (!customer) die('Missing --customer');
  if (!deviceHash) die('Missing --device-hash');
  if (!type || !['trial', 'yearly', 'lifetime'].includes(type)) die('Missing/invalid --type (trial|yearly|lifetime)');
  if (!expiry || !isIsoUtc(expiry)) die('Missing/invalid --expiry (ISO UTC, e.g. 2026-12-31T23:59:59Z)');
  if (features.length === 0) die('Missing/invalid --features (comma-separated list)');

  const privateKeyPem = fs.readFileSync(keyPath, 'utf8');

  const payload = {
    license_version: 1,
    customer_name: customer,
    device_hash: deviceHash,
    license_type: type,
    expiry_date: expiry,
    enabled_features: features,
    issued_at: new Date().toISOString(),
    device_hash_alg: 'sha256',
    fingerprint_version: 1,
  };

  const canonicalPayload = canonicalizeJson(payload);
  const signature = signRsaPssSha256Base64(privateKeyPem, canonicalPayload);

  const licenseFile = {
    payload,
    signature,
  };
  if (kid) licenseFile.kid = kid;

  const finalText = JSON.stringify(licenseFile, null, 2);
  const absOut = path.resolve(process.cwd(), outPath);
  fs.writeFileSync(absOut, finalText, 'utf8');
  process.stdout.write(`Wrote ${absOut}\n`);
}

main().catch((e) => die(e && e.stack ? e.stack : String(e)));

