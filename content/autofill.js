// content/autofill.js

async function autofillLogin() {
  const inputs = document.querySelectorAll('input[type="password"]');
  if (inputs.length === 0) return;

  const passwordInput = inputs[0];
  const usernameInput = findUsernameInput(passwordInput);

  const { isUnlocked } = await chrome.runtime.sendMessage({ type: 'GET_LOCK_STATE' });
  if (!isUnlocked) return;

  const { credentials } = await chrome.storage.local.get('credentials');
  if (!credentials || credentials.length === 0) return;

  const currentDomain = window.location.hostname;
  const match = credentials.find(c => currentDomain.includes(c.domain));
  if (!match) return;

  usernameInput.value = match.username;
  passwordInput.value = match.password;

  if (match.autoLogin) {
    passwordInput.form?.submit();
  }
}

function findUsernameInput(passwordInput) {
  const form = passwordInput.closest('form');
  if (!form) return document.querySelector('input[type="text"], input[type="email"]') || passwordInput;

  const inputs = Array.from(form.querySelectorAll('input'));
  return inputs.find(input =>
    ['text', 'email'].includes(input.type)
  ) || passwordInput;
}

document.addEventListener('DOMContentLoaded', autofillLogin);
