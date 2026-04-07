function escapeMarkdown(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}


export function formatAsMarkdown(items) {
  return items.map((item) => {
    const prompt = escapeMarkdown(item.prompt ?? item.input ?? '')
    const output = escapeMarkdown(item.output ?? item.enhanced ?? '')
    return `## Prompt\n${prompt}\n\n## Enhanced\n${output}`
  }).join('\n\n---\n\n')
}


export function formatAsPlainText(items) {
  return items.map((item) => {
    const prompt = item.prompt ?? item.input ?? ''
    const output = item.output ?? item.enhanced ?? ''
    return `PROMPT:\n${prompt}\n\nENHANCED:\n${output}`
  }).join('\n\n===\n\n')
}


export function formatAsJSON(items) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id ?? item.ts ?? null,
      prompt: item.prompt ?? item.input ?? '',
      output: item.output ?? item.enhanced ?? '',
      timestamp: item.ts ?? null,
      pinned: item.pinned ?? false,
    })),
    null,
    2
  )
}
