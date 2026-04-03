import React, { useState, useEffect, useCallback, useReducer } from 'react'
import { health } from '../services/api'
import useEnhance from '../hooks/useEnhance'
import useSettings from '../hooks/useSettings'
import useRecorder from '../hooks/useRecorder'
import { LS_ONBOARDED, HISTORY_LIMIT, MAX_INPUT_CHARS } from '../config/constants'

import { FEATURES } from '../config/config'
import StatusBanner from '../components/ui/StatusBanner'
import InputArea from '../components/core/InputArea'
import ControlBar from '../components/core/ControlBar'
import OutputCard from '../components/core/OutputCard'
import DiffView from '../components/core/DiffView'
import Sidebar from '../components/layout/Sidebar'
import SettingsModal from '../components/modals/SettingsModal'
import MicButton from '../components/ui/MicButton'
import OnboardingOverlay from '../components/modals/OnboardingOverlay'
import { NavBtn, ModeIndicator } from '../components/layout/NavBar'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import ShortcutsModal from '../components/modals/ShortcutsModal'
import { ClockIcon } from '../components/ui/icons'
import { SessionProvider } from '../context/Session'
import { useIncognito } from '../context/IncognitoContext'
import { appendHistoryItem } from '../services/historyService'

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
    case 'CLEAR_INPUT':
      // Clears input only — keeps output intact, used by InputArea's Clear button
      return { ...state, input: '', uiState: state.uiState === 'OUTPUT' ? 'OUTPUT' : 'IDLE' }
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

