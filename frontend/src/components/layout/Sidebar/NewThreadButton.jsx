import React, { useState, useRef, useEffect } from 'react';
import { useSidebar } from '../Sidebar';
import { useSessionStore } from '../../../context/Session';
import './NewThreadButton.css';

export default function NewThreadButton({ onNavigate }) {
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
    } catch {
      console.warn("Could not abort in-flight request on new thread");
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
        aria-label="Start new thread"
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
        {!isCollapsed && <span className="sidebar-label-text">New Thread</span>}
      </button>
      {isCollapsed && isHovered && (
        <div className="new-thread-tooltip">New Thread</div>
      )}
    </div>
  );
}
