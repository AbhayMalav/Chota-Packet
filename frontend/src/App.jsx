import React, { useState, useEffect, useCallback, useReducer } from 'react'
import { health } from './services/api'
import useEnhance from './hooks/useEnhance'
import useSettings from './hooks/useSettings'
import useMediaQuery from './hooks/useMediaQuery'
import { LSONBOARDED, HISTORYLIMIT, MAXINPUTCHARS } from './constants'
import CONFIG from './config'
import StatusBanner from './components/StatusBanner'
import InputArea from './components/InputArea'
import ControlBar from './components/ControlBar'
import OutputCard from './components/OutputCard'
import DiffView from './components/DiffView'
import HistoryPanel from './components/HistoryPanel'
import SettingsModal from './components/SettingsModal'
import MicButton from './components/MicButton'
import OnboardingOverlay from './components/OnboardingOverlay'
import NavBtn from './components/NavBar'
import ErrorBoundary from './components/ErrorBoundary'
import ShortcutsModal from './components/ShortcutsModal'
import { ClockIcon, GearIcon, SunIcon, MoonIcon } from './components/icons'

// ─── State machine ────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    case 'INPUT_CHANGED':
      return { ...state, input: action.value, uiState: action.value.trim() ? 'INPUT_READY' : 'IDLE' }
    case 'LOADING':
      return { ...state, uiState: 'LOADING' }
    case 'SUCCESS':
      return { ...state, uiState: 'OUTPUT', outputText: action.text, originalText: state.input }
    case 'ERROR':
      // Clear stale output so previous result is never shown alongside an error
      return { ...state, uiState: 'ERROR', outputText: '', originalText: '' }
    case 'OUTPUT_EDIT':
      return { ...state, outputText: action.text }
    case 'RESET':
      // Clears output only — keeps input intact, used by OutputCard's Clear button
      return { ...state, uiState: state.input.trim() ? 'INPUT_READY' : 'IDLE', outputText: '', originalText: '' }
    case 'FULL_RESET':
      // Clears everything — Ctrl+K shortcut
      return { uiState: 'IDLE', input: '', outputText: '', originalText: '' }
    default:
      return state
  }
}

