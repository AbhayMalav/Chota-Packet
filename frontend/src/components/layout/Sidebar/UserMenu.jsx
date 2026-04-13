import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '../../../context/UserContext';
import { useTheme } from '../../../context/ThemeContext';
import { useSettingsMenu } from './Sidebar';
import { translations } from '../../../config/translations';
import {
  User, Settings, Keyboard, PieChart,
  SlidersHorizontal, Palette, Globe, HelpCircle, LogOut,
} from 'lucide-react';
import AppearancePanel from './AppearancePanel';
import LanguagePanel from './LanguagePanel';
import ShortcutsPanel from './ShortcutsPanel';
import usePopoverPosition from '../../../hooks/usePopoverPosition';
import './UserMenu.css';
import './UserButton.css';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function UserMenu({ isOpen, onClose, triggerBtnRef, onShowToast }) {
  const [user] = useUser();
  const { language, setLanguage } = useTheme();
  const t = translations[language] || translations.en
  
  const MENU_ITEMS = [
    { id: 'account',      label: t.account,        icon: User },
    { id: 'preferences',  label: t.preferences,    icon: Settings },
    { id: 'shortcuts',    label: t.shortcuts,       icon: Keyboard },
    { id: 'usage',        label: t.usageCredits, icon: PieChart },
    { id: 'all-settings', label: t.allSettings,    icon: SlidersHorizontal },
    { id: 'appearance',   label: t.appearance,      icon: Palette },
    { id: 'language',     label: t.language,        icon: Globe },
    { id: 'help',         label: t.help,            icon: HelpCircle },
    { id: 'sign-out',     label: t.signOut,        icon: LogOut, isSignOut: true },
  ];

  const menuRef = useRef(null);
  const itemsRef = useRef([]);
  const { toggleSettings, shortcutsOpen, closeShortcuts } = useSettingsMenu();
  const { position } = usePopoverPosition(triggerBtnRef, menuRef, { preferSide: 'left', preferVertical: 'up', estimatedWidth: 280 });
  const [panel, setPanel] = useState('main');

  const displayName = user?.name || 'Guest';
  const displayEmail = user?.email;
  const initials = getInitials(displayName);

  // Reset to main panel when menu closes
  useEffect(() => {
    if (!isOpen) {
      setPanel('main')
      closeShortcuts()
    }
  }, [isOpen, closeShortcuts])

  // Auto-open shortcuts panel when triggered globally (e.g. ? key)
  useEffect(() => {
    if (shortcutsOpen && isOpen) {
      setPanel('shortcuts')
      closeShortcuts()
    }
  }, [shortcutsOpen, isOpen, closeShortcuts])

  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, MENU_ITEMS.length);
  }, []);

  // Keyboard navigation — only active on main panel
  useEffect(() => {
    if (!isOpen || panel !== 'main') return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerBtnRef?.current?.focus();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = itemsRef.current.findIndex(
          (el) => el === document.activeElement
        );
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex === MENU_ITEMS.length - 1 || currentIndex === -1
            ? 0 : currentIndex + 1;
        } else {
          nextIndex = currentIndex === 0 || currentIndex === -1
            ? MENU_ITEMS.length - 1 : currentIndex - 1;
        }
        itemsRef.current[nextIndex]?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, panel, onClose, triggerBtnRef]);

  // Escape from sub-panels → back to main (not close)
  useEffect(() => {
    if (!isOpen || (panel !== 'appearance' && panel !== 'shortcuts' && panel !== 'language')) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPanel('main');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, panel]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerBtnRef?.current && !triggerBtnRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose, triggerBtnRef]);

  // Focus first item on open / when returning to main panel
  useEffect(() => {
    let timer;
    if (isOpen && panel === 'main') {
      timer = setTimeout(() => itemsRef.current[0]?.focus(), 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, panel]);

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    if (item.id === 'appearance') {
      setPanel('appearance');
      return;
    }
    if (item.id === 'shortcuts') {
      setPanel('shortcuts');
      return;
    }
    if (item.id === 'language') {
      setPanel('language');
      return;
    }
    if (item.id === 'all-settings') {
      onClose();
      toggleSettings();
      return;
    }
    if (item.id === 'sign-out') {
      onShowToast?.(t.notSignedIn);
    } else {
      onShowToast?.(`${item.label} ${t.comingSoon}`);
    }
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      className="user-menu-wrapper"
      role="menu"
      aria-label="User actions"
      style={{
        position: 'fixed',
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        zIndex: 9999,
      }}
    >
      {panel === 'shortcuts' ? (
        <ShortcutsPanel onBack={() => setPanel('main')} />
      ) : panel === 'appearance' ? (
        <AppearancePanel onBack={() => setPanel('main')} />
      ) : panel === 'language' ? (
        <LanguagePanel
          onBack={() => setPanel('main')}
          currentLanguage={language}
          onLanguageChange={(lang) => {
            setLanguage(lang);
            const messages = { en: 'Language changed to English', hi: 'भाषा हिंदी में बदल गई' };
            onShowToast?.(messages[lang] || messages.en);
            setPanel('main');
            onClose();
          }}
        />
      ) : (
        <>
          {/* Profile card at top */}
          <div className="user-menu-profile">
            <div
              className="user-menu-profile-avatar"
              aria-hidden="true"
              data-testid="profile-avatar"
            >
              {user?.avatar
                ? <img src={user.avatar} alt={displayName} />
                : <span>{initials}</span>
              }
            </div>
            <div className="user-menu-profile-details">
              <span className="user-menu-profile-name">{displayName}</span>
              {displayEmail && (
                <span className="user-menu-profile-email">{displayEmail}</span>
              )}
            </div>
          </div>

          <div className="user-menu-divider" role="separator" />

          {/* Menu items */}
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {item.id === 'sign-out' && (
                  <div className="user-menu-divider" role="separator" />
                )}
                <button
                  ref={(el) => (itemsRef.current[index] = el)}
                  className={`user-menu-item${item.isSignOut ? ' sign-out' : ' stubbed'}`}
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                >
                  <Icon
                    aria-hidden="true"
                    className="user-menu-item-icon"
                    width={18}
                    height={18}
                  />
                  <span>{item.label}</span>
                  {item.id === 'appearance' && (
                    <svg
                      className="user-menu-item-chevron"
                      viewBox="0 0 24 24"
                      width={14}
                      height={14}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                  {item.id === 'language' && (
                    <svg
                      className="user-menu-item-chevron"
                      viewBox="0 0 24 24"
                      width={14}
                      height={14}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </>
      )}
    </div>,
    document.body
  );
}
