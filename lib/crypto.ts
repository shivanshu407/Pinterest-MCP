import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { requiredEnv } from "@/lib/env";

export function randomToken(prefix: string, byteLength = 32): string {
  return `${prefix}_${randomBytes(byteLength).toString("base64url")}`;
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function encryptionKey(): Buffer {
  const decoded = Buffer.from(requiredEnv("TOKEN_ENCRYPTION_KEY"), "base64");
  if (decoded.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return decoded;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivPart, tagPart, encryptedPart] = payload.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
