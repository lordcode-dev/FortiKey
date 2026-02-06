# Contributing to FortiKey

Thanks for your interest in improving FortiKey.

## Project Scope
FortiKey is a **Chrome Extension (Manifest V3)** focused on secure password management.

## Local Development
1. Clone the repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this project folder.
5. Use the extension popup and options page to test changes.

## Contribution Guidelines
- Keep all credential data encrypted at rest.
- Preserve master-password based unlock before vault access.
- Keep biometric unlock optional and WebAuthn-based.
- Keep import/export encrypted.
- Keep localization keys synchronized across `_locales/*/messages.json`.
- Update `manifest.json` only with required permissions.

## Pull Requests
- Provide a clear summary of changes.
- Include testing notes (manual and/or automated).
- For UI updates, include a screenshot when possible.

## Security Notes
If you discover a security issue, please avoid posting sensitive exploit details publicly.
Open an issue with a high-level report and reproduction guidance.
