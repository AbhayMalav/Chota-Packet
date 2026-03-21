/**
 * Copies text to the clipboard.
 * Primary path: navigator.clipboard (modern browsers, HTTPS required).
 * Fallback path: temporary textarea + execCommand (older browsers / non-HTTPS).
 *
 * Non-string values are coerced via String(). Returns false on empty input
 * or if both copy paths fail.
 *
 * @param {*} text - The value to copy. Will be coerced to string.
 * @returns {Promise<boolean>} True if the copy succeeded, false otherwise.
 */
export async function copyToClipboard(text) {
  const str = String(text ?? '')
  if (!str) return false

  // Primary path — requires HTTPS and user permission
  try {
    await navigator.clipboard.writeText(str)
    return true
  } catch {
    // Fallback: deprecated execCommand — retained for non-HTTPS / older WebViews
    const textarea = document.createElement('textarea')
    textarea.value = str
    textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(textarea)
    try {
      textarea.select()
      return document.execCommand('copy') // eslint-disable-line no-restricted-globals
    } catch {
      return false
    } finally {
      // Guaranteed cleanup — runs even if select() or execCommand throws
      document.body.removeChild(textarea)
    }
  }
}
