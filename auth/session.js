// auth/session.js

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (adjust as needed)
let timeoutId = null;

/**
 * Starts an auto-lock timer.
 * @param {Function} onTimeout - Callback to run when session expires
 */
export function startSession(onTimeout) {
  clearSession();
  timeoutId = setTimeout(() => {
    onTimeout();
  }, SESSION_TIMEOUT_MS);
}

/**
 * Clears the current session timeout.
 */
export function clearSession() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

/**
 * Restarts the session timer — useful after user activity.
 */
export function refreshSession(onTimeout) {
  startSession(onTimeout);
}
