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
              className="appearance-panel__mode-btn"
              onClick={() => setMode(id)}
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
                className="appearance-panel__color-btn"
                style={style}
                onClick={() => setThemeColor(t.id)}
                title={t.label}
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}
