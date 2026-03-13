import { useEffect, useRef } from 'react';
import './ShortcutsModal.css';

const SHORTCUTS = [
  { keys: ['Shift', 'Enter'],  desc: 'Enhance prompt' },
  { keys: ['Ctrl', 'K'],       desc: 'Clear input & output' },
  { keys: ['Ctrl', 'I'],       desc: 'Toggle shortcuts panel' },
];

export default function ShortcutsModal({ isOpen, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcuts-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="shortcuts-modal glass">
        <div className="shortcuts-header">
          <h2 className="shortcuts-title">Keyboard Shortcuts</h2>
          <button className="shortcuts-close" onClick={onClose}>✕</button>
        </div>

        <ul className="shortcuts-list">
          {SHORTCUTS.map((s, i) => (
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
          ))}
        </ul>
      </div>
    </div>
  );
}
