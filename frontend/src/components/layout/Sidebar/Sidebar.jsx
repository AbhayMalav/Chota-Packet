import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSidebarContext } from '../../../context/SidebarContext';
import './Sidebar.css';
import NewThreadButton from './NewThreadButton';
import ChotaChatButton from './ChotaChatButton';
import HistorySection from './HistorySection';
import IncognitoToggle from './IncognitoToggle';
import SettingsPanel from '../../modals/SettingsModal';
import ErrorBoundary from '../../ui/ErrorBoundary';
import useSettings from '../../../hooks/useSettings';
import UserButton from './UserButton';
import usePopoverPosition from '../../../hooks/usePopoverPosition';

const SidebarContext = createContext(undefined);
const SettingsContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used inside <Sidebar>');
  }
  return context;
};

export const useSettingsMenu = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsMenu must be used inside <Sidebar>');
  }
  return context;
};

export default function Sidebar({ children, history, onHistorySelect, onShowShortcuts }) {
  const { isMobileOpen, closeMobile, isDesktopCollapsed, toggleDesktopCollapsed } = useSidebarContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const settings = useSettings();
  const userButtonRef = useRef(null);
  const settingsPopoverRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 400);
  const { position } = usePopoverPosition(userButtonRef, settingsPopoverRef, { estimatedWidth: 360 });

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 400);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOpenShortcuts = () => {
      setShortcutsOpen(true);
    };
    window.addEventListener('chota-open-shortcuts', handleOpenShortcuts);
    return () => window.removeEventListener('chota-open-shortcuts', handleOpenShortcuts);
  }, []);

  const toggleSettings = useCallback(() => {
    if (settingsOpen) {
      console.warn('[SettingsMenu] Already open, ignoring duplicate trigger');
      return;
    }
    setSettingsOpen(true);
  }, [settingsOpen]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const openShortcuts = useCallback(() => {
    setShortcutsOpen(true);
  }, []);

  const closeShortcuts = useCallback(() => {
    setShortcutsOpen(false);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleOutside = (e) => {
      if (
        settingsPopoverRef.current && !settingsPopoverRef.current.contains(e.target) &&
        userButtonRef.current && !userButtonRef.current.contains(e.target)
      ) {
        closeSettings();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [settingsOpen, closeSettings]);

  useEffect(() => {
    if (!settingsOpen) return;
    const popover = settingsPopoverRef.current;
    if (!popover) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSettings();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, closeSettings]);

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleSettings]);

  const handleToggleClick = () => {
    if (window.innerWidth < 768) {
      closeMobile();
    } else {
      toggleDesktopCollapsed();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleClick();
    }
  };

  const handleHistorySelect = (item) => {
    onHistorySelect?.(item);
    closeMobile();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeMobile();
    }
  };

  return (
    <SidebarContext.Provider value={isDesktopCollapsed}>
      <SettingsContext.Provider value={{ settingsOpen, toggleSettings, closeSettings, shortcutsOpen, openShortcuts, closeShortcuts, userButtonRef }}>
        {isMobileOpen && (
          <div className="sidebar-overlay" onClick={handleOverlayClick} aria-hidden="true" />
        )}
        <aside className={`sidebar ${isDesktopCollapsed ? 'collapsed' : 'expanded'} ${isMobileOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <button
              className="sidebar-toggle"
              onClick={handleToggleClick}
              onKeyDown={handleKeyDown}
              aria-expanded={!isDesktopCollapsed}
              aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className="sidebar-toggle-collapse-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isDesktopCollapsed ? (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                ) : (
                  <polyline points="15 18 9 12 15 6" />
                )}
              </svg>
              <svg
                className="sidebar-toggle-close-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="sidebar-content">
            <IncognitoToggle />
            <NewThreadButton onNavigate={closeMobile} />
            <ChotaChatButton />
            <HistorySection history={history} onSelect={handleHistorySelect} />
            {children}
          </div>
          <div className="sidebar-footer">
            <UserButton />
          </div>

          {settingsOpen && createPortal(
            <div
              ref={settingsPopoverRef}
              role="dialog"
              aria-modal="true"
              aria-label="Settings Context Menu"
              className="settings-popover glass-card gradient-border animate-fade-in"
              style={isMobileView ? {
                position: 'fixed',
                top: 16,
                left: 16,
                right: 16,
                bottom: 'auto',
                maxHeight: 'calc(100vh - 32px)',
                zIndex: 100,
              } : {
                position: 'fixed',
                top: position.top,
                bottom: position.bottom,
                left: position.left,
                right: position.right,
                zIndex: 100,
              }}
            >
              <ErrorBoundary fallback={<div className="p-5 text-red-400 font-semibold bg-red-500/10">Settings unavailable</div>}>
                <SettingsPanel
                  settings={settings}
                  onClose={closeSettings}
                  onShowShortcuts={() => {
                    closeSettings();
                    onShowShortcuts?.();
                  }}
                />
              </ErrorBoundary>
            </div>,
            document.body
          )}
        </aside>
      </SettingsContext.Provider>
    </SidebarContext.Provider>
  );
}
