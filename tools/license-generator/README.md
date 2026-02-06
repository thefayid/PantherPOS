## Offline License Generator (Admin Tool)

This tool **must be kept off customer machines**. It holds the **RSA private key** used to sign `.lic` files.

### 1) Create signing keypair (one-time, offline)

Use OpenSSL on a secure admin machine:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```

### 2) Embed the public key in the POS app

Open `electron/licensing/publicKey.ts` and replace the placeholder base64 line with the base64 body of `public.pem`.

### 3) Generate a signed `.lic`

```bash
node tools/license-generator/generate-license.js ^
  --key private.pem ^
  --customer "Acme Retail Pvt Ltd" ^
  --device-hash "0123...abcd" ^
  --type yearly ^
  --expiry "2027-01-31T23:59:59Z" ^
  --features "billing,inventory,accounting" ^
  --out "AcmeRetail.lic"
```

### Notes

- **Expiry** must be an ISO-8601 UTC string ending with `Z` (example: `2026-12-31T23:59:59Z`).
- Features are a comma-separated list. They are sorted before signing.
- The POS validates **signature + device hash + expiry** fully offline.

