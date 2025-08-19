// auth/biometric.js

/**
 * Checks if biometric auth is supported by the browser.
 * @returns {Promise<boolean>}
 */
export async function isBiometricSupported() {
  return !!window.PublicKeyCredential;
}

/**
 * Registers a biometric credential for the user.
 * (Stub - implement full WebAuthn flow here if desired.)
 */
export async function registerBiometric() {
  // In production: generate challenge, call navigator.credentials.create(), etc.
  console.warn("Biometric registration not implemented yet.");
}

/**
 * Attempts biometric login.
 * @returns {Promise<boolean>} Success/failure
 */
export async function verifyBiometric() {
  if (!await isBiometricSupported()) return false;

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32), // In production, use server-generated
        timeout: 60000,
        allowCredentials: [], // Link to registered credentials
        userVerification: 'required',
      }
    });

    // Handle assertion result (stub for now)
    console.log("Biometric assertion received:", assertion);
    return true;
  } catch (err) {
    console.error("Biometric auth failed:", err);
    return false;
  }
}
