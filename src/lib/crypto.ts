import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export function hashToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function safeEqual(valueA: string, valueB: string) {
  const a = Buffer.from(valueA);
  const b = Buffer.from(valueB);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function getAesKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(raw: string, secret: string) {
  const key = getAesKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
}

export function decryptSecret(payload: string, secret: string) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted payload format.");
  }
  const key = getAesKey(secret);
  const decipher = createDecipheriv("aes-256-gcm", key, fromBase64Url(ivRaw));
  decipher.setAuthTag(fromBase64Url(tagRaw));
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(encryptedRaw)),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function randomToken(size = 32) {
  return randomBytes(size).toString("base64url");
}
