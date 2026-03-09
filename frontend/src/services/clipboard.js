/**
 * Clipboard utility with navigator.clipboard primary path
 * and execCommand('copy') fallback for older browsers.
 *
 * @param {string} text - The text to copy to clipboard.
 * @returns {Promise<boolean>} - Whether the copy succeeded.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback: temporary textarea + execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
