import React from 'react';
import { Sun, Moon, Monitor, ChevronLeft } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { THEMES } from '../../../config/constants';
import './AppearancePanel.css';

const MODES = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark',  label: 'Dark',  Icon: Moon },
  { id: 'system',label: 'System',Icon: Monitor },
];

export default function AppearancePanel({ onBack }) {
    const { mode, setMode, themeColor, setThemeColor } = useTheme();
  
    const handleModeKeyDown = (e) => {
      const currentIndex = MODES.findIndex((m) => m.id === mode);
      let nextIndex;
  
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % MODES.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + MODES.length) % MODES.length;
      }
  
      if (nextIndex !== undefined) {
        const nextId = MODES[nextIndex].id;
        const parent = e.currentTarget.parentElement;
        setMode(nextId);
        // Move focus after state update
        setTimeout(() => {
          const buttons = parent.querySelectorAll('[role="radio"]');
          buttons[nextIndex]?.focus();
        }, 0);
      }
    };
  
    const handleColorKeyDown = (e) => {
      const currentIndex = THEMES.findIndex((t) => t.id === themeColor);
      let nextIndex;
  
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % THEMES.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + THEMES.length) % THEMES.length;
      }
  
      if (nextIndex !== undefined) {
        const nextId = THEMES[nextIndex].id;
        const parent = e.currentTarget.parentElement;
        setThemeColor(nextId);
        setTimeout(() => {
          const buttons = parent.querySelectorAll('[role="radio"]');
          buttons[nextIndex]?.focus();
        }, 0);
      }
    };
  
    return (
      <div className="appearance-panel" role="group" aria-label="Appearance settings">
  
        {/* Back button */}
        <button
          className="appearance-panel__back"
          onClick={onBack}
          aria-label="Back to menu"
        >
          <ChevronLeft width={14} height={14} aria-hidden="true" />
          Appearance
        </button>
  
        {/* Mode section */}
        <div className="appearance-panel__section">
          <p className="appearance-panel__label">Mode</p>
          <div
            className="appearance-panel__modes"
            role="radiogroup"
            aria-label="Color mode"
          >
            {MODES.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="radio"
                aria-label={`${label} mode`}
                aria-checked={mode === id}
                tabIndex={mode === id ? 0 : -1}
                className="appearance-panel__mode-btn"
                onClick={() => setMode(id)}
                onKeyDown={handleModeKeyDown}
              >
                <Icon className="appearance-panel__mode-icon" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
  
        {/* Theme color section */}
        <div className="appearance-panel__section">
          <p className="appearance-panel__label">Theme Color</p>
          <div
            className="appearance-panel__colors"
            role="radiogroup"
            aria-label="Theme color"
          >
            {THEMES.map((t) => {
              const style = t.background
                ? { background: t.background }
                : { backgroundColor: t.color };
              return (
                <button
                  key={t.id}
                  role="radio"
                  aria-label={t.label}
                  aria-checked={themeColor === t.id}
                  tabIndex={themeColor === t.id ? 0 : -1}
                  className="appearance-panel__color-btn"
                  style={style}
                  onClick={() => setThemeColor(t.id)}
                  onKeyDown={handleColorKeyDown}
                  title={t.label}
                />
              );
            })}
          </div>
        </div>

    </div>
  );
}
