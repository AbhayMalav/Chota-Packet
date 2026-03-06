// AES-256-GCM encryption via browser-native Web Crypto API (NF-S6)
// The key is derived from a static app salt XOR'd with the site origin.
// Goal: obfuscation in localStorage per device/origin, not secure multi-user storage.

const SALT_TEXT = 'chota-packet-salt-v1'
const ALG = { name: 'AES-GCM', length: 256 }

// Build a salt that incorporates the current origin for marginal per-origin variation
function buildSalt() {
  const combined = SALT_TEXT + '/' + location.origin
  return new TextEncoder().encode(combined)
}

async function deriveKey() {
  const salt = buildSalt()
  const base = await crypto.subtle.importKey('raw', salt, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    base,
    ALG,
    false,
    ['encrypt', 'decrypt']
  )
}

function toB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))) }
function fromB64(b64) {
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export async function encryptKey(plaintext) {
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  return JSON.stringify({ iv: toB64(iv), ct: toB64(ciphertext) })
}

export async function decryptKey(stored) {
  const { iv, ct } = JSON.parse(stored)
  const key = await deriveKey()
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(iv) },
    key,
    fromB64(ct)
  )
  return new TextDecoder().decode(plainBuf)
}
