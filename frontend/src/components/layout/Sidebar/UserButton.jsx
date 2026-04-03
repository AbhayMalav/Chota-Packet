import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import { useSidebar } from './Sidebar';
import UserMenu from './UserMenu';
import './UserButton.css';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0).toUpperCase();
}

export default function UserButton() {
  const [user] = useUser();
  const isCollapsed = useSidebar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 'auto', left: 0, bottom: 0 });
  const buttonRef = useRef(null);
  const toastTimerRef = useRef(null);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email;
  const initials = getInitials(displayName);

  const toggleMenu = () => {
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      setMenuPos({
        bottom: vh - rect.top + 8,
        left: rect.left,
        top: 'auto',
      });
    }
    setIsMenuOpen((prev) => !prev);
  };

  const handleShowToast = (message) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <div className="user-btn-wrapper relative">
      <button
        ref={buttonRef}
        type="button"
        className={`user-btn ${isCollapsed ? 'collapsed' : 'expanded'} ${isMenuOpen ? 'active' : ''}`}
        aria-label="User menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        title={isCollapsed ? displayName : undefined}
        onClick={toggleMenu}
      >
        <div className="user-avatar" aria-hidden="true" data-testid="user-button-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={displayName} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        {!isCollapsed && (
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            {displayEmail && <span className="user-email">{displayEmail}</span>}
          </div>
        )}
        <svg
          className="user-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isMenuOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <UserMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        triggerBtnRef={buttonRef}
        onShowToast={handleShowToast}
        menuPos={menuPos}
      />

      {toastMessage && (
        <div className="user-button-toast" role="alert">
          {toastMessage}
        </div>
      )}
    </div>
  );
}