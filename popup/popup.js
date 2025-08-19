// popup/popup.js
import { verifyPassword } from '../auth/auth.js';
import { startSession, clearSession } from '../auth/session.js';
import { getPreferences } from '../options/preferences.js';

const masterInput = document.getElementById('masterPassword');
const unlockBtn = document.getElementById('unlockBtn');
const lockBtn = document.getElementById('lockBtn');
const errorText = document.getElementById('unlockError');
const lockedView = document.getElementById('lockedView');
const unlockedView = document.getElementById('unlockedView');

document.addEventListener('DOMContentLoaded', async () => {
  const prefs = await getPreferences();
  document.body.classList.toggle('dark', prefs.darkMode);

  const { isUnlocked } = await chrome.runtime.sendMessage({ type: 'GET_LOCK_STATE' });
  showView(isUnlocked);
});

unlockBtn.addEventListener('click', async () => {
  const pwd = masterInput.value.trim();
  if (!pwd) return;

  try {
    const key = await verifyPassword(pwd);
    await chrome.runtime.sendMessage({ type: 'UNLOCK', key });

    startSession(() => {
      chrome.runtime.sendMessage({ type: 'LOCK' });
      showView(false);
    });

    showView(true);
  } catch (err) {
    errorText.textContent = "Incorrect master password.";
  }
});

lockBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOCK' });
  clearSession();
  showView(false);
});

function showView(unlocked) {
  lockedView.classList.toggle('hidden', unlocked);
  unlockedView.classList.toggle('hidden', !unlocked);
  errorText.textContent = '';
  masterInput.value = '';
}
