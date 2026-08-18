async function loadMessages(language) {
  try {
    const url = chrome?.runtime?.getURL
      ? chrome.runtime.getURL(`_locales/${language}/messages.json`)
      : `./_locales/${language}/messages.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Missing locale");
    }
    return response.json();
  } catch (error) {
    if (language !== "en") {
      return loadMessages("en");
    }
    return {};
  }
}

async function applyTranslations(language) {
  const messages = await loadMessages(language);
  document.documentElement.lang = language;
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const message = messages[key]?.message || chrome?.i18n?.getMessage?.(key);
    if (message) {
      element.textContent = message;
    }
  });

  const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
  placeholders.forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const message = messages[key]?.message || chrome?.i18n?.getMessage?.(key);
    if (message) {
      element.setAttribute("placeholder", message);
    }
  });
}

window.fortikeyI18n = { applyTranslations };
