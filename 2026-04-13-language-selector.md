# Language Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a language selector to the UserMenu that switches UI text between English and Hindi, with theme-aware styling and localStorage persistence.

**Architecture:** Create a LanguagePanel sub-panel (similar to AppearancePanel) that appears when clicking the Language menu item. Use a translation map for UI strings. Persist selection to localStorage using the existing theme pattern.

**Tech Stack:** React 19, localStorage, existing theme system (useTheme hook)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `frontend/src/config/translations.js` | Translation map for UI strings |
| Create | `frontend/src/components/layout/Sidebar/LanguagePanel.jsx` | Language selection panel |
| Create | `frontend/src/components/layout/Sidebar/LanguagePanel.css` | Panel styles |
| Create | `frontend/src/components/layout/Sidebar/LanguagePanel.test.jsx` | Panel tests |
| Modify | `frontend/src/config/constants.js:95` | Add LS_LANGUAGE constant |
| Modify | `frontend/src/components/layout/Sidebar/UserMenu.jsx:30,138-158` | Wire language item to panel |

---

## Task 1: Add LS_LANGUAGE constant

**Files:**
- Modify: `frontend/src/config/constants.js:95`

- [ ] **Step 1: Add LS_LANGUAGE constant**

Add after `LS_THEME`:
```javascript
export const LS_LANGUAGE = 'cp-language'
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/constants.js
git commit -m "feat(i18n): add LS_LANGUAGE constant for language persistence"
```

---

## Task 2: Create translation map

**Files:**
- Create: `frontend/src/config/translations.js`

- [ ] **Step 1: Create translations.js**

```javascript
// translations.js - UI string translations
// Currently supports English (en) and Hindi (hi)

export const translations = {
  en: {
    language: 'Language',
    english: 'English',
    hindi: 'Hindi',
    languageChanged: 'Language changed to English',
    selectLanguage: 'Select Language',
  },
  hi: {
    language: 'भाषा',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    languageChanged: 'भाषा हिंदी में बदल गई',
    selectLanguage: 'भाषा चुनें',
  },
}

export const UI_LABELS = {
  en: {
    appearance: 'Appearance',
    shortcuts: 'Shortcuts',
    account: 'Account',
    preferences: 'Preferences',
    usage: 'Usage & Credits',
    allSettings: 'All Settings',
    help: 'Help',
    signOut: 'Sign Out',
  },
  hi: {
    appearance: 'दिखावट',
    shortcuts: 'शॉर्टकट',
    account: 'खाता',
    preferences: 'प्राथमिकताएं',
    usage: 'उपयोग और क्रेडिट',
    allSettings: 'सभी सेटिंग्स',
    help: 'मदद',
    signOut: 'साइन आउट',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/translations.js
git commit -m "feat(i18n): add translation map for UI strings"
```

---

## Task 3: Create LanguagePanel component

**Files:**
- Create: `frontend/src/components/layout/Sidebar/LanguagePanel.jsx`
- Create: `frontend/src/components/layout/Sidebar/LanguagePanel.css`

- [ ] **Step 1: Write the failing test**

Create `LanguagePanel.test.jsx`:
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LanguagePanel from './LanguagePanel'

// Mock useTheme
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'dark', themeColor: 'brand' }),
}))

describe('LanguagePanel', () => {
  const mockOnBack = vi.fn()
  const mockOnLanguageChange = vi.fn()

  it('renders language options', () => {
    render(
      <LanguagePanel
        onBack={mockOnBack}
        onLanguageChange={mockOnLanguageChange}
      />
    )
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Hindi')).toBeInTheDocument()
  })

  it('calls onLanguageChange when selecting a language', async () => {
    const user = userEvent.setup()
    render(
      <LanguagePanel
        onBack={mockOnBack}
        onLanguageChange={mockOnLanguageChange}
      />
    )
    await user.click(screen.getByText('English'))
    expect(mockOnLanguageChange).toHaveBeenCalledWith('en')
  })
})
```

Run test to verify it fails (component doesn't exist yet):
```bash
cd frontend && npm test -- --run src/components/layout/Sidebar/LanguagePanel.test.jsx
Expected: FAIL - import error

- [ ] **Step 2: Create LanguagePanel.jsx**

```javascript
import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { LANGS } from '../../../config/constants'
import { translations } from '../../../config/translations'
import './LanguagePanel.css'

export default function LanguagePanel({ onBack, onLanguageChange, currentLanguage = 'en' }) {
  const { mode } = useTheme()
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  
  // Get translations based on current language (not selected - UI stays in current lang)
  const t = translations[currentLanguage] || translations.en

  const handleLanguageSelect = (lang) => {
    onLanguageChange(lang)
  }

  return (
    <div className="language-panel" role="group" aria-label="Language settings">
      {/* Back button */}
      <button
        className="language-panel__back"
        onClick={onBack}
        aria-label="Back to menu"
      >
        <ChevronLeft width={14} height={14} aria-hidden="true" />
        {t.language}
      </button>

      {/* Language options */}
      <div className="language-panel__section">
        <p className="language-panel__label">{t.selectLanguage}</p>
        <div
          className="language-panel__options"
          role="radiogroup"
          aria-label="Language selection"
        >
          {LANGS.map(({ value, label }) => (
            <button
              key={value}
              role="radio"
              aria-label={label}
              aria-checked={currentLanguage === value}
              tabIndex={currentLanguage === value ? 0 : -1}
              className={`language-panel__option ${currentLanguage === value ? 'selected' : ''}`}
              onClick={() => handleLanguageSelect(value)}
            >
              {value === 'en' ? t.english : t.hindi}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create LanguagePanel.css**

```css
.language-panel {
  min-width: 240px;
  padding: 12px 0;
}

