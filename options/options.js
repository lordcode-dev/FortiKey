// options/options.js
import { getPreferences, setPreferences } from './preferences.js';

const darkToggle = document.getElementById('darkModeToggle');
const autoLockToggle = document.getElementById('autoLockToggle');
const biometricToggle = document.getElementById('biometricToggle');
const clearBtn = document.getElementById('clearVaultBtn');

document.addEventListener('DOMContentLoaded', async () => {
  const prefs = await getPreferences();

  darkToggle.checked = prefs.darkMode;
  autoLockToggle.checked = prefs.autoLock;
  biometricToggle.checked = prefs.biometric;

  applyTheme(prefs.darkMode);
});

darkToggle.addEventListener('change', async () => {
  const value = darkToggle.checked;
  applyTheme(value);
  await setPreferences({ darkMode: value });
});

autoLockToggle.addEventListener('change', async () => {
  await setPreferences({ autoLock: autoLockToggle.checked });
});

biometricToggle.addEventListener('change', async () => {
  await setPreferences({ biometric: biometricToggle.checked });
});

clearBtn.addEventListener('click', async () => {
  const confirmed = confirm("This will delete all saved credentials. Continue?");
  if (confirmed) {
    await chrome.storage.local.clear();
    alert("Vault cleared.");
  }
});

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
}
