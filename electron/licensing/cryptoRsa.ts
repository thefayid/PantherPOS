import crypto from 'crypto';

export function verifyRsaPssSha256Base64Signature(params: {
  publicKeyPem: string;
  dataUtf8: string;
  signatureBase64: string;
}): boolean {
  const sig = Buffer.from(params.signatureBase64, 'base64');
  return crypto.verify(
    'sha256',
    Buffer.from(params.dataUtf8, 'utf8'),
    {
      key: params.publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
    sig,
  );
}

export function signRsaPssSha256Base64(params: {
  privateKeyPem: string;
  dataUtf8: string;
}): string {
  const sig = crypto.sign(
    'sha256',
    Buffer.from(params.dataUtf8, 'utf8'),
    {
      key: params.privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
  );
  return sig.toString('base64');
}

