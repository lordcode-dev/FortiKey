const {
  deriveKey,
  generateRandomBytes,
  encryptString,
  decryptString,
  bufferToBase64,
  base64ToBuffer,
  base64UrlToBuffer,
  exportKeyRaw,
  importKeyRaw
} = window.fortikeyCrypto;
const { loadSettings, loadVaultRecord, saveVaultRecord, loadBiometricData } = window.fortikeyVault;
const { applyTranslations } = window.fortikeyI18n;

const ITERATIONS = 150000;
const t = (k, f = k) => chrome?.i18n?.getMessage?.(k) || f;

const elements = {
  setupSection: document.getElementById("setup"), unlockSection: document.getElementById("unlock"), vaultSection: document.getElementById("vault"),
  setupForm: document.getElementById("setup-form"), setupPassword: document.getElementById("setup-password"), setupConfirm: document.getElementById("setup-confirm"), setupError: document.getElementById("setup-error"),
  unlockForm: document.getElementById("unlock-form"), unlockPassword: document.getElementById("unlock-password"), unlockError: document.getElementById("unlock-error"), biometricButton: document.getElementById("biometric-button"),
  entryForm: document.getElementById("entry-form"), entryId: document.getElementById("entry-id"), entryName: document.getElementById("entry-name"), entryUsername: document.getElementById("entry-username"), entryPassword: document.getElementById("entry-password"), entryUrl: document.getElementById("entry-url"),
  entryTitle: document.getElementById("entry-title"), cancelEdit: document.getElementById("cancel-edit"),
  vaultList: document.getElementById("vault-list"), generateButton: document.getElementById("generate-button"),
  genLength: document.getElementById("gen-length"), genLengthValue: document.getElementById("gen-length-value"), genUpper: document.getElementById("gen-upper"), genLower: document.getElementById("gen-lower"), genNumbers: document.getElementById("gen-numbers"), genSymbols: document.getElementById("gen-symbols")
};

const state = { settings: null, vaultRecord: null, vault: null, key: null, currentUrl: "" };

function showSection(section) {
  [elements.setupSection, elements.unlockSection, elements.vaultSection].forEach((el) => el.classList.add("hidden"));
  section.classList.remove("hidden");
}

function applyTheme(settings) { document.body.setAttribute("data-theme", settings.theme); }
function updateLengthLabel() { elements.genLengthValue.textContent = elements.genLength.value; }

function resetEntryForm() {
  elements.entryForm.reset();
  elements.entryId.value = "";
  elements.cancelEdit.classList.add("hidden");
  elements.entryTitle.textContent = t("addEntry", "Add Entry");
  updateLengthLabel();
}

function generatePassword() {
  const length = Number(elements.genLength.value);
  const pools = [elements.genUpper.checked ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "", elements.genLower.checked ? "abcdefghijkmnopqrstuvwxyz" : "", elements.genNumbers.checked ? "23456789" : "", elements.genSymbols.checked ? "!@#$%^&*()-_=+" : ""].filter(Boolean);
  if (!pools.length) return "";
  const pool = pools.join("");
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues).map((n) => pool[n % pool.length]).join("");
}

async function persistVault() {
  const vault = await encryptString(JSON.stringify(state.vault), state.key);
  state.vaultRecord = { ...state.vaultRecord, vault };
  await saveVaultRecord(state.settings, state.vaultRecord);
}

function entryMatchScore(entry) {
  if (!entry.url || !state.currentUrl) return 0;
  try {
    const entryHost = new URL(entry.url).hostname;
    const currentHost = new URL(state.currentUrl).hostname;
    if (entryHost === currentHost) return 3;
    if (currentHost.endsWith(entryHost) || entryHost.endsWith(currentHost)) return 2;
  } catch (_) {}
  return 1;
}

