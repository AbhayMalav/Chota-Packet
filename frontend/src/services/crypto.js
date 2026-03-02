// AES-256-GCM encryption via browser-native Web Crypto API (NF-S6)
// The key is derived from a static app salt — the goal is obfuscation
// in localStorage, not secure multi-user storage.

const SALT = new TextEncoder().encode('chota-packet-salt-v1')
const ALG = { name: 'AES-GCM', length: 256 }

async function deriveKey() {
  const base = await crypto.subtle.importKey('raw', SALT, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: 100_000, hash: 'SHA-256' },
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
