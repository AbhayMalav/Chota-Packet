import React, { useState } from 'react'
import { LS_ONBOARDED } from '../constants'

const STEPS = [
  {
    icon: '👋',
    title: 'Welcome to Chota Packet',
    body: 'Turn rough ideas into polished AI prompts — instantly. Works offline using a local AI model.',
  },
  {
    icon: '⌨️',
    title: 'Type or Paste',
    body: 'Enter your rough idea in the text box. Switch between English (EN) and Hindi (HI) input using the buttons.',
  },
  {
    icon: '✨',
    title: 'Enhance It',
    body: 'Pick a Style, Tone, and Enhancement Level, then click Enhance (or press Ctrl+Enter). Your improved prompt appears instantly.',
  },
  {
    icon: '🎤',
    title: 'Mic, Settings & History',
    body: 'Use 🎤 to record speech instead of typing. Open ⚙ Settings to add a cloud API key. History panel stores your last 5 results.',
  },
]

export default function OnboardingOverlay({ onDone }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  const finish = () => {
    localStorage.setItem(LS_ONBOARDED, '1')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
         role="dialog" aria-modal="true" aria-label="Onboarding tour">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-7 text-center animate-fade-in">
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'bg-violet-600 w-5' : 'bg-gray-200 dark:bg-gray-700 w-1.5'}`} />
          ))}
        </div>

        <div className="text-5xl mb-4">{current.icon}</div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{current.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{current.body}</p>

        <div className="flex items-center gap-3 mt-6">
          <button onClick={finish}
                  className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                             text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
            Skip
          </button>
          <button
            onClick={() => isLast ? finish() : setStep((s) => s + 1)}
            className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition"
          >
            {isLast ? 'Get Started 🚀' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
