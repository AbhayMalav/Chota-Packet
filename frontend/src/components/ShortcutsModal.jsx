import { useEffect, useRef } from 'react';
import './ShortcutsModal.css';

const SHORTCUTS = [
  { keys: ['Shift', 'Enter'],  desc: 'Enhance prompt' },
  { keys: ['Ctrl', 'K'],       desc: 'Clear input & output' },
  { keys: ['Ctrl', 'I'],       desc: 'Toggle shortcuts panel' },
];

export default function ShortcutsModal({ isOpen, onClose }) {
  const overlayRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    console.debug('[ShortcutsTab] Popup opened');
    
    // Auto-focus title for accessibility
    if (titleRef.current) {
        titleRef.current.focus();
    }

    const handler = (e) => {
      if (e.key === 'Escape') {
          console.debug('[ShortcutsTab] Popup closed via Escape');
          onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
        window.removeEventListener('keydown', handler);
        console.debug('[ShortcutsTab] Popup closed');
    }
  }, [isOpen, onClose]);

  useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = () => {
          const isDark = !document.documentElement.classList.contains('light');
          console.debug(`[ShortcutsTab] Theme switched to: ${isDark ? 'dark' : 'light'}`);
      };
      
      mediaQuery.addEventListener('change', handleThemeChange);
      
      const observer = new MutationObserver((mutations) => {
          mutations.forEach((m) => {
              if (m.attributeName === 'class') {
                  handleThemeChange();
              }
          });
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      return () => {
          mediaQuery.removeEventListener('change', handleThemeChange);
          observer.disconnect();
      };
  }, []);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
      if (e.target === overlayRef.current) {
          console.debug('[ShortcutsTab] Popup closed via backdrop click');
          onClose();
      }
  };

  let shortcutsContent;
  try {
    shortcutsContent = SHORTCUTS.map((s, i) => (
      <li key={i} className="shortcut-row">
        <div className="shortcut-keys">
          {s.keys.map((k, j) => (
            <span key={j}>
              <kbd className="shortcut-kbd">{k}</kbd>
              {j < s.keys.length - 1 && <span className="shortcut-plus">+</span>}
            </span>
          ))}
        </div>
        <span className="shortcut-desc">{s.desc}</span>
      </li>
    ));
  } catch (err) {
    console.error(`[ShortcutsTab] Error loading shortcuts:`, err.message || err);
    shortcutsContent = (
       <div className="shortcuts-error">
           Failed to load shortcuts. Please try again.
       </div>
    );
  }

  return (
    <div
      className="shortcuts-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="shortcuts-modal glass-card">
        <div className="shortcuts-header">
          <h2 id="shortcuts-modal-title" className="shortcuts-title" tabIndex="-1" ref={titleRef}>Keyboard Shortcuts</h2>
          <button className="shortcuts-close" aria-label="Close shortcuts" onClick={onClose}>✕</button>
        </div>

        <ul className="shortcuts-list">
          {shortcutsContent}
        </ul>
      </div>
    </div>
  );
}