.language-panel__back {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.language-panel__back:hover {
  background: var(--hover-bg);
}

.language-panel__section {
  padding: 8px 16px;
}

.language-panel__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.language-panel__options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.language-panel__option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.language-panel__option:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
}

.language-panel__option.selected {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.language-panel__option.selected:hover {
  background: var(--accent-color);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- --run src/components/layout/Sidebar/LanguagePanel.test.jsx
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/Sidebar/LanguagePanel.jsx frontend/src/components/layout/Sidebar/LanguagePanel.css frontend/src/components/layout/Sidebar/LanguagePanel.test.jsx
git commit -m "feat(i18n): add LanguagePanel component with theme-aware styling"
```

---

## Task 4: Wire LanguagePanel in UserMenu

**Files:**
- Modify: `frontend/src/components/layout/Sidebar/UserMenu.jsx:30,138-158`

- [ ] **Step 1: Update UserMenu.jsx to import and use LanguagePanel**

Add import after existing imports (line 11):
```javascript
import LanguagePanel from './LanguagePanel';
```

Update state initialization to include 'language' panel (around line 41):
```javascript
const [panel, setPanel] = useState('main');
```

Update handleItemClick to handle language (around line 138):
```javascript
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
    onShowToast?.('You are not signed in');
  } else {
    onShowToast?.(`${item.label} coming soon`);
  }
  onClose();
};
```

Add panel rendering in the return JSX (around line 175):
```javascript
{panel === 'shortcuts' ? (
  <ShortcutsPanel onBack={() => setPanel('main')} />
) : panel === 'appearance' ? (
  <AppearancePanel onBack={() => setPanel('main')} />
) : panel === 'language' ? (
  <LanguagePanel
    onBack={() => setPanel('main')}
    onLanguageChange={(lang) => {
      // Persist to localStorage
      try {
        localStorage.setItem('cp-language', lang);
      } catch (e) {}
      // Show toast with translation
      const messages = { en: 'Language changed to English', hi: 'भाषा हिंदी में बदल गई' };
      onShowToast?.(messages[lang] || messages.en);
      setPanel('main');
      onClose();
    }}
  />
) : (
```

- [ ] **Step 2: Run tests to verify nothing broke**

```bash
cd frontend && npm test -- --run src/components/layout/Sidebar/UserMenu.test.jsx
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Sidebar/UserMenu.jsx
git commit -m "feat(i18n): wire LanguagePanel in UserMenu"
```

---

## Task 5: Initialize language from localStorage on load

**Files:**
- Modify: `frontend/src/components/layout/Sidebar/UserButton.jsx`

- [ ] **Step 1: Add language state initialization**

In UserButton, add language state that reads from localStorage:
```javascript
const [currentLanguage, setCurrentLanguage] = useState(() => {
  try {
    return localStorage.getItem('cp-language') || 'en';
  } catch {
    return 'en';
  }
});
```

- [ ] **Step 2: Pass language to UserMenu**

Update the UserMenu props:
```javascript
<UserMenu
  isOpen={isMenuOpen}
  onClose={() => setIsMenuOpen(false)}
  triggerBtnRef={localButtonRef}
  onShowToast={handleShowToast}
  currentLanguage={currentLanguage}
  onLanguageChange={setCurrentLanguage}
/>
```

- [ ] **Step 3: Update UserMenu to accept and use currentLanguage**

In UserMenu.jsx, update the component signature:
```javascript
export default function UserMenu({ isOpen, onClose, triggerBtnRef, onShowToast, currentLanguage = 'en', onLanguageChange }) {
```

Pass it to LanguagePanel:
```javascript
panel === 'language' ? (
  <LanguagePanel
    onBack={() => setPanel('main')}
    currentLanguage={currentLanguage}
    onLanguageChange={(lang) => {
      try {
        localStorage.setItem('cp-language', lang);
      } catch (e) {}
      onLanguageChange?.(lang);
      const messages = { en: 'Language changed to English', hi: 'भाषा हिंदी में बदल गई' };
      onShowToast?.(messages[lang] || messages.en);
      setPanel('main');
      onClose();
    }}
  />
) :
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar/UserButton.jsx frontend/src/components/layout/Sidebar/UserMenu.jsx
git commit -m "feat(i18n): initialize language from localStorage on load"
```

---

## Verification

Run full test suite:
```bash
cd frontend && npm test -- --run
```

Expected: All tests pass

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add LS_LANGUAGE constant |
| 2 | Create translation map |
| 3 | Create LanguagePanel with tests |
| 4 | Wire panel in UserMenu |
| 5 | Initialize language from localStorage |

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?