const DEFAULT_SETTINGS = {
  theme: "dark",
  syncEnabled: false,
  language: "en",
  autoFillEnabled: true,
  autoLoginEnabled: false
};

function getStorage(area) {
  return new Promise((resolve) => {
    area.get(null, (items) => resolve(items));
  });
}

function setStorage(area, data) {
  return new Promise((resolve) => {
    area.set(data, () => resolve());
  });
}

async function loadSettings() {
  const stored = await getStorage(chrome.storage.local);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored.settings || {})
  };
}

async function saveSettings(settings) {
  await setStorage(chrome.storage.local, { settings });
}

function getVaultArea(settings) {
  return settings.syncEnabled ? chrome.storage.sync : chrome.storage.local;
}

async function loadVaultRecord(settings) {
  const area = getVaultArea(settings);
  const data = await getStorage(area);
  if (data.vaultRecord) {
    return data.vaultRecord;
  }
  if (settings.syncEnabled) {
    const localData = await getStorage(chrome.storage.local);
    return localData.vaultRecord || null;
  }
  return null;
}

async function saveVaultRecord(settings, vaultRecord) {
  await setStorage(chrome.storage.local, { vaultRecord });
  if (settings.syncEnabled) {
    await setStorage(chrome.storage.sync, { vaultRecord });
  }
}

async function clearVaultRecord(settings) {
  await setStorage(chrome.storage.local, { vaultRecord: null });
  if (settings.syncEnabled) {
    await setStorage(chrome.storage.sync, { vaultRecord: null });
  }
}

async function loadBiometricData() {
  const data = await getStorage(chrome.storage.local);
  return data.biometric || null;
}

async function saveBiometricData(biometric) {
  await setStorage(chrome.storage.local, { biometric });
}

window.fortikeyVault = {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  getVaultArea,
  loadVaultRecord,
  saveVaultRecord,
  clearVaultRecord,
  loadBiometricData,
  saveBiometricData
};
