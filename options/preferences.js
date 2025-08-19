// options/preferences.js

const PREF_KEY = 'fortikey-prefs';

const defaultPrefs = {
  darkMode: false,
  autoLock: true,
  biometric: false
};

export async function getPreferences() {
  const { [PREF_KEY]: prefs } = await chrome.storage.local.get(PREF_KEY);
  return { ...defaultPrefs, ...prefs };
}

export async function setPreferences(partialPrefs) {
  const current = await getPreferences();
  const updated = { ...current, ...partialPrefs };
  await chrome.storage.local.set({ [PREF_KEY]: updated });
}
