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
import { NavBtn } from './components/NavBar'
import ErrorBoundary from './components/ErrorBoundary'
import ShortcutsModal from './components/ShortcutsModal'

// ── App state machine ────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'INPUT_CHANGED': return { ...state, input: action.value, uiState: action.value.trim() ? 'INPUT_READY' : 'IDLE', error: null }
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
  const [style, setStyle]           = useState('general')
  const [tone, setTone]             = useState('')
  const [level, setLevel]           = useState('basic')
  const [inputLang, setInputLang]   = useState('en')
  const [outputLang, setOutputLang] = useState('auto')

  // UI panels
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [diffOpen, setDiffOpen]         = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
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

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleEnhance() }
      if (e.key === 'Escape') { setSettingsOpen(false); setHistoryOpen(false); setDiffOpen(false); setShortcutsOpen(false); }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        navigator.clipboard.writeText(outputText).catch(() => {})
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch({ type: 'RESET' });
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setShortcutsOpen((s) => !s);
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleEnhance, outputText])

  const isLoading = uiState === 'LOADING'
  const hasOutput = uiState === 'OUTPUT' && outputText

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>

      {/* ── Nebula orbs ── */}
      <div className="nebula-orb-1 animate-nebula" aria-hidden="true" />
      <div className="nebula-orb-2" aria-hidden="true" style={{ animationDelay: '7s' }} />
      <div className="nebula-orb-3" aria-hidden="true" />

      {/* ── Overlays ── */}
      {showOnboard && <OnboardingOverlay onDone={() => setShowOnboard(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} settings={settings} onShowShortcuts={() => { setSettingsOpen(false); setShortcutsOpen(true); }} />}
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {diffOpen && originalText && outputText && (
        <DiffView original={originalText} enhanced={outputText} onClose={() => setDiffOpen(false)} />
      )}
      <HistoryPanel
        history={history}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={(item) => dispatch({ type: 'INPUT_CHANGED', value: item.input })}
      />

      {/* ── Main layout ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 min-h-screen">

        {/* ── Navbar ── */}
        <header className="glass-navbar rounded-2xl px-5 py-3.5 flex items-center justify-between sticky top-4 z-20 animate-fade-in">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight gradient-text leading-none">
                Chota Packet
              </h1>
              <p className="text-[10px] text-purple-400/60 mt-0.5 font-medium tracking-widest uppercase">
                Edge AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Inference badge */}
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border
              ${inferenceMode === 'cloud'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              {inferenceMode === 'cloud' ? '☁ Cloud' : '🏠 Local'}
            </span>

            <NavBtn onClick={() => setHistoryOpen(!historyOpen)} label="Session history" icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
              </svg>
            }/>
            <NavBtn onClick={() => setSettingsOpen(true)} label="Settings" icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.992 6.992 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            }/>
            <NavBtn onClick={toggleDark} label={darkMode ? 'Light mode' : 'Dark mode'} icon={
              darkMode
                ? <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            }/>
          </div>
        </header>

        {/* ── Status banner ── */}
        <StatusBanner status={backendStatus} />

        {/* ── Main card ── */}
        <ErrorBoundary>
          <main className="glass-card rounded-2xl gradient-border p-6 flex flex-col gap-5 animate-fade-in animate-glow">
            <InputArea
              value={input}
              onChange={(v) => dispatch({ type: 'INPUT_CHANGED', value: v })}
              inputLang={inputLang}
              onLangChange={setInputLang}
              onClear={() => dispatch({ type: 'RESET' })}
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
            <div className="rounded-xl border border-red-500/20 bg-red-500/8
                            text-red-400 px-4 py-3 text-sm flex items-center gap-2 animate-fade-in" role="alert">
              <span>⚠️</span>
              <span>{enhanceError}</span>
            </div>
          )}

          {/* Output */}
          {hasOutput && (
            <OutputCard
              text={outputText}
              onTextChange={(t) => dispatch({ type: 'OUTPUT_EDIT', text: t })}
              onCompare={() => setDiffOpen(true)}
              onClear={() => dispatch({ type: 'RESET' })}
            />
          )}
        </main>
        </ErrorBoundary>

        {/* ── Footer ── */}
        <footer className="h-4"></footer>
      </div>
    </div>
  )
}

