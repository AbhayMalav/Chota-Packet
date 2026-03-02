import React from 'react'
import { STYLES, TONES, LEVELS, OUT_LANGS } from '../constants'

function Select({ id, label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
      <label htmlFor={id} className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-gray-200 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   text-sm px-2 py-1.5 focus:ring-2 focus:ring-violet-500 focus:outline-none
                   disabled:opacity-50 cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function ControlBar({
  style, onStyleChange,
  tone, onToneChange,
  level, onLevelChange,
  outputLang, onOutputLangChange,
  onEnhance, onRegenerate,
  loading, canEnhance, showRegen,
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Dropdowns row */}
      <div className="flex flex-wrap gap-2">
        <Select id="style-select" label="Style" value={style} onChange={onStyleChange} options={STYLES} disabled={loading} />
        <Select id="tone-select" label="Tone" value={tone} onChange={onToneChange} options={TONES} disabled={loading} />
        <Select id="level-select" label="Level" value={level} onChange={onLevelChange} options={LEVELS} disabled={loading} />
        <Select id="outlang-select" label="Output Lang" value={outputLang} onChange={onOutputLangChange} options={OUT_LANGS} disabled={loading} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          id="enhance-btn"
          onClick={onEnhance}
          disabled={!canEnhance || loading}
          aria-label="Enhance prompt"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                     bg-violet-600 hover:bg-violet-700 active:bg-violet-800
                     text-white font-semibold text-sm transition
                     disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-500/20"
        >
          {loading
            ? <><Spinner /> Enhancing…</>
            : <><SparkIcon /> Enhance</>}
        </button>

        {showRegen && !loading && (
          <button
            id="regen-btn"
            onClick={onRegenerate}
            title="Regenerate with sampling"
            aria-label="Regenerate"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                       text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                       transition"
          >
            🔄
          </button>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z" />
    </svg>
  )
}

function SparkIcon() {
  return <span aria-hidden="true">✨</span>
}
