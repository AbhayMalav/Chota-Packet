import { formatAsMarkdown, formatAsPlainText, formatAsJSON } from '../utils/formatters'

const CHUNK_SIZE = 50

const formatMap = {
  markdown: { ext: 'md', mime: 'text/markdown', formatter: formatAsMarkdown },
  plaintext: { ext: 'txt', mime: 'text/plain', formatter: formatAsPlainText },
  json: { ext: 'json', mime: 'application/json', formatter: formatAsJSON },
}

function triggerDownload(content, filename, mime) {
  if (typeof URL === 'undefined' || !URL.createObjectURL) {
    console.error('[exportService] Blob download not supported in this environment')
    return
  }
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function sanitizeItem(item) {
  const id = item.id ?? item.ts ?? null
  const prompt = item.prompt ?? item.input ?? ''
  const output = item.output ?? item.enhanced ?? ''
  if (!output) {
    console.warn('[exportService] Exporting item with no output:', id)
  }
  return { ...item, id, prompt, output, ts: item.ts ?? null, pinned: item.pinned ?? false }
}

async function serializeChunk(items, format, start, end) {
  const chunk = items.slice(start, end).map(sanitizeItem)
  const { formatter } = formatMap[format]
  return formatter(chunk)
}

export function exportSingleItem(item, format) {
  const sanitized = sanitizeItem(item)
  const formatEntry = formatMap[format]
  if (!formatEntry) {
    throw new Error(`Unsupported export format: ${format}`)
  }
  const { ext, mime, formatter } = formatEntry
  const timestamp = item.ts ?? Date.now()
  const filename = `chota-packet-${timestamp}.${ext}`
  const content = formatter([sanitized])
  triggerDownload(content, filename, mime)
}

export async function exportBulk(items, format) {
  if (!items || items.length === 0) {
    console.warn('[exportService] Nothing to export')
    return false
  }

  const formatEntry = formatMap[format]
  if (!formatEntry) {
    throw new Error(`Unsupported export format: ${format}`)
  }
  const { ext, mime, formatter } = formatEntry
  const filename = `chota-packet-export.${ext}`

  if (items.length <= CHUNK_SIZE) {
    const sanitized = items.map(sanitizeItem)
    const content = formatter(sanitized)
    triggerDownload(content, filename, mime)
    return true
  }

  const chunks = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(items.slice(i, i + CHUNK_SIZE).map(sanitizeItem))
      }, 0)
    })
    chunks.push(chunk)
  }

  const allItems = chunks.flat()
  const content = formatter(allItems)
  triggerDownload(content, filename, mime)
  return true
}

export function getExportFilename(format, isBulk) {
  const { ext } = formatMap[format]
  if (isBulk) return `chota-packet-export.${ext}`
  return `chota-packet-${Date.now()}.${ext}`
}
