// storage/storage.js

import { encryptVaultData, decryptVaultData } from '../crypto/crypto.js';

const VAULT_KEY = 'fortikey-vault';

/**
 * Saves the given vault object, encrypted with the given key.
 * @param {Object[]} vaultData - List of credentials.
 * @param {CryptoKey} key - AES-GCM key.
 */
export async function saveVault(vaultData, key) {
  const encrypted = await encryptVaultData(vaultData, key);
  await chrome.storage.local.set({ [VAULT_KEY]: encrypted });
}

/**
 * Loads and decrypts the vault data using the given key.
 * @param {CryptoKey} key - AES-GCM key.
 * @returns {Promise<Object[]>} - Decrypted list of credentials.
 */
export async function loadVault(key) {
  const { [VAULT_KEY]: encrypted } = await chrome.storage.local.get(VAULT_KEY);
  if (!encrypted) return [];
  return await decryptVaultData(encrypted, key);
}

/**
 * Clears the stored encrypted vault.
 */
export async function clearVault() {
  await chrome.storage.local.remove(VAULT_KEY);
}
