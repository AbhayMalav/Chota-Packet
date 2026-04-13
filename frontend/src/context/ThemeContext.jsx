import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { LS_THEME, LS_LANGUAGE, THEMES } from '../config/constants'

const ThemeContext = createContext()

export default function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const stored = localStorage.getItem('cp_mode')
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    } catch (e) {
      console.warn('Failed to read theme mode from localStorage', e)
    }
    return 'system'
  })

  // Theme color ("brand", "orange", etc.)
  const [themeColor, setThemeColorState] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_THEME)
      if (stored && THEMES.includes(stored)) return stored
    } catch (e) {
      console.warn('Failed to read theme color from localStorage', e)
    }
    return 'brand'
  })

  // App language (en or hi)
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_LANGUAGE)
      if (stored === 'en' || stored === 'hi') return stored
    } catch (e) {
      console.warn('Failed to read language from localStorage', e)
    }
    return 'en'
  })

  const setMode = useCallback((newMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem('cp_mode', newMode)
    } catch (e) {}
  }, [])

  const setThemeColor = useCallback((newTheme) => {
    setThemeColorState(newTheme)
    try {
      localStorage.setItem(LS_THEME, newTheme)
    } catch (e) {}
  }, [])

  const setLanguage = useCallback((newLanguage) => {
    setLanguageState(newLanguage)
    try {
      localStorage.setItem(LS_LANGUAGE, newLanguage)
    } catch (e) {}
  }, [])

  useEffect(() => {
    const root = document.documentElement
    
    // Apply theme color
    const themeClasses = THEMES.map(t => `theme-${t.id}`)
    root.classList.remove(...themeClasses)
    root.classList.add(`theme-${themeColor}`)

    // Apply strict light/dark via data-theme
    let activeMode = mode
    if (activeMode === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      activeMode = isSystemDark ? 'dark' : 'light'
    }
    root.setAttribute('data-theme', activeMode)

    // Listen for system changes if currently on system mode
    let mediaQuery
    const handler = (e) => {
      if (mode === 'system') {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
    }
    if (mode === 'system' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', handler)
    }

    return () => {
      if (mediaQuery) mediaQuery.removeEventListener('change', handler)
    }
  }, [mode, themeColor])

  return (
    <ThemeContext.Provider value={{ mode, setMode, themeColor, setThemeColor, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    console.warn('useTheme must be used within a ThemeProvider, defaulting to system/brand')
    return {
      mode: 'system',
      setMode: () => {},
      themeColor: 'brand',
      setThemeColor: () => {},
      language: 'en',
      setLanguage: () => {},
    }
  }
  return context
}
