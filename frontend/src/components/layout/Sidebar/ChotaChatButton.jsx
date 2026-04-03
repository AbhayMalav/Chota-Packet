import React, { useState, useEffect, useRef } from 'react';
import { useSidebar } from './Sidebar';
import './ChotaChatButton.css';
import * as Config from '../../../config/config';

const FEATURES = Config?.FEATURES || { SHOW_CHOTA_CHAT: false };

export default function ChotaChatButton() {
  const isCollapsed = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!FEATURES.SHOW_CHOTA_CHAT) {
    return null;
  }

  const handleClick = () => {
    if (showToast) return;
    setShowToast(true);
    timerRef.current = setTimeout(() => {
      setShowToast(false);
      timerRef.current = null;
    }, 3000);
  };

  return (
    <div className="chota-chat-container">
      <button
        className={`chota-chat-btn ${isCollapsed ? 'collapsed' : ''}`}
        onClick={handleClick}
        aria-label="Chota Chat"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          className="chota-chat-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {!isCollapsed && (
          <>
            <span className="sidebar-label-text">Chota Chat</span>
            <span className="chota-chat-badge">Soon</span>
          </>
        )}
      </button>

      {isCollapsed && isHovered && (
        <div className="chota-chat-tooltip">Chota Chat (Coming Soon)</div>
      )}

      {showToast && (
        <div className="chota-chat-toast">Chota Chat is coming soon!</div>
      )}
    </div>
  );
}