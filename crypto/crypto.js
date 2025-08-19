// crypto/crypto.js

const IV_LENGTH = 12; // Recommended IV size for AES-GCM

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

/**
 * Encrypts a JS object using AES-GCM with the provided key.
 * @param {Object} data - Data to encrypt.
 * @param {CryptoKey} key - AES-GCM key.
 * @returns {Promise<string>} - Base64-encoded (IV + ciphertext).
 */
export async function encryptVaultData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return toBase64(combined.buffer);
}

/**
 * Decrypts a base64-encoded string into an object using AES-GCM.
 * @param {string} encryptedData - Base64-encoded string (IV + ciphertext).
 * @param {CryptoKey} key - AES-GCM key.
 * @returns {Promise<Object>} - Decrypted object.
 */
export async function decryptVaultData(encryptedData, key) {
  const buffer = fromBase64(encryptedData).buffer;
  const iv = new Uint8Array(buffer.slice(0, IV_LENGTH));
  const ciphertext = buffer.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}
