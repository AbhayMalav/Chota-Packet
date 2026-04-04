import React from 'react'
import { useIncognito } from '../../../context/IncognitoContext'
import { useSidebar } from './Sidebar'
import { VenetianMask } from 'lucide-react'
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
          <VenetianMask size={20} strokeWidth={1.5} />
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