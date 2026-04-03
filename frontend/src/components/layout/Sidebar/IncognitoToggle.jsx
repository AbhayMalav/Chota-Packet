import React from 'react'
import { useIncognito } from '../../../context/IncognitoContext'
import { useSidebar } from './Sidebar'
import './IncognitoToggle.css'

export default function IncognitoToggle() {
  const { isIncognito, toggleIncognito } = useIncognito()
  const isCollapsed  = useSidebar()

  return (
    <div className={`incognito-wrapper ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <button
        type="button"
        className={`incognito-btn ${isIncognito ? 'incognito--on' : 'incognito--off'}`}
        onClick={toggleIncognito}
        aria-pressed={isIncognito}
        title={isCollapsed ? 'Toggle Incognito Mode' : undefined}
      >
        <span className="incognito-icon">
          {/* Custom Ghost SVG */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.4 3.6 8 8 8s8-2.6 8-8a8 8 0 0 0-8-8z" />
            <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          </svg>
        </span>
        
        {!isCollapsed && (
          <>
            <span className="incognito-label">Incognito</span>
            <div className={`incognito-switch ${isIncognito ? 'active' : ''}`}>
              <div className="incognito-switch-thumb" />
            </div>
          </>
        )}
      </button>
    </div>
  )
}