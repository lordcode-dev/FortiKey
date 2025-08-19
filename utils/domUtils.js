// utils/domUtils.js

/**
 * Shortcut for document.querySelector
 * @param {string} selector
 * @returns {Element|null}
 */
export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Copies the given text to the clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }
}
