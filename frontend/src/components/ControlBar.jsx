import React from 'react'
import { STYLES, TONES, LEVELS, OUT_LANGS } from '../constants'

function PillSelect({ id, label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
      <label htmlFor={id}
             className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-full border border-purple-500/15 bg-black/30
                   text-gray-300 text-xs px-3 py-2
                   focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/30
                   disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
                   transition-all duration-200 hover:border-purple-500/30
                   hover:bg-purple-500/5 appearance-none"
      >
        {options.map((o) => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
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
    <div className="flex flex-col gap-4">
      {/* Pill dropdowns row */}
      <div className="flex flex-wrap gap-2.5">
        <PillSelect id="style-select"   label="Style"  value={style}      onChange={onStyleChange}      options={STYLES}    disabled={loading} />
        <PillSelect id="tone-select"    label="Tone"   value={tone}       onChange={onToneChange}       options={TONES}     disabled={loading} />
        <PillSelect id="level-select"   label="Level"  value={level}      onChange={onLevelChange}      options={LEVELS}    disabled={loading} />
        <PillSelect id="outlang-select" label="Output" value={outputLang} onChange={onOutputLangChange} options={OUT_LANGS} disabled={loading} />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        {/* Enhance button */}
        <button
          id="enhance-btn"
          onClick={onEnhance}
          disabled={!canEnhance || loading}
          aria-label="Enhance prompt"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full
                     gradient-brand text-white font-semibold text-sm tracking-wide
                     shadow-lg shadow-purple-500/30
                     hover:shadow-xl hover:shadow-purple-500/40 hover:brightness-110
                     active:brightness-90 active:scale-[0.98]
                     disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none
                     transition-all duration-200"
        >
          {loading
            ? <><LoadSpinner /> Enhancing…</>
            : <><span aria-hidden="true">✨</span> Enhance</>}
        </button>

        {/* Regenerate button */}
        {showRegen && !loading && (
          <button
            id="regen-btn"
            onClick={onRegenerate}
            title="Regenerate with variation"
            aria-label="Regenerate"
            className="flex items-center gap-1.5 px-4 py-3 rounded-full
                       border border-purple-500/25 text-purple-400 text-sm font-medium
                       hover:bg-purple-500/10 hover:border-purple-500/40
                       transition-all duration-200 whitespace-nowrap"
          >
            <span>🔄</span>
            <span>Regen</span>
          </button>
        )}
      </div>
    </div>
  )
}

function LoadSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z"/>
    </svg>
  )
}
