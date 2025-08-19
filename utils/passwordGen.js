// utils/passwordGen.js

const DEFAULT_LENGTH = 16;
const DEFAULT_OPTIONS = {
  length: DEFAULT_LENGTH,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true
};

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?'
};

/**
 * Generates a secure password.
 * @param {Object} options - Options for characters to include.
 * @returns {string}
 */
export function generatePassword(options = DEFAULT_OPTIONS) {
  const chars = Object.entries(options)
    .filter(([key, enabled]) => key !== 'length' && enabled)
    .map(([key]) => CHAR_SETS[key])
    .join('');

  if (!chars) throw new Error("At least one character type must be selected.");

  const length = options.length || DEFAULT_LENGTH;
  const passwordArray = new Uint32Array(length);
  crypto.getRandomValues(passwordArray);

  return Array.from(passwordArray, x => chars[x % chars.length]).join('');
}
