import React, { useState } from 'react'
import { useIncognito } from '../../../context/IncognitoContext'
import { useSidebar } from './Sidebar'
import { VenetianMask } from 'lucide-react'
import { translations } from '../../../config/translations'
import { useTheme } from '../../../context/ThemeContext'
import './IncognitoToggle.css'

export default function IncognitoToggle() {
  const { language } = useTheme()
  const t = translations[language] || translations.en
  
  const { isIncognito, toggleIncognito } = useIncognito()
  const isCollapsed = useSidebar()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={`incognito-wrapper ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <button
        type="button"
        className={`incognito-btn ${isIncognito ? 'incognito--on' : 'incognito--off'}`}
        onClick={toggleIncognito}
        aria-pressed={isIncognito}
        aria-label={isIncognito ? t.incognitoTurnOff : t.incognitoTurnOn}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="incognito-icon">
          <VenetianMask size={20} strokeWidth={1.5} />
        </span>

        {!isCollapsed && (
          <>
            <span className="incognito-label">{t.incognito}</span>
            <div className={`incognito-switch ${isIncognito ? 'active' : ''}`}>
              <div className="incognito-switch-thumb" />
            </div>
          </>
        )}
      </button>

      {isCollapsed && isHovered && (
        <span className="incognito-tooltip" role="tooltip">
          {isIncognito ? `${t.incognito}: ${t.on}` : `${t.incognito}: ${t.off}`}
        </span>
      )}
    </div>
  )
}