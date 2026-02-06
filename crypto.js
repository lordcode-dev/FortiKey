const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer) {
  return bufferToBase64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBuffer(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (base64Url.length % 4)) % 4);
  return base64ToBuffer(base64);
}

async function deriveKey(password, salt, iterations) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

function generateRandomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function encryptString(plaintext, key) {
  const iv = generateRandomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plaintext)
  );
  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext)
  };
}

async function decryptString(ciphertext, iv, key) {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(iv)) },
    key,
    base64ToBuffer(ciphertext)
  );
  return textDecoder.decode(plaintext);
}

async function exportKeyRaw(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

async function importKeyRaw(raw) {
  return crypto.subtle.importKey(
    "raw",
    base64ToBuffer(raw),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

window.fortikeyCrypto = {
  bufferToBase64,
  base64ToBuffer,
  bufferToBase64Url,
  base64UrlToBuffer,
  deriveKey,
  generateRandomBytes,
  encryptString,
  decryptString,
  exportKeyRaw,
  importKeyRaw
};
