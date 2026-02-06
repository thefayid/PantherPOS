"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRsaPssSha256Base64Signature = verifyRsaPssSha256Base64Signature;
exports.signRsaPssSha256Base64 = signRsaPssSha256Base64;
const crypto_1 = __importDefault(require("crypto"));
function verifyRsaPssSha256Base64Signature(params) {
    const sig = Buffer.from(params.signatureBase64, 'base64');
    return crypto_1.default.verify('sha256', Buffer.from(params.dataUtf8, 'utf8'), {
        key: params.publicKeyPem,
        padding: crypto_1.default.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: 32,
    }, sig);
}
function signRsaPssSha256Base64(params) {
    const sig = crypto_1.default.sign('sha256', Buffer.from(params.dataUtf8, 'utf8'), {
        key: params.privateKeyPem,
        padding: crypto_1.default.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: 32,
    });
    return sig.toString('base64');
}
