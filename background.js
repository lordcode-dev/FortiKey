chrome.runtime.onInstalled.addListener(async () => {
  const existing = await new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (data) => resolve(data.settings));
  });
  if (!existing) {
    chrome.storage.local.set({
      settings: {
        theme: "dark",
        syncEnabled: false,
        language: "en",
        autoFillEnabled: true,
        autoLoginEnabled: false
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "FORTIKEY_SYNC_SETTINGS") {
    chrome.storage.local.set({ settings: message.payload }, () => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
