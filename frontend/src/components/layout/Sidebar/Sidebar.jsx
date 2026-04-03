import React, { useState, createContext, useContext, useEffect } from 'react';
import './Sidebar.css';
import NewThreadButton from './NewThreadButton';
import ChotaChatButton from './ChotaChatButton';
import HistorySection from './HistorySection';
import IncognitoToggle from './IncognitoToggle';
import SettingsMenu from './SettingsMenu';
import useSettings from '../../../hooks/useSettings';
import UserButton from './UserButton';

const SidebarContext = createContext(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used inside <Sidebar>');
  }
  return context;
};

export default function Sidebar({ children, history, onHistorySelect, onShowShortcuts, mobileOpen, onMobileClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onMobileClose?.();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [mobileOpen, onMobileClose]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSidebar();
    }
  };

  const handleHistorySelect = (item) => {
    onHistorySelect?.(item);
    onMobileClose?.();
  };

  return (
    <SidebarContext.Provider value={isCollapsed}>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} aria-hidden="true" />
      )}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            onKeyDown={handleKeyDown}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
              {isCollapsed ? (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          <NewThreadButton onNavigate={onMobileClose} />
          <ChotaChatButton />
          <HistorySection history={history} onSelect={handleHistorySelect} />
          {children}
        </div>
        <div className="sidebar-footer">
          <IncognitoToggle />
          <SettingsMenu settings={settings} onShowShortcuts={onShowShortcuts} />
          <UserButton />
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}
