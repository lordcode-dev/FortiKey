import { verifyPassword } from '../auth/auth.js';
import { startSession, clearSession } from '../auth/session.js';
import { getPreferences } from '../options/preferences.js';
import { loadVault } from '../storage/storage.js';

const masterInput = document.getElementById('masterPassword');
const unlockBtn = document.getElementById('unlockBtn');
const lockBtn = document.getElementById('lockBtn');
const errorText = document.getElementById('unlockError');
const lockedView = document.getElementById('lockedView');
const unlockedView = document.getElementById('unlockedView');
const vaultList = document.getElementById('vaultList');

document.addEventListener('DOMContentLoaded', async () => {
  const prefs = await getPreferences();
  document.body.classList.toggle('dark', prefs.darkMode);

  const { isUnlocked } = await chrome.runtime.sendMessage({ type: 'GET_LOCK_STATE' });
  showView(isUnlocked);

  if (isUnlocked) {
    // If already unlocked, reload and display vault
    const { key } = await chrome.runtime.sendMessage({ type: 'GET_VAULT_KEY' });
    if (key) displayVault(key);
  }
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
    displayVault(key);
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
  vaultList.innerHTML = '';
}

async function displayVault(key) {
  vaultList.innerHTML = '';
  const credentials = await loadVault(key);

  if (!credentials || credentials.length === 0) {
    vaultList.innerHTML = '<p>No credentials saved.</p>';
    return;
  }

  for (const entry of credentials) {
    const div = document.createElement('div');
    div.className = 'credential';
    div.innerHTML = `
      <strong>${entry.domain}</strong>
      Username: ${entry.username}<br />
      Password: ${entry.password}
    `;
    vaultList.appendChild(div);
  }
}