const init = { uiState: 'IDLE', input: '', outputText: '', originalText: '' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const settings = useSettings()
  const { openRouterKey, inferenceMode, selectedModel, saveModel, models, darkMode, toggleDark } = settings

  const [appState, dispatch] = useReducer(appReducer, init)
  const { uiState, input, outputText, originalText } = appState

  // Controls
  const [style,      setStyle]      = useState('general')
  const [tone,       setTone]       = useState('')
  const [level,      setLevel]      = useState('basic')
  const [outputLang, setOutputLang] = useState('auto')
  // inputLang drives both MicButton and API payload
  const inputLang = 'en'

  // UI panels
  const [historyOpen,   setHistoryOpen]   = useState(false)
  const [settingsOpen,  setSettingsOpen]  = useState(false)
  const [diffOpen,      setDiffOpen]      = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [showOnboard,   setShowOnboard]   = useState(!localStorage.getItem(LSONBOARDED))

  // Backend health
  const [backendStatus, setBackendStatus] = useState('loading')

  // Session history — in-memory, capped
  const [history, setHistory] = useState([])

  // Enhance hook
  const { run: runEnhance } = useEnhance()

  // Responsive layout
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Derived
  const inputLimit = inferenceMode === 'cloud' ? 4096 : MAXINPUTCHARS
  const isLoading  = uiState === 'LOADING'
  const hasOutput  = uiState === 'OUTPUT' && !!outputText

  // ── Health check on mount ─────────────────────────────────────────────────
  useEffect(() => {
    health()
      .then(data => setBackendStatus(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setBackendStatus('error'))
  }, [])

  // ── Core enhance action ───────────────────────────────────────────────────
  const handleEnhance = useCallback(async (variantMode = false) => {
    if (!input.trim()) return
    dispatch({ type: 'LOADING' })

    const payload = {
      text:              input,
      input_lang:        inputLang,
      output_lang:       outputLang,
      style,
      tone,
      enhancement_level: level,
      variant_mode:      variantMode,
      inference_mode:    inferenceMode,
      model:             selectedModel || undefined,
    }

    try {
      const data = await runEnhance(payload, openRouterKey)
      if (data?.enhanced_prompt) {
        dispatch({ type: 'SUCCESS', text: data.enhanced_prompt })
        setHistory(prev => [
          { input, enhanced: data.enhanced_prompt, ts: Date.now() },
          ...prev.slice(0, HISTORYLIMIT - 1),
        ])
      } else {
        dispatch({ type: 'ERROR' })
      }
    } catch (err) {
      console.warn('[App] Enhancement failed:', err)
      dispatch({ type: 'ERROR' })
    }
  }, [input, inputLang, outputLang, style, tone, level, inferenceMode, selectedModel, openRouterKey, runEnhance])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    // Alt+1–5 level map
    const LEVEL_MAP = {
      '1': 'basic',
      '2': 'detailed',
      '3': 'advanced',
      '4': 'chain-of-thought',
      '5': 'meta',
    }

    const handler = (e) => {
      const active  = document.activeElement
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable

      // Escape — close all panels (always fires)
      if (e.key === 'Escape') {
        setSettingsOpen(false)
        setHistoryOpen(false)
        setDiffOpen(false)
        setShortcutsOpen(false)
        return
      }

      // Shortcuts allowed through from inside input/textarea
      if (inInput) {
        if (e.ctrlKey && e.key === 'Enter')                         { e.preventDefault(); handleEnhance();      return }
        if (e.ctrlKey && e.shiftKey && e.key === 'R' && hasOutput)  { e.preventDefault(); handleEnhance(true); return }
        return
      }

      // ── Shortcuts only active when focus is NOT in a form field ──────────

      // Enhance / Regenerate
      if (e.ctrlKey && e.key === 'Enter')                         { e.preventDefault(); handleEnhance();                                              return }
      if (e.ctrlKey && e.shiftKey && e.key === 'R' && hasOutput)  { e.preventDefault(); handleEnhance(true);                                         return }

      // Output
      if (e.ctrlKey && e.shiftKey && e.key === 'C')               { e.preventDefault(); navigator.clipboard.writeText(outputText).catch(() => {});   return }
      if (e.ctrlKey && e.shiftKey && e.key === 'X')               { e.preventDefault(); dispatch({ type: 'RESET' });                                 return }

      // Reset
      if (e.ctrlKey && e.key.toLowerCase() === 'k')               { e.preventDefault(); dispatch({ type: 'FULL_RESET' });                            return }

      // Panels
      if (e.ctrlKey && e.key.toLowerCase() === 'h')               { e.preventDefault(); setHistoryOpen(o => !o);                                     return }
      if (e.ctrlKey && e.key === ',')                              { e.preventDefault(); setSettingsOpen(true);                                       return }
      if (e.ctrlKey && e.key.toLowerCase() === 'i')               { e.preventDefault(); setShortcutsOpen(s => !s);                                   return }

      // Theme
      if (e.ctrlKey && e.shiftKey && e.key === 'D')               { e.preventDefault(); toggleDark();                                                return }

      // Alt + 1–5 — enhancement level presets
      if (e.altKey && !e.ctrlKey && !e.shiftKey && LEVEL_MAP[e.key]) {
        e.preventDefault()
        setLevel(LEVEL_MAP[e.key])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleEnhance, outputText, hasOutput, toggleDark])

  return (
    <ErrorBoundary>
      <div className={darkMode ? 'light' : ''} style={{ minHeight: '100vh', position: 'relative' }}>

        {/* Nebula background orbs */}
        <div className="nebula-orb-1 animate-nebula" aria-hidden="true" />
        <div className="nebula-orb-2 animate-nebula" aria-hidden="true" />
        <div className="nebula-orb-3" aria-hidden="true" />

        {/* Navbar */}
        <header className="glass-navbar sticky top-0 z-30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm gradient-text tracking-tight">Chota Packet</span>
          </div>
          <nav className="flex items-center gap-1" aria-label="App controls">
            <NavBtn onClick={() => setHistoryOpen(o => !o)}   label="Session History"                              icon={ClockIcon}                  active={historyOpen}  />
            <NavBtn onClick={() => setSettingsOpen(true)}      label="Settings"                                     icon={GearIcon}                   active={settingsOpen} />
            <NavBtn onClick={toggleDark}                       label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} icon={darkMode ? SunIcon : MoonIcon} />
          </nav>
        </header>

        {/* Backend status banner */}
        {CONFIG.SHOWBACKENDSTATUSBAR && <StatusBanner status={backendStatus} />}

        {/* Main layout */}
        <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>

          {/* History sidebar */}
          <HistoryPanel
            history={history}
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            onSelect={(item) => {
              dispatch({ type: 'INPUT_CHANGED', value: item.input })
              if (!isDesktop) setHistoryOpen(false)
            }}
          />

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center px-4 py-6 gap-5 relative z-10 max-w-2xl mx-auto w-full">

            {/* Input area */}
            <div className="w-full glass-card gradient-border rounded-2xl p-4 animate-glow">
              <InputArea
                value={input}
                onChange={(val) => dispatch({ type: 'INPUT_CHANGED', value: val })}
                onClear={() => dispatch({ type: 'RESET' })}
                inputLimit={inputLimit}
              />
              <MicButton
                lang={inputLang}
                onTranscript={(text) => dispatch({ type: 'INPUT_CHANGED', value: text })}
              />
            </div>

            {/* Controls */}
            <div className="w-full">
              <ControlBar
                style={style}           onStyleChange={setStyle}
                tone={tone}             onToneChange={setTone}
                level={level}           onLevelChange={setLevel}
                outputLang={outputLang} onOutputLangChange={setOutputLang}
                onEnhance={() => handleEnhance(false)}
                onRegenerate={() => handleEnhance(true)}
                loading={isLoading}
                canEnhance={!!input.trim() && !isLoading}
                showRegen={hasOutput}
                models={models}
                selectedModel={selectedModel}
                onModelChange={saveModel}
              />
            </div>

            {/* Error state */}
            {uiState === 'ERROR' && (
              <div
                role="alert"
                className="w-full text-center text-sm py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 animate-fade-in"
                style={{ color: '#f87171' }}
              >
                Enhancement failed. Please check your connection or API key and try again.
              </div>
            )}

            {/* Output card */}
            {hasOutput && (
              <div className="w-full animate-fade-in">
                <OutputCard
                  text={outputText}
                  onTextChange={(text) => dispatch({ type: 'OUTPUT_EDIT', text })}
                  onCompare={() => setDiffOpen(true)}
                  onClear={() => dispatch({ type: 'RESET' })}
                />
              </div>
            )}

          </main>
        </div>

        {/* Modals */}
        {diffOpen      && <DiffView original={originalText} enhanced={outputText} onClose={() => setDiffOpen(false)} />}
        {settingsOpen  && <SettingsModal settings={settings} onClose={() => setSettingsOpen(false)} onShowShortcuts={() => { setSettingsOpen(false); setShortcutsOpen(true) }} />}
        {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
        {showOnboard   && <OnboardingOverlay onDone={() => setShowOnboard(false)} />}

      </div>
    </ErrorBoundary>
  )
}
