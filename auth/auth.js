// auth/auth.js

const STORAGE_KEY = 'fortikey-auth';
const ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';
const KEY_LENGTH = 256;

const toBase64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromBase64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

export async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGO
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function createVerifier(key) {
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return crypto.subtle.digest(HASH_ALGO, rawKey);
}

export async function setupMasterPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const verifier = await createVerifier(key);

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      salt: toBase64(salt),
      verifier: toBase64(verifier)
    }
  });

  return key;
}

export async function verifyPassword(password) {
  const record = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  if (!record) throw new Error('No master password set');

  const salt = fromBase64(record.salt);
  const expected = fromBase64(record.verifier);

  const key = await deriveKey(password, salt);
  const actual = new Uint8Array(await createVerifier(key));

  const isValid = expected.every((v, i) => v === actual[i]);
  if (!isValid) throw new Error('Incorrect password');

  return key;
}
