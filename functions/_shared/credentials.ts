import type { Env } from "./supabase";

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

async function key(env: Env) {
  if (!env.CONNECTION_ENCRYPTION_KEY)
    throw new Error("Credential vault is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes(env.CONNECTION_ENCRYPTION_KEY)
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function encode(value: Uint8Array) {
  return btoa(String.fromCharCode(...value));
}

function decode(value: string) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

export async function encryptCredential(env: Env, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(env),
    bytes(plaintext)
  );
  return `${encode(iv)}.${encode(new Uint8Array(cipher))}`;
}

export async function decryptCredential(env: Env, payload: string) {
  const [iv, cipher] = payload.split(".");
  if (!iv || !cipher) throw new Error("Credential payload is invalid");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(iv) },
    await key(env),
    decode(cipher)
  );
  return new TextDecoder().decode(plaintext);
}

export async function fingerprintCredential(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", bytes(value))
  );
  return Array.from(digest.slice(0, 6), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}
