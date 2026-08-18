const { generateRandomBytes, bufferToBase64Url } = window.fortikeyCrypto;
const { loadSettings, saveSettings, loadVaultRecord, saveVaultRecord, loadBiometricData, saveBiometricData } = window.fortikeyVault;
const { applyTranslations } = window.fortikeyI18n;

const elements = {
  themeSelect: document.getElementById("theme-select"), languageSelect: document.getElementById("language-select"), syncToggle: document.getElementById("sync-toggle"),
  autofillToggle: document.getElementById("autofill-toggle"), autologinToggle: document.getElementById("autologin-toggle"),
  registerBiometric: document.getElementById("register-biometric"), removeBiometric: document.getElementById("remove-biometric"), biometricStatus: document.getElementById("biometric-status"),
  exportButton: document.getElementById("export-button"), importText: document.getElementById("import-text"), importButton: document.getElementById("import-button"), importStatus: document.getElementById("import-status")
};

let settings;

function applyTheme(theme) { document.body.setAttribute("data-theme", theme); }
function setMsg(el, text, ok = true) { el.textContent = text; el.style.color = ok ? "#38bdf8" : "#f87171"; }

function createCredentialOptions() {
  return {
    challenge: generateRandomBytes(32),
    rp: { name: "FortiKey" },
    user: { id: generateRandomBytes(16), name: "fortikey-user", displayName: "FortiKey User" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { userVerification: "preferred", residentKey: "preferred" },
    timeout: 60000,
    attestation: "none"
  };
}

async function syncVaultAcrossStorage(enableSync) {
  const sourceSettings = { ...settings, syncEnabled: !enableSync };
  const vault = await loadVaultRecord(sourceSettings);
  if (vault) {
    await saveVaultRecord({ ...settings, syncEnabled: enableSync }, vault);
  }
}

async function init() {
  settings = await loadSettings();
  applyTheme(settings.theme);
  await applyTranslations(settings.language);

  elements.themeSelect.value = settings.theme;
  elements.languageSelect.value = settings.language;
  elements.syncToggle.checked = settings.syncEnabled;
  elements.autofillToggle.checked = settings.autoFillEnabled;
  elements.autologinToggle.checked = settings.autoLoginEnabled;

  if (await loadBiometricData()) setMsg(elements.biometricStatus, "Biometric unlock is registered.");
}

async function updateSettings(partial) {
  settings = { ...settings, ...partial };
  await saveSettings(settings);
}

elements.themeSelect.addEventListener("change", async () => {
  await updateSettings({ theme: elements.themeSelect.value });
  applyTheme(settings.theme);
});

elements.languageSelect.addEventListener("change", async () => {
  await updateSettings({ language: elements.languageSelect.value });
  await applyTranslations(settings.language);
});

elements.syncToggle.addEventListener("change", async () => {
  const enabled = elements.syncToggle.checked;
  await syncVaultAcrossStorage(enabled);
  await updateSettings({ syncEnabled: enabled });
});

elements.autofillToggle.addEventListener("change", async () => updateSettings({ autoFillEnabled: elements.autofillToggle.checked }));
elements.autologinToggle.addEventListener("change", async () => updateSettings({ autoLoginEnabled: elements.autologinToggle.checked }));

elements.registerBiometric.addEventListener("click", async () => {
  if (!navigator.credentials) return setMsg(elements.biometricStatus, "WebAuthn is not available in this browser.", false);
  try {
    const options = createCredentialOptions();
    const credential = await navigator.credentials.create({ publicKey: options });
    if (!credential?.rawId) throw new Error("No credential");
    await saveBiometricData({ credentialId: bufferToBase64Url(credential.rawId), createdAt: new Date().toISOString() });
    setMsg(elements.biometricStatus, "Biometric unlock registered successfully.");
  } catch {
    setMsg(elements.biometricStatus, "Failed to register biometric unlock.", false);
  }
});

elements.removeBiometric.addEventListener("click", async () => {
  await saveBiometricData(null);
  setMsg(elements.biometricStatus, "Biometric unlock removed.");
});

elements.exportButton.addEventListener("click", async () => {
  const vaultRecord = await loadVaultRecord(settings);
  if (!vaultRecord) return setMsg(elements.importStatus, "No vault found to export.", false);
  const blob = new Blob([JSON.stringify(vaultRecord, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fortikey-vault-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

elements.importButton.addEventListener("click", async () => {
  try {
    const data = JSON.parse(elements.importText.value);
    if (!data?.vault?.ciphertext || !data?.vault?.iv || !data?.salt || !data?.iterations || !data?.check?.ciphertext || !data?.check?.iv) {
      throw new Error("Invalid format");
    }
    await saveVaultRecord(settings, data);
    setMsg(elements.importStatus, "Vault imported successfully.");
  } catch {
    setMsg(elements.importStatus, "Failed to import vault.", false);
  }
});

document.addEventListener("DOMContentLoaded", init);