function renderVault() {
  elements.vaultList.innerHTML = "";
  if (!state.vault?.entries?.length) {
    const empty = document.createElement("p");
    empty.textContent = t("noEntries", "No entries yet.");
    elements.vaultList.appendChild(empty);
    return;
  }

  const entries = [...state.vault.entries].sort((a, b) => entryMatchScore(b) - entryMatchScore(a));
  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "vault-item";
    const title = document.createElement("strong");
    title.textContent = entry.name;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${entry.username}${entry.url ? ` • ${entry.url}` : ""}`;

    const actions = document.createElement("div");
    actions.className = "vault-actions";

    const copyButton = document.createElement("button");
    copyButton.textContent = t("copy", "Copy");
    copyButton.onclick = async () => {
      await navigator.clipboard.writeText(entry.password);
      copyButton.textContent = t("copied", "Copied");
      setTimeout(() => (copyButton.textContent = t("copy", "Copy")), 900);
    };

    const autofillButton = document.createElement("button");
    autofillButton.textContent = t("autofill", "Autofill");
    autofillButton.onclick = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "FORTIKEY_AUTOFILL", payload: { username: entry.username, password: entry.password, url: entry.url, autoLogin: state.settings.autoLoginEnabled } });
    };

    const editButton = document.createElement("button");
    editButton.textContent = t("editEntry", "Edit Entry");
    editButton.onclick = () => {
      elements.entryId.value = entry.id;
      elements.entryName.value = entry.name;
      elements.entryUsername.value = entry.username;
      elements.entryPassword.value = entry.password;
      elements.entryUrl.value = entry.url || "";
      elements.cancelEdit.classList.remove("hidden");
      elements.entryTitle.textContent = t("editEntry", "Edit Entry");
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = t("delete", "Delete");
    deleteButton.onclick = async () => {
      state.vault.entries = state.vault.entries.filter((e) => e.id !== entry.id);
      await persistVault();
      renderVault();
    };

    actions.append(copyButton, autofillButton, editButton, deleteButton);
    item.append(title, meta, actions);
    elements.vaultList.appendChild(item);
  });
}

async function unlockVaultWithKey(key) {
  const text = await decryptString(state.vaultRecord.vault.ciphertext, state.vaultRecord.vault.iv, key);
  state.vault = JSON.parse(text);
  state.key = key;
  const exported = await exportKeyRaw(key);
  chrome.storage.session?.set({ sessionKey: exported });
  renderVault();
  showSection(elements.vaultSection);
}

function getCredentialRequest(credentialId) {
  return {
    challenge: generateRandomBytes(32),
    allowCredentials: [{ id: base64UrlToBuffer(credentialId), type: "public-key", transports: ["internal", "hybrid", "usb", "ble"] }],
    userVerification: "preferred",
    timeout: 60000
  };
}

async function handleSetup(event) {
  event.preventDefault();
  elements.setupError.textContent = "";
  const password = elements.setupPassword.value.trim();
  const confirm = elements.setupConfirm.value.trim();
  if (password.length < 8) return void (elements.setupError.textContent = "Password must be at least 8 characters.");
  if (password !== confirm) return void (elements.setupError.textContent = "Passwords do not match.");
  const salt = generateRandomBytes(16);
  const key = await deriveKey(password, salt, ITERATIONS);
  state.vault = { entries: [] };
  state.vaultRecord = { version: 1, iterations: ITERATIONS, salt: bufferToBase64(salt), vault: await encryptString(JSON.stringify(state.vault), key), check: await encryptString("FortiKey", key) };
  state.key = key;
  await saveVaultRecord(state.settings, state.vaultRecord);
  await unlockVaultWithKey(key);
}

async function handleUnlock(event) {
  event.preventDefault();
  elements.unlockError.textContent = "";
  try {
    const password = elements.unlockPassword.value.trim();
    const salt = new Uint8Array(base64ToBuffer(state.vaultRecord.salt));
    const key = await deriveKey(password, salt, state.vaultRecord.iterations);
    await decryptString(state.vaultRecord.check.ciphertext, state.vaultRecord.check.iv, key);
    await unlockVaultWithKey(key);
  } catch (_) {
    elements.unlockError.textContent = "Invalid master password.";
  }
}

async function handleBiometricUnlock() {
  elements.unlockError.textContent = "";
  const biometric = await loadBiometricData();
  if (!biometric) return void (elements.unlockError.textContent = "Biometric unlock not registered.");
  if (!navigator.credentials) return void (elements.unlockError.textContent = "Biometric unlock unavailable.");
  const sessionData = await new Promise((resolve) => chrome.storage.session?.get(["sessionKey"], resolve));
  if (!sessionData?.sessionKey) return void (elements.unlockError.textContent = "Unlock once with your master password first.");
  try {
    await navigator.credentials.get({ publicKey: getCredentialRequest(biometric.credentialId) });
    const key = await importKeyRaw(sessionData.sessionKey);
    await decryptString(state.vaultRecord.check.ciphertext, state.vaultRecord.check.iv, key);
    await unlockVaultWithKey(key);
  } catch (_) {
    elements.unlockError.textContent = "Biometric unlock failed.";
  }
}

async function handleEntry(event) {
  event.preventDefault();
  if (!state.vault) return;
  const id = elements.entryId.value || crypto.randomUUID();
  const entry = { id, name: elements.entryName.value.trim(), username: elements.entryUsername.value.trim(), password: elements.entryPassword.value.trim(), url: elements.entryUrl.value.trim() };
  if (!entry.name || !entry.username || !entry.password) return;

  const index = state.vault.entries.findIndex((e) => e.id === id);
  if (index >= 0) state.vault.entries[index] = entry;
  else state.vault.entries.unshift(entry);

  await persistVault();
  resetEntryForm();
  renderVault();
}

async function init() {
  state.settings = await loadSettings();
  applyTheme(state.settings);
  await applyTranslations(state.settings.language);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.currentUrl = tab?.url || "";

  state.vaultRecord = await loadVaultRecord(state.settings);
  if (!state.vaultRecord) return showSection(elements.setupSection);
  showSection(elements.unlockSection);
  if (!(await loadBiometricData())) elements.biometricButton.classList.add("hidden");
}

elements.setupForm.addEventListener("submit", handleSetup);
elements.unlockForm.addEventListener("submit", handleUnlock);
elements.biometricButton.addEventListener("click", handleBiometricUnlock);
elements.entryForm.addEventListener("submit", handleEntry);
elements.generateButton.addEventListener("click", () => (elements.entryPassword.value = generatePassword()));
elements.genLength.addEventListener("input", updateLengthLabel);
elements.cancelEdit.addEventListener("click", resetEntryForm);

document.addEventListener("DOMContentLoaded", () => {
  updateLengthLabel();
  init();
});
