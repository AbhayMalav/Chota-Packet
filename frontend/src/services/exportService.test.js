import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportSingleItem, exportBulk } from './exportService'
import { formatAsMarkdown, formatAsPlainText, formatAsJSON } from '../utils/formatters'


describe('exportService', () => {
  let mockCreateObjectURL
  let mockRevokeObjectURL
  let mockClick
  let mockAppendChild
  let mockRemoveChild
  let mockA

  beforeEach(() => {
    mockClick = vi.fn()
    mockAppendChild = vi.fn()
    mockRemoveChild = vi.fn()
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
    mockRevokeObjectURL = vi.fn()

    mockA = {
      click: mockClick,
      href: '',
      download: '',
    }

    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL
    global.document.createElement = vi.fn(() => mockA)
    global.document.body.appendChild = mockAppendChild
    global.document.body.removeChild = mockRemoveChild

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })


  it('formats single item as correct Markdown string', () => {
    const item = { id: '1', prompt: 'Hello', output: 'World', ts: 123 }
    const result = formatAsMarkdown([item])
    expect(result).toBe('## Prompt\nHello\n\n## Enhanced\nWorld')
  })


  it('formats single item as correct plain text string', () => {
    const item = { id: '1', prompt: 'Hello', output: 'World', ts: 123 }
    const result = formatAsPlainText([item])
    expect(result).toBe('PROMPT:\nHello\n\nENHANCED:\nWorld')
  })


  it('formats single item as valid JSON string', () => {
    const item = { id: '1', prompt: 'Hello', output: 'World', ts: 123, pinned: false }
    const result = formatAsJSON([item])
    const parsed = JSON.parse(result)
    expect(parsed).toEqual([{
      id: '1',
      prompt: 'Hello',
      output: 'World',
      timestamp: 123,
      pinned: false,
    }])
  })


  it('formats multiple items with correct separators', () => {
    const items = [
      { id: '1', prompt: 'A', output: 'B', ts: 1 },
      { id: '2', prompt: 'C', output: 'D', ts: 2 },
    ]
    const md = formatAsMarkdown(items)
    expect(md).toContain('\n\n---\n\n')

    const txt = formatAsPlainText(items)
    expect(txt).toContain('\n\n===\n\n')
  })


  it('item with missing output exports with empty output string + warns', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const item = { id: 'no-output', prompt: 'Test' }

    exportSingleItem(item, 'markdown')

    expect(console.warn).toHaveBeenCalledWith(
      '[exportService] Exporting item with no output:',
      'no-output'
    )

    const md = formatAsMarkdown([item])
    expect(md).toContain('## Enhanced\n')
    expect(md).not.toContain('## Enhanced\nundefined')

    console.warn.mockRestore()
  })


  it('special characters are safely escaped in Markdown output', () => {
    const item = {
      id: '1',
      prompt: 'What is <code> & "quotes"?',
      output: 'Use `backticks` and # headings',
      ts: 123,
    }
    const md = formatAsMarkdown([item])
    expect(md).toContain('\\<code\\>')
    expect(md).toContain('\\#')
    expect(md).toContain('\\`')
  })


  it('special characters are safely escaped in JSON output', () => {
    const item = {
      id: '1',
      prompt: 'What is <code> & "quotes"?',
      output: 'Use `backticks` and # headings',
      ts: 123,
    }
    const json = formatAsJSON([item])
    expect(() => JSON.parse(json)).not.toThrow()
    const parsed = JSON.parse(json)
    expect(parsed[0].prompt).toBe('What is <code> & "quotes"?')
    expect(parsed[0].output).toBe('Use `backticks` and # headings')
  })


  it('logs error when createObjectURL is unavailable', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const mockCreateObjectURL = vi.fn()
    const originalCreateObjectURL = global.URL.createObjectURL
    global.URL.createObjectURL = undefined

    exportSingleItem({ id: '1', prompt: 'Test', output: 'Result' }, 'markdown')

    expect(console.error).toHaveBeenCalledWith(
      '[exportService] Blob download not supported in this environment'
    )

    global.URL.createObjectURL = originalCreateObjectURL
    console.error.mockRestore()
  })


  it('exportSingleItem triggers download with correct filename', () => {
    const item = { id: '1', prompt: 'Test', output: 'Result', ts: 999 }

    exportSingleItem(item, 'json')

    expect(mockA.download).toBe('chota-packet-999.json')
    expect(mockClick).toHaveBeenCalled()
  })


  it('exportBulk triggers download with correct bulk filename', async () => {
    const items = [
      { id: '1', prompt: 'A', output: 'B', ts: 1 },
      { id: '2', prompt: 'C', output: 'D', ts: 2 },
    ]

    await exportBulk(items, 'markdown')

    expect(mockA.download).toBe('chota-packet-export.md')
    expect(mockClick).toHaveBeenCalled()
  })


  it('exportBulk returns false when items array is empty', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await exportBulk([], 'markdown')
    expect(result).toBe(false)
    expect(mockClick).not.toHaveBeenCalled()
    console.warn.mockRestore()
  })


  it('exportBulk on null items returns false', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await exportBulk(null, 'markdown')
    expect(result).toBe(false)
    expect(mockClick).not.toHaveBeenCalled()
    console.warn.mockRestore()
  })
})
