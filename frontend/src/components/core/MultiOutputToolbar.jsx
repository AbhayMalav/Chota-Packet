import React, { useState } from 'react'
import { Delete, Check } from 'lucide-react'
import { RegenerateIcon, ClipboardIcon } from '../ui/icons'
import { translations } from '../../config/translations'
import { useTheme } from '../../context/ThemeContext'
import './MultiOutputToolbar.css'

export default function MultiOutputToolbar({ 
  outputs = [], 
  onCopyAll, 
  onRegenerateAll, 
  onClearAll 
}) {
  const { language } = useTheme()
  const t = translations[language] || translations.en

  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopyAll = async () => {
    const allText = outputs.map(o => o.text).join('\n\n---\n\n')
    try {
      if (onCopyAll) {
        await onCopyAll(allText)
      } else {
        await navigator.clipboard.writeText(allText)
      }
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch (err) {
      console.warn('Failed to copy:', err)
    }
  }

  if (!outputs || outputs.length === 0) return null

  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <span className="toolbar__count">
          {outputs.length} {outputs.length === 1 ? (t.variant || 'variant') : (t.variants || 'variants')}
        </span>
      </div>

      <div className="toolbar__right">
        {/* Copy All */}
        <button
          onClick={handleCopyAll}
          className={`toolbar-btn toolbar-btn--primary ${copiedAll ? 'copied' : ''}`}
        >
          {copiedAll ? <Check className="w-3 h-3" /> : <ClipboardIcon className="w-3 h-3" />}
          {copiedAll ? (t.copied || 'Copied') : (t.copyAll || 'Copy All')}
        </button>

        {/* Regenerate All */}
        <button
          onClick={() => onRegenerateAll?.()}
          className="toolbar-btn toolbar-btn--primary"
        >
          <RegenerateIcon className="w-3 h-3" />
          {t.regenAll || 'Regen All'}
        </button>

        {/* Clear All */}
        <button
          onClick={() => onClearAll?.()}
          className="toolbar-btn toolbar-btn--danger"
        >
          <Delete className="w-3 h-3" />
          {t.clearAll || 'Clear All'}
        </button>
      </div>
    </div>
  )
}
