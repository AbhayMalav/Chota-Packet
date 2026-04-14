import React, { useState, useRef, useEffect } from 'react';
import { useSidebar } from '../Sidebar';
import { useSessionStore } from '../../../context/Session';
import { translations } from '../../../config/translations';
import { useTheme } from '../../../context/ThemeContext';
import './NewThreadButton.css';

export default function NewThreadButton({ onNavigate }) {
  const { language } = useTheme()
  const t = translations[language] || translations.en
  
  const isCollapsed = useSidebar();
  const { resetSession } = useSessionStore();
  const [isHovered, setIsHovered] = useState(false);
  const isPendingRef = useRef(false);
  
  const disabled = !resetSession;

  useEffect(() => {
    if (disabled) {
      console.error("resetSession is not available from context/store");
    }
  }, [disabled]);

  const handleClick = () => {
    if (disabled || isPendingRef.current) return;
    
    isPendingRef.current = true;
    try {
      resetSession();
      onNavigate?.();
    } catch (err) {
      console.warn("Failed to reset session or navigate to new thread:", err);
    } finally {
      setTimeout(() => {
        isPendingRef.current = false;
      }, 300);
    }
  };

  return (
    <div className="new-thread-container">
      <button
        className={`new-thread-btn ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={t.newThread}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          className="new-thread-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        {!isCollapsed && <span className="sidebar-label-text">{t.newThread}</span>}
      </button>
      {isCollapsed && isHovered && (
        <div className="new-thread-tooltip">{t.newThread}</div>
      )}
    </div>
  );
}