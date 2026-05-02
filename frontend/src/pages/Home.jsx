import React, { useState, useEffect, useCallback, useReducer } from 'react'
import { health } from '../services/api'
import useEnhance from '../hooks/useEnhance'
import useSettings from '../hooks/useSettings'
import useRecorder from '../hooks/useRecorder'
import { LS_ONBOARDED, HISTORY_LIMIT, MAX_INPUT_CHARS, LS_MULTI_OUTPUT, LS_MULTI_CONFIGS, LS_SAVED_OUTPUTS } from '../config/constants'
import { FEATURES } from '../config/config'
import StatusBanner from '../components/ui/StatusBanner'
import PromptInput from '../components/PromptInput/PromptInput'
import ControlBar from '../components/core/ControlBar'
import OutputCard from '../components/core/OutputCard'
import MultiOutputGrid from '../components/core/MultiOutputGrid'
import MultiOutputToolbar from '../components/core/MultiOutputToolbar'
import DiffView from '../components/core/DiffView'
import Sidebar from '../components/layout/Sidebar'
import MicButton from '../components/ui/MicButton'
import OnboardingOverlay from '../components/modals/OnboardingOverlay'
import { NavBtn, ModeIndicator } from '../components/layout/NavBar'
import GitHubButton from '../components/layout/NavBar/GitHubButton'
import ErrorBoundary, { ComponentErrorBoundary } from '../components/ui/ErrorBoundary'
import { ClockIcon } from '../components/ui/icons'
import { SessionProvider } from '../context/Session'
import { SidebarProvider } from '../context/SidebarContext'
import { useIncognito } from '../context/IncognitoContext'
import { appendHistoryItem } from '../services/historyService'
import MobileMenuButton from '../components/layout/Sidebar/MobileMenuButton'
import './Home.css'


// ─── State machine ────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    case 'INPUT_CHANGED':
      return { ...state, input: action.value, uiState: action.value.trim() ? 'INPUT_READY' : 'IDLE' }
    case 'LOADING':
      return { ...state, uiState: 'LOADING' }
    case 'SUCCESS':
      return { ...state, uiState: 'OUTPUT', outputText: action.text, originalText: state.input }
    case 'SUCCESS_MULTI':
      return { ...state, uiState: 'OUTPUT_MULTI', outputs: action.outputs, originalText: state.input }
    case 'ERROR':
      return { ...state, uiState: 'ERROR', outputText: '', originalText: '', outputs: [] }
    case 'ERROR_MULTI':
      return { ...state, outputs: state.outputs.map((o, i) =>
        i === action.index ? { ...o, status: 'error', text: '' } : o
      )}
    case 'OUTPUT_EDIT':
      return { ...state, outputText: action.text }
    case 'OUTPUT_EDIT_MULTI':
      return { ...state, outputs: state.outputs.map((o, i) => i === action.index ? { ...o, text: action.text, status: 'success' } : o) }
    case 'CLEAR_INPUT':
      return { ...state, input: '', uiState: state.uiState === 'OUTPUT' ? 'OUTPUT' : state.uiState === 'OUTPUT_MULTI' ? 'OUTPUT_MULTI' : 'IDLE' }
    case 'RESET':
      return { ...state, uiState: state.input.trim() ? 'INPUT_READY' : 'IDLE', outputText: '', originalText: '', outputs: [] }
    case 'FULL_RESET':
      return { uiState: 'IDLE', input: '', outputText: '', originalText: '', outputs: [] }
    case 'REMOVE_OUTPUT':
      return { ...state, outputs: state.outputs.filter((_, i) => i !== action.index) }
    case 'REGEN_SINGLE':
      return { ...state, outputs: state.outputs.map((o, i) =>
        i === action.index ? { ...o, status: 'loading', text: '' } : o
      )}
    case 'REGEN_SINGLE_SUCCESS':
      return { ...state, outputs: state.outputs.map((o, i) =>
        i === action.index ? { ...o, status: 'success', text: action.text } : o
      )}
    default:
      return state
  }
}

const initialAppState = { uiState: 'IDLE', input: '', outputText: '', originalText: '', outputs: [] }

function initAppState(base) {
  const saved = localStorage.getItem(LS_SAVED_OUTPUTS)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      const isFresh = data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000)
      if (isFresh && data.outputs?.length > 0) {
        return {
          ...base,
          input: data.input || '',
          outputs: data.outputs || [],
          uiState: 'OUTPUT_MULTI',
          originalText: data.input || ''
        }
      }
    } catch (e) {
      console.warn('[App] Failed to load saved outputs:', e)
    }
  }
  return base
}


// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const settings = useSettings()
  const { openRouterKey, inferenceMode, selectedModel, saveModel, models } = settings

  const [appState, dispatch] = useReducer(appReducer, initialAppState, initAppState)
  const { uiState, input, outputText, originalText, outputs } = appState

  const [multiOutputEnabled, setMultiOutputEnabled] = useState(() => {
    return localStorage.getItem(LS_MULTI_OUTPUT) === 'true'
  })
  const [multiConfigs, setMultiConfigs] = useState(() => {
    const savedSession = localStorage.getItem(LS_SAVED_OUTPUTS)
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession)
        const isFresh = data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000)
        if (isFresh && data.multiConfigs) return data.multiConfigs
      } catch (e) { /* ignore */ }
    }
    const saved = localStorage.getItem(LS_MULTI_CONFIGS)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
        localStorage.removeItem(LS_MULTI_CONFIGS)
      } catch (e) {
        localStorage.removeItem(LS_MULTI_CONFIGS)
      }
    }
    return [
      { tone: '', level: 'basic', style: 'general', outputLang: 'auto' },
      { tone: '', level: 'detailed', style: 'creative', outputLang: 'auto' },
    ]
  })
  const [multiLoading, setMultiLoading] = useState([])
  const [multiSkeletons, setMultiSkeletons] = useState(0)

  const [style, setStyle] = useState('general')
  const [tone, setTone] = useState('')
  const [level, setLevel] = useState('basic')
  const [outputLang, setOutputLang] = useState('auto')
  const inputLang = 'en'

  const [diffOpen, setDiffOpen] = useState(false)
  const [showOnboard, setShowOnboard] = useState(!localStorage.getItem(LS_ONBOARDED))
  const [backendStatus, setBackendStatus] = useState('loading')
  const [history, setHistory] = useState([])
  const { isIncognito } = useIncognito()
  const { run: runEnhance, abort: abortEnhance } = useEnhance()

  const resetSession = useCallback(() => {
    try {
      if (typeof abortEnhance === 'function') abortEnhance()
    } catch {
      console.warn("Could not abort in-flight request on new thread")
    }
    dispatch({ type: 'FULL_RESET' })
  }, [abortEnhance])

  const { recording: isMicRecording, error: micError, start: startMic, stop: stopMic } = useRecorder({
    onTranscript: (text) => dispatch({ type: 'INPUT_CHANGED', value: text }),
    lang: inputLang
  })

  const inputLimit = inferenceMode === 'cloud' ? 4096 : MAX_INPUT_CHARS
  const isLoading = uiState === 'LOADING'
  const hasOutput = uiState === 'OUTPUT' && !!outputText
  const hasMultiOutput = uiState === 'OUTPUT_MULTI' && outputs?.length > 0

  const handleRegenerateCard = useCallback(async (index) => {
    if (!input.trim()) return
    if (index < 0 || index >= multiConfigs.length) {
      dispatch({ type: 'ERROR_MULTI', index })
      return
    }
    dispatch({ type: 'REGEN_SINGLE', index })
    const cfg = multiConfigs[index]
    const payload = {
      text: input, input_lang: inputLang, output_lang: cfg.outputLang,
      style: cfg.style, tone: cfg.tone, enhancement_level: cfg.level,
      variant_mode: true, inference_mode: inferenceMode,
      model: selectedModel || undefined,
    }
    try {
      const data = await runEnhance(payload, openRouterKey)
      if (data?.enhanced_prompt) {
        dispatch({ type: 'REGEN_SINGLE_SUCCESS', index, text: data.enhanced_prompt })
      } else {
        dispatch({ type: 'ERROR_MULTI', index })
      }
    } catch (err) {
      console.warn('[App] Card regeneration failed:', err)
      dispatch({ type: 'ERROR_MULTI', index })
    }
  }, [input, inputLang, inferenceMode, selectedModel, openRouterKey, runEnhance, multiConfigs])

  useEffect(() => {
    if (hasMultiOutput && outputs.length > 0) {
      localStorage.setItem(LS_SAVED_OUTPUTS, JSON.stringify({
        input, outputs, multiConfigs, timestamp: Date.now()
      }))
    }
  }, [hasMultiOutput, outputs, input, multiConfigs])


  useEffect(() => {
    health()
      .then(res => setBackendStatus(res?.data?.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setBackendStatus('error'))
  }, [])

  const handleEnhance = useCallback(async (variantMode = false) => {
    if (!input.trim()) return
    dispatch({ type: 'LOADING' })

    if (multiOutputEnabled) {
      const allConfigs = multiConfigs.map((cfg, index) => ({
        id: `output-${Date.now()}-${index}`,
        text: '',
        config: cfg,
        status: 'loading',
        model: selectedModel || ''
      }))
      dispatch({ type: 'SUCCESS_MULTI', outputs: allConfigs })
      setMultiSkeletons(0)
      setMultiLoading(multiConfigs.map(() => true))
      for (let index = 0; index < multiConfigs.length; index++) {
        if (index > 0) await new Promise(r => setTimeout(r, 250))
        const cfg = multiConfigs[index]
        try {
          const payload = {
            text: input, input_lang: inputLang, output_lang: cfg.outputLang,
            style: cfg.style, tone: cfg.tone, enhancement_level: cfg.level,
            variant_mode: variantMode, inference_mode: inferenceMode,
            model: selectedModel || undefined,
          }
          const data = await runEnhance(payload, openRouterKey)
          setMultiLoading(prev => prev.map((_, i) => i > index))
          if (data?.enhanced_prompt) {
            dispatch({ type: 'OUTPUT_EDIT_MULTI', index, text: data.enhanced_prompt })
            if (data.enhanced_prompt) {
              setHistory(prev => appendHistoryItem(prev, { input, enhanced: data.enhanced_prompt, ts: Date.now() }, isIncognito))
            }
          } else {
            dispatch({ type: 'ERROR_MULTI', index })
          }
        } catch (err) {
          console.warn(`[App] Multi-output card ${index + 1} failed:`, err)
          setMultiLoading(prev => prev.map((_, i) => i > index))
          dispatch({ type: 'ERROR_MULTI', index })
        }
      }
      return
    }

    const payload = {
      text: input, input_lang: inputLang, output_lang: outputLang,
      style, tone, enhancement_level: level,
      variant_mode: variantMode, inference_mode: inferenceMode,
      model: selectedModel || undefined,
    }
    try {
      const data = await runEnhance(payload, openRouterKey)
      if (data?.enhanced_prompt) {
        dispatch({ type: 'SUCCESS', text: data.enhanced_prompt })
        setHistory(prev => appendHistoryItem(prev, { input, enhanced: data.enhanced_prompt, ts: Date.now() }, isIncognito))
      } else {
        dispatch({ type: 'ERROR' })
      }
    } catch (err) {
      console.warn('[App] Enhancement failed:', err)
      dispatch({ type: 'ERROR' })
    }
  }, [input, inputLang, outputLang, style, tone, level, inferenceMode, selectedModel, openRouterKey, runEnhance, isIncognito, multiOutputEnabled, multiConfigs])

  const handleRegenerateAll = useCallback(async () => {
    dispatch({ type: 'RESET' })
    handleEnhance(true)
  }, [handleEnhance])

  const handleCopyAll = useCallback(async (text) => {
    await navigator.clipboard.writeText(text)
  }, [])

  const handleClearAll = useCallback(() => {
    dispatch({ type: 'RESET' })
    localStorage.removeItem(LS_SAVED_OUTPUTS)
  }, [])

  useEffect(() => {
    const LEVEL_MAP = { '1': 'basic', '2': 'detailed', '3': 'advanced', '4': 'chain-of-thought', '5': 'meta' }
    const handler = (e) => {
      const active = document.activeElement
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable

      if (e.key === 'Escape') { setDiffOpen(false); return }
      if ((e.key === '?' && !inInput) || (e.ctrlKey && e.key === '/')) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('chota-open-shortcuts'))
        return
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) { if (hasOutput) handleEnhance(true) } else { handleEnhance() }
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        if (isMicRecording) stopMic(); else startMic().catch(() => {})
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c' && hasOutput) {
        e.preventDefault()
        navigator.clipboard.writeText(outputText).catch(() => {})
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v' && hasOutput) {
        e.preventDefault()
        setDiffOpen(o => !o)
        return
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        if (inInput && active.tagName !== 'SELECT') return
        e.preventDefault()
        dispatch({ type: 'RESET' })
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        resetSession()
        return
      }
      if (e.ctrlKey && (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'b')) {
        e.preventDefault()
        return
      }
      if (e.altKey && e.shiftKey && !e.ctrlKey && LEVEL_MAP[e.key]) {
        e.preventDefault()
        setLevel(LEVEL_MAP[e.key])
        return
      }
      if (e.altKey && e.shiftKey && !e.ctrlKey && hasMultiOutput && outputs.length > 0) {
        const variantIndex = parseInt(e.key) - 1
        if (variantIndex >= 0 && variantIndex < outputs.length) {
          e.preventDefault()
          navigator.clipboard.writeText(outputs[variantIndex].text || '').catch(() => {})
          return
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r' && hasMultiOutput) {
        e.preventDefault()
        handleRegenerateAll()
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x' && hasMultiOutput) {
        e.preventDefault()
        handleClearAll()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [outputText, hasOutput, isMicRecording, startMic, stopMic, resetSession, hasMultiOutput, outputs, handleRegenerateAll, handleClearAll])

  return (
    <ErrorBoundary>
      <SessionProvider resetSession={resetSession}>
        <SidebarProvider>
          <div className="app-root">

            {/* Nebula background orbs */}
            <div className="nebula-orb-1" aria-hidden="true" />
            <div className="nebula-orb-2" aria-hidden="true" />
            <div className="nebula-orb-3" aria-hidden="true" />

            {/* Navbar */}
            <header className="glass-navbar">
              <div className="navbar-brand-wrapper">
                <MobileMenuButton />
                <span className="gradient-text">Chota Packet</span>
              </div>
              <nav className="navbar-controls" aria-label="App controls">
                <ModeIndicator mode={inferenceMode} />
                <GitHubButton />
              </nav>
            </header>

            {/* Backend status banner */}
            {(FEATURES?.SHOW_BACKEND_STATUS_BAR ?? false) && <StatusBanner status={backendStatus} />}

            {/* Main layout */}
            <div className="app-layout">

              <Sidebar
                history={history}
                onHistorySelect={(item) => {
                  dispatch({ type: 'INPUT_CHANGED', value: item.input ?? item.prompt ?? '' })
                }}
              />

              {/* Main content */}
              <main className="main-content">

                {/* Input area */}
                <div className="input-card">
                  <ComponentErrorBoundary label="Input">
                    <PromptInput
                      value={input}
                      onChange={(val) => dispatch({ type: 'INPUT_CHANGED', value: val })}
                      onClear={() => dispatch({ type: 'CLEAR_INPUT' })}
                      onSubmit={() => handleEnhance()}
                      inputLimit={inputLimit}
                      isLoading={isLoading}
                    >
                      <MicButton
                        lang={inputLang}
                        recording={isMicRecording}
                        error={micError}
                        start={startMic}
                        stop={stopMic}
                      />
                    </PromptInput>
                  </ComponentErrorBoundary>
                </div>

                {/* Controls */}
                <div className="controls-wrapper">
                  <ComponentErrorBoundary label="Controls">
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
                      multiOutputEnabled={multiOutputEnabled}
                      onMultiOutputToggle={() => setMultiOutputEnabled(v => !v)}
                    />
                  </ComponentErrorBoundary>
                </div>

                {/* Error state */}
                {uiState === 'ERROR' && (
                  <div role="alert" className="error-state">
                    Enhancement failed. Please check your connection or API key and try again.
                  </div>
                )}

                {/* Output card */}
                {hasOutput && (
                  <div className="output-wrapper">
                    <ComponentErrorBoundary label="Output">
                      <OutputCard
                        text={outputText}
                        onTextChange={(text) => dispatch({ type: 'OUTPUT_EDIT', text })}
                        onCompare={() => setDiffOpen(true)}
                        onClear={() => dispatch({ type: 'RESET' })}
                      />
                    </ComponentErrorBoundary>
                  </div>
                )}

                {/* Multi-Output cards */}
                {(hasMultiOutput || uiState === 'LOADING') && multiOutputEnabled && (
                  <div className="multi-output-wrapper">
                    <ComponentErrorBoundary label="Multi-Output">
                      {hasMultiOutput && (
                        <MultiOutputToolbar
                          outputs={outputs}
                          onCopyAll={handleCopyAll}
                          onRegenerateAll={handleRegenerateAll}
                          onClearAll={handleClearAll}
                        />
                      )}
                      <MultiOutputGrid
                        outputs={hasMultiOutput ? outputs : []}
                        configs={multiConfigs}
                        loadingStates={multiLoading}
                        skeletonCount={hasMultiOutput ? 0 : multiSkeletons}
                        onRegenerate={(index) => handleRegenerateCard(index)}
                        onConfigChange={(index, config) => {
                          setMultiConfigs(prev => prev.map((c, i) => i === index ? config : c))
                        }}
                        models={models}
                        selectedModel={selectedModel}
                        onModelChange={(model) => saveModel(model)}
                        onTextChange={(index, text) => dispatch({ type: 'OUTPUT_EDIT_MULTI', index, text })}
                        onClear={(index) => dispatch({ type: 'REMOVE_OUTPUT', index })}
                      />
                    </ComponentErrorBoundary>
                  </div>
                )}

              </main>
            </div>

            {/* Modals */}
            {diffOpen && (
            <ComponentErrorBoundary label="Diff View">
              <DiffView original={originalText} enhanced={outputText} onClose={() => setDiffOpen(false)} />
            </ComponentErrorBoundary>
          )}
            {showOnboard && <OnboardingOverlay onDone={() => setShowOnboard(false)} />}

          </div>
        </SidebarProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}