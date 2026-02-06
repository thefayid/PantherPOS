## Signed Offline Device-Bound Licensing (PantherPOS)

### System architecture (text diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Secure Admin (Offline)                               │
│                                                                             │
│  ┌───────────────┐   private.pem (RSA-2048)   ┌──────────────────────────┐ │
│  │ Device Owner  │ ─────────────────────────▶ │ License Generator Tool    │ │
│  │ (Admin on POS)│   sends device_hash        │ (tools/license-generator) │ │
│  └───────────────┘                             └─────────────┬────────────┘ │
│                                                              signs payload   │
│                                                               (RSA-PSS)      │
└────────────────────────────────────────────────────────────────┬────────────┘
                                                                 │ outputs
                                                                 ▼
                                                          Signed JSON `.lic`
                                                                 │
                                                                 │ USB / offline transfer
                                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               POS Machine                                    │
│                                                                             │
│  Electron Main Process                                                       │
│  - Computes device fingerprint (CPU ID + Volume Serial + MAC)                │
│  - Hashes SHA-256 → device_hash                                               │
│  - Loads cached `.lic` (DPAPI via safeStorage)                                │
│  - Canonicalizes payload (sorted JSON)                                        │
│  - Verifies signature using embedded public key                               │
│  - Enforces: signature valid, device_hash match, expiry not passed            │
│  - Anti-rollback: stores max_seen_utc/last_seen_utc (DPAPI)                   │
│                                                                             │
│  Renderer (UI)                                                               │
│  - If unlicensed: shows Activation screen with device_hash + import button   │
│  - If licensed: proceeds with normal login & POS workflows                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### License file format (`.lic`)

JSON:

```json
{
  "payload": {
    "license_version": 1,
    "customer_name": "Acme Retail Pvt Ltd",
    "device_hash": "…sha256 hex…",
    "license_type": "yearly",
    "expiry_date": "2027-01-31T23:59:59Z",
    "enabled_features": ["billing", "inventory", "accounting"],
    "issued_at": "2026-02-06T12:34:56Z",
    "device_hash_alg": "sha256",
    "fingerprint_version": 1
  },
  "signature": "…base64 RSA-PSS signature…",
  "kid": "optional-key-id"
}
```

Signature is computed over **canonical JSON of `payload`** (keys sorted, no whitespace).

### Where the code lives

- **Fingerprint**: `electron/licensing/deviceFingerprint.ts`
- **Signature verify + policy**: `electron/licensing/validate.ts`
- **Secure caching / anti-rollback state**: `electron/licensing/stateStore.ts`
- **Embedded public key**: `electron/licensing/publicKey.ts`
- **Admin generator**: `tools/license-generator/generate-license.js`

### Windows POS deployment best practices

- **Code signing**: sign the installer and binaries; enable Windows SmartScreen reputation.
- **No private key on endpoints**: the POS ships **only** the public key.
- **Lock down the OS**:
  - Dedicated Windows user account, least privilege.
  - Disable unnecessary admin rights, RDP, and unneeded services.
  - Use AppLocker/WDAC if possible to restrict what can execute.
- **Harden Electron**:
  - Disable DevTools in production builds.
  - Ship with `asar` packaging (electron-builder default).
  - Keep `contextIsolation: true` (already set) and avoid `nodeIntegration` in renderer.
- **Protect license storage**:
  - Stored under `app.getPath('userData')` encrypted using Windows DPAPI (`safeStorage`).
  - Ensure directory ACLs prevent standard users from modifying other users’ data.
- **Anti-tamper reality check**:
  - Offline anti-rollback is **best-effort**. Deleting encrypted state can reset history.
  - For higher assurance, store redundant state (file + registry) and audit logs, but offline can never be perfect.
- **Hardware changes policy**:
  - This implementation is strict: changing CPU/disk/NIC can invalidate the license.
  - If you need “tolerant binding” (e.g., NIC swap), implement a multi-factor fingerprint with thresholds.

