import crypto, { CipherGCM, DecipherGCM } from "crypto";
import 'dotenv/config';

const ALGORITHM = `${process.env.ALGORITHM}` || '';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export async function encryptPhoneNumber(phoneNumber: string): Promise<string> {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv) as CipherGCM;
    const encrypted = Buffer.concat([cipher.update(phoneNumber, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Store iv + tag + encrypted together so we can decrypt later
    return Buffer.concat([iv, tag, encrypted]).toString('hex');
};

export async function decryptPhoneNumber(encrypted: string): Promise<string> {
    const buf = Buffer.from(encrypted, 'hex');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv) as DecipherGCM;
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final('utf8');
};