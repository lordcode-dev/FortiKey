// background/background.js

let isUnlocked = false;
let vaultKey = null; // AES-GCM CryptoKey when unlocked

// Respond to messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOCK') {
    handleLock();
    sendResponse({ status: 'locked' });
  }

  if (message.type === 'UNLOCK') {
    vaultKey = message.key;
    isUnlocked = true;
    sendResponse({ status: 'unlocked' });
  }

  if (message.type === 'GET_LOCK_STATE') {
    sendResponse({ isUnlocked })
