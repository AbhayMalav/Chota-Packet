import React, { useCallback } from 'react';
import { useSidebarContext } from '../../../context/SidebarContext';
import './MobileMenuButton.css';

export default function MobileMenuButton() {
  const { isMobileOpen, toggleMobileOpen } = useSidebarContext();

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      toggleMobileOpen();
    },
    [toggleMobileOpen]
  );

  return (
    <button
      className="mobile-menu-btn"
      onClick={handleClick}
      aria-expanded={isMobileOpen}
      aria-label="Open menu"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
