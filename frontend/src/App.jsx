import React, { useState, useEffect, useCallback, useReducer } from 'react'
import { health } from './services/api'
import { useEnhance } from './hooks/useEnhance'
import { useSettings } from './hooks/useSettings'
import { STYLES, TONES, LEVELS, LS_ONBOARDED, HISTORY_LIMIT } from './constants'

import StatusBanner from './components/StatusBanner'
import InputArea from './components/InputArea'
import ControlBar from './components/ControlBar'
import OutputCard from './components/OutputCard'
import DiffView from './components/DiffView'
import HistoryPanel from './components/HistoryPanel'
import SettingsModal from './components/SettingsModal'
import MicButton from './components/MicButton'
import OnboardingOverlay from './components/OnboardingOverlay'

// ── App state machine ────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'INPUT_CHANGED': return { ...state, input: action.value, uiState: action.value.trim() ? 'INPUT_READY' : 'IDLE' }
    case 'LOADING':       return { ...state, uiState: 'LOADING' }
    case 'SUCCESS':       return { ...state, uiState: 'OUTPUT', outputText: action.text, originalText: state.input }
    case 'ERROR':         return { ...state, uiState: 'ERROR' }
    case 'OUTPUT_EDIT':   return { ...state, outputText: action.text }
    case 'RESET':         return { ...state, uiState: state.input.trim() ? 'INPUT_READY' : 'IDLE', outputText: '', originalText: '' }
    default:              return state
  }
}

const init = { uiState: 'IDLE', input: '', outputText: '', originalText: '' }

// ── Component ────────────────────────────────────────────────────────────────
export default function App() {
  const settings = useSettings()
  const { openRouterKey, inferenceMode, selectedModel, darkMode, toggleDark } = settings

  const [appState, dispatch] = useReducer(appReducer, init)
  const { uiState, input, outputText, originalText } = appState

  // Controls
  const [style, setStyle]         = useState('general')
  const [tone, setTone]           = useState('')
  const [level, setLevel]         = useState('basic')
  const [inputLang, setInputLang] = useState('en')
  const [outputLang, setOutputLang] = useState('auto')

  // UI panels
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [diffOpen, setDiffOpen]         = useState(false)
  const [showOnboard, setShowOnboard]   = useState(() => !localStorage.getItem(LS_ONBOARDED))

  // Backend health
  const [backendStatus, setBackendStatus] = useState('loading')

  // Session history (in-memory, capped)
  const [history, setHistory] = useState([])

  // Enhance hook
  const { run: runEnhance, error: enhanceError } = useEnhance()

  // ─── Health check on mount ───────────────────────────────────────────────
  useEffect(() => {
    health()
      .then(({ data }) => setBackendStatus(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setBackendStatus('error'))
  }, [])

  // ─── Core enhance action ─────────────────────────────────────────────────
  const handleEnhance = useCallback(async (variantMode = false) => {
    if (!input.trim()) return
    dispatch({ type: 'LOADING' })
    const payload = {
      text: input,
      input_lang: inputLang,
      output_lang: outputLang,
      style,
      tone,
      enhancement_level: level,
      variant_mode: variantMode,
      inference_mode: inferenceMode,
      model: selectedModel || undefined,
    }
    const data = await runEnhance(payload, openRouterKey)
    if (data?.enhanced_prompt) {
      dispatch({ type: 'SUCCESS', text: data.enhanced_prompt })
      setHistory((prev) => [{ input, enhanced: data.enhanced_prompt, ts: Date.now() }, ...prev].slice(0, HISTORY_LIMIT))
    } else {
      dispatch({ type: 'ERROR' })
    }
  }, [input, inputLang, outputLang, style, tone, level, inferenceMode, selectedModel, openRouterKey, runEnhance])

  // ─── Keyboard shortcuts (T-38) ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleEnhance() }
      if (e.key === 'Escape') { setSettingsOpen(false); setHistoryOpen(false); setDiffOpen(false) }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        navigator.clipboard.writeText(outputText).catch(() => {})
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleEnhance, outputText])

  const isLoading = uiState === 'LOADING'
  const hasOutput = uiState === 'OUTPUT' && outputText

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900
                    text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">

      {/* Overlays */}
      {showOnboard && <OnboardingOverlay onDone={() => setShowOnboard(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} settings={settings} />}
      {diffOpen && originalText && outputText && (
        <DiffView original={originalText} enhanced={outputText} onClose={() => setDiffOpen(false)} />
      )}
      <HistoryPanel
        history={history}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(item) => dispatch({ type: 'INPUT_CHANGED', value: item.input })}
      />

      {/* Main layout */}
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6 min-h-screen">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              Chota Packet
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Edge AI Prompt Enhancer</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Inference mode badge */}
            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide
                              ${inferenceMode === 'cloud'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300'}`}>
              {inferenceMode}
            </span>
            <button onClick={() => setHistoryOpen(!historyOpen)}
                    aria-label="Toggle history" title="Session history"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg">📋</button>
            <button onClick={() => setSettingsOpen(true)}
                    aria-label="Open settings"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg">⚙</button>
            <button onClick={toggleDark}
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Status banner */}
        <StatusBanner status={backendStatus} />

        {/* Main card */}
        <main className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50
                          shadow-sm p-5 flex flex-col gap-5 backdrop-blur-sm">
          <InputArea
            value={input}
            onChange={(v) => dispatch({ type: 'INPUT_CHANGED', value: v })}
            inputLang={inputLang}
            onLangChange={setInputLang}
          >
            <MicButton onTranscript={(t) => dispatch({ type: 'INPUT_CHANGED', value: t })} lang={inputLang} />
          </InputArea>

          <ControlBar
            style={style} onStyleChange={setStyle}
            tone={tone} onToneChange={setTone}
            level={level} onLevelChange={setLevel}
            outputLang={outputLang} onOutputLangChange={setOutputLang}
            onEnhance={() => handleEnhance(false)}
            onRegenerate={() => handleEnhance(true)}
            loading={isLoading}
            canEnhance={!!input.trim()}
            showRegen={!!hasOutput}
          />

          {/* Error state */}
          {uiState === 'ERROR' && enhanceError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30
                            text-red-700 dark:text-red-300 px-4 py-3 text-sm" role="alert">
              ⚠ {enhanceError}
            </div>
          )}

          {/* Output */}
          {hasOutput && (
            <OutputCard
              text={outputText}
              onTextChange={(t) => dispatch({ type: 'OUTPUT_EDIT', text: t })}
              onCompare={() => setDiffOpen(true)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-300 dark:text-gray-600">
          <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1">Ctrl+Enter</kbd> = Enhance ·{' '}
          <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1">Esc</kbd> = Close ·{' '}
          <kbd className="border border-gray-200 dark:border-gray-700 rounded px-1">Ctrl+Shift+C</kbd> = Copy
        </footer>
      </div>
    </div>
  )
}
