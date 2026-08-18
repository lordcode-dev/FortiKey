let cachedSettings = { autoFillEnabled: true, autoLoginEnabled: false };

function loadSettings() {
  chrome.storage.local.get(["settings"], (data) => {
    cachedSettings = { ...cachedSettings, ...(data.settings || {}) };
  });
}

function findLoginFields() {
  const passwordField = document.querySelector('input[type="password"]');
  if (!passwordField) return null;
  const form = passwordField.closest("form") || document;
  const userFields = Array.from(form.querySelectorAll('input[type="text"],input[type="email"],input:not([type])'));
  const usernameField = userFields.find((field) => /(user|email|login|account)/i.test(`${field.name} ${field.id} ${field.placeholder}`)) || userFields[0] || null;
  return { usernameField, passwordField, form };
}

function setInputValue(field, value) {
  if (!field) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function isUrlMatch(entryUrl) {
  if (!entryUrl) return true;
  try {
    const entryHost = new URL(entryUrl).hostname;
    const currentHost = window.location.hostname;
    return currentHost === entryHost || currentHost.endsWith(`.${entryHost}`) || entryHost.endsWith(`.${currentHost}`);
  } catch {
    return true;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "FORTIKEY_AUTOFILL" || !cachedSettings.autoFillEnabled) return;
  if (!isUrlMatch(message?.payload?.url)) return;
  const fields = findLoginFields();
  if (!fields) return;

  setInputValue(fields.usernameField, message.payload.username || "");
  setInputValue(fields.passwordField, message.payload.password || "");

  if (message.payload.autoLogin && fields.form instanceof HTMLFormElement) {
    fields.form.requestSubmit ? fields.form.requestSubmit() : fields.form.submit();
  }
});

loadSettings();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) cachedSettings = { ...cachedSettings, ...(changes.settings.newValue || {}) };
});