export default function Home() {
  const settings = useSettings()
  const { openRouterKey, inferenceMode, selectedModel, saveModel, models } = settings

  const [appState, dispatch] = useReducer(appReducer, init)
  const { uiState, input, outputText, originalText } = appState

  // Controls
  const [style, setStyle] = useState('general')
  const [tone, setTone] = useState('')
  const [level, setLevel] = useState('basic')
  const [outputLang, setOutputLang] = useState('auto')
  // inputLang drives both MicButton and API payload
  const inputLang = 'en'

  // UI panels
  const [diffOpen, setDiffOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [showOnboard, setShowOnboard] = useState(!localStorage.getItem(LS_ONBOARDED))

  // Backend health
  const [backendStatus, setBackendStatus] = useState('loading')

  // Session history — in-memory, capped
  const [history, setHistory] = useState([])

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Incognito Mode
  const { isIncognito } = useIncognito()

  // Enhance hook
  const { run: runEnhance, abort: abortEnhance } = useEnhance()

  const resetSession = useCallback(() => {
    try {
      if (typeof abortEnhance === 'function') {
        abortEnhance();
      }
    } catch {
      console.warn("Could not abort in-flight request on new thread");
    }
    dispatch({ type: 'FULL_RESET' });
  }, [abortEnhance]);

  // Voice hook - lifted for global shortcut control
  const { recording: isMicRecording, error: micError, start: startMic, stop: stopMic } = useRecorder({
    onTranscript: (text) => dispatch({ type: 'INPUT_CHANGED', value: text }),
    lang: inputLang
  })

  // Derived
  const inputLimit = inferenceMode === 'cloud' ? 4096 : MAX_INPUT_CHARS
  const isLoading = uiState === 'LOADING'
  const hasOutput = uiState === 'OUTPUT' && !!outputText

  // ── Health check on mount ─────────────────────────────────────────────────
  useEffect(() => {
    health()
      .then(response => setBackendStatus(response.data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setBackendStatus('error'))
  }, [])

  // ── Core enhance action ───────────────────────────────────────────────────
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

    try {
      const data = await runEnhance(payload, openRouterKey)
      if (data?.enhanced_prompt) {
        dispatch({ type: 'SUCCESS', text: data.enhanced_prompt })
        setHistory(prev => appendHistoryItem(
          prev, 
          { input, enhanced: data.enhanced_prompt, ts: Date.now() }, 
          isIncognito
        ))
      } else {
        dispatch({ type: 'ERROR' })
      }
    } catch (err) {
      console.warn('[App] Enhancement failed:', err)
      dispatch({ type: 'ERROR' })
    }
  }, [input, inputLang, outputLang, style, tone, level, inferenceMode, selectedModel, openRouterKey, runEnhance, isIncognito])

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
      const active = document.activeElement
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable

      // ─── Global Shortcuts (Always active) ───────────────────────────────────

      // Escape — close all panels
      if (e.key === 'Escape') {
        setDiffOpen(false)
        setShortcutsOpen(false)
        return
      }

      // Shortcuts Modal Reference sheet (Standard ? or Ctrl+/)
      if ((e.key === '?' && !inInput) || (e.ctrlKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsOpen(o => !o)
        return
      }

      // ─── Action Shortcuts ───────────────────────────────────────────────────

      // Enhance / Regenerate (Work even in input)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          if (hasOutput) handleEnhance(true) // Ctrl + Shift + Enter -> Regenerate
        } else {
          handleEnhance() // Ctrl + Enter -> Enhance
        }
        return
      }

      // Voice Input (Ctrl + Shift + M)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        if (isMicRecording) stopMic()
        else startMic().catch(() => { })
        return
      }

      // ─── Form-blocking Shortcuts (Only allowed if NOT in input, or using modifiers) ───

      // Copy output (Ctrl + Shift + C) - Standard in terminal style apps
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c' && hasOutput) {
        e.preventDefault()
        navigator.clipboard.writeText(outputText).catch(() => { })
        return
      }

      // Toggle Compare View (Ctrl + Shift + V)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v' && hasOutput) {
        e.preventDefault()
        setDiffOpen(o => !o)
        return
      }

      // Clear Output Only (Ctrl + L) - L for clear is standard in many CLI apps
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        if (inInput && active.tagName !== 'SELECT') return // Let input handle Ctrl+L if it means something
        e.preventDefault()
        dispatch({ type: 'RESET' })
        return
      }

      // Full Reset (Ctrl + Shift + K) - K for "Klear everything"
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        resetSession()
        return
      }

      // ─── Navigation & Panels ────────────────────────────────────────────────

      // Sidebar / History (Ctrl + H or Ctrl + B like VS Code)
      // Sidebar / History - Handled by Sidebar internally now
      if (e.ctrlKey && (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'b')) {
        e.preventDefault()
        // Toggle logic should be moved to Sidebar context if we want to keep shortcuts
        return
      }


      // Alt + 1–5 — enhancement level presets (Always active unless blocked)
      if (e.altKey && !e.ctrlKey && !e.shiftKey && LEVEL_MAP[e.key]) {
        e.preventDefault()
        setLevel(LEVEL_MAP[e.key])
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleEnhance, outputText, hasOutput, isMicRecording, startMic, stopMic, resetSession])

  return (
    <ErrorBoundary>
      <SessionProvider resetSession={resetSession}>
        <div className="app-root">

        {/* Nebula background orbs */}
        <div className="nebula-orb-1 animate-nebula" aria-hidden="true" />
        <div className="nebula-orb-2 animate-nebula" aria-hidden="true" />
        <div className="nebula-orb-3" aria-hidden="true" />

        {/* Navbar */}
        <header className="glass-navbar sticky top-0 z-30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="sm:hidden btn-icon mr-1"
              onClick={() => setMobileSidebarOpen(o => !o)}
              aria-label="Toggle sidebar"
              aria-expanded={mobileSidebarOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileSidebarOpen ? (
                  <polyline points="15 18 9 12 15 6" />
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <span className="font-extrabold text-sm gradient-text tracking-tight">Chota Packet</span>
          </div>
          <nav className="flex items-center gap-2" aria-label="App controls">
            <ModeIndicator mode={inferenceMode} />
          </nav>
        </header>

        {/* Backend status banner */}
        {(FEATURES?.SHOWBACKENDSTATUSBAR ?? false) && <StatusBanner status={backendStatus} />}

        {/* Main layout */}
        <div className="flex app-layout">

          {/* Legacy sidebar removed, using V2 Sidebar shell */}
          <Sidebar
            history={history}
            onHistorySelect={(item) => {
              dispatch({ type: 'INPUT_CHANGED', value: item.input ?? item.prompt ?? '' });
            }}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          >
            {/* Future sidebar components will be injected here */}
          </Sidebar>

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center px-4 py-6 gap-5 relative z-10 max-w-2xl mx-auto w-full">

            {/* Input area */}
            <div className="w-full glass-card gradient-border rounded-2xl p-4 animate-glow">
              <InputArea
                value={input}
                onChange={(val) => dispatch({ type: 'INPUT_CHANGED', value: val })}
                onClear={() => dispatch({ type: 'CLEAR_INPUT' })}
                inputLimit={inputLimit}
              />
              <MicButton
                lang={inputLang}
                recording={isMicRecording}
                error={micError}
                start={startMic}
                stop={stopMic}
              />
            </div>

            {/* Controls */}
            <div className="w-full">
              <ControlBar
                style={style} onStyleChange={setStyle}
                tone={tone} onToneChange={setTone}
                level={level} onLevelChange={setLevel}
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
                className="w-full text-center text-sm text-red-400 py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 animate-fade-in"
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
        {diffOpen && <DiffView original={originalText} enhanced={outputText} onClose={() => setDiffOpen(false)} />}
        {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
        {showOnboard && <OnboardingOverlay onDone={() => setShowOnboard(false)} />}

      </div>
      </SessionProvider>
    </ErrorBoundary>
  )
}