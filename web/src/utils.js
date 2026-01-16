/**
 * Encodes a string to base64 using UTF-8 encoding
 * @param {string} str - The string to encode
 * @returns {string} Base64 encoded string
 */
export function encodeSource(str) {
  const encoder = new TextEncoder();
  return btoa(String.fromCharCode(...encoder.encode(str)));
}

/**
 * Decodes a base64 string back to UTF-8
 * @param {string} base64 - The base64 string to decode
 * @returns {string} Decoded string
 */
export function decodeSource(base64) {
  const decoder = new TextDecoder();
  return decoder.decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
}

/**
 * Logs debug messages with a consistent prefix
 * @param {...any} args - Arguments to log
 */
export function debug(...args) {
  console.log("[TypstAddin]", ...args);
}
