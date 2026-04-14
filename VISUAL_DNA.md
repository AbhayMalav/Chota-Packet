# Chota Packet Visual DNA

> This document defines the complete visual design language for the Chota Packet project. All AI agents working on this codebase should understand and respect these design tokens.

---

## Design System Overview

| Aspect | Implementation |
|--------|----------------|
| CSS Framework | Tailwind CSS v4 with `@theme` CSS-first config |
| Component Strategy | Custom glassmorphism components (no UI library) |
| Dark Mode | Full support via `[data-theme="light"]` override |
| Theme Variants | 6 switchable brand colors (purple default, orange, blue, teal, brown, dusk) |

---

## Brand Colors

### Default Theme (Purple)

| Token | RGB Value | Usage |
|-------|-----------|-------|
| `--brand-rgb` | `127, 19, 236` | Primary buttons, focus rings, borders |
| `--brand-light-rgb` | `168, 85, 247` | Hover states, active indicators |
| `--brand-dark-rgb` | `96, 16, 184` | Button hover gradient |
| `--accent-rgb` | `99, 102, 241` | Secondary accents, gradients |

### Theme Variants

Apply via `.theme-*` class on root element:
- `.theme-orange` → Orange brand
- `.theme-carrot` → Red-orange brand
- `.theme-blue` → Blue brand
- `.theme-teal` → Teal brand
- `.theme-brown` → Brown brand
- `.theme-dusk` → Purple (dusk variant)

---

## Backgrounds

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--theme-bg` | `#0a0a12` | `#f4f4f8` |
| `--theme-bg-card` | `rgba(17, 17, 32, 0.8)` | `rgba(255, 255, 255, 0.88)` |
| `--theme-bg-navbar` | `rgba(10, 10, 18, 0.75)` | `rgba(248, 248, 255, 0.85)` |
| `--theme-bg-sidebar` | `rgba(13, 13, 30, 0.92)` | `rgba(245, 245, 252, 0.96)` |
| `--theme-bg-overlay` | `rgba(0, 0, 0, 0.65)` | `rgba(100, 100, 140, 0.35)` |

---

## Text Colors

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--theme-text` | `#e2e2f0` | `#1a1a2e` |
| `--theme-text-muted` | `#a0a0b8` | `#4a4a6a` |
| `--theme-text-secondary` | `#6a6a8a` | `#7a7a9a` |
| `--theme-placeholder` | `#4a4a6a` | `#9090a8` |

---

## Status Colors

| Token | Color |
|-------|-------|
| `--color-white` | `#ffffff` |
| `--color-danger` | `#f87171` |
| `--color-danger-muted` | `#fca5a5` |
| `--color-danger-bg` | `rgba(239, 68, 68, 0.1)` |
| `--color-danger-bg-hover` | `rgba(239, 68, 68, 0.18)` |
| `--color-success` | `#34d399` |
| `--color-success-bg` | `rgba(52, 211, 153, 0.1)` |

---

## Typography

| Token | Value |
|-------|-------|
| Font Family | `"Space Grotesk", ui-sans-serif, system-ui, sans-serif` |
| Navbar Height | `56px` |
| Max Content Width | `1280px` |

---

## Component Patterns

### Buttons

| Class | Style |
|-------|-------|
| `.btn-primary` | Gradient brand→accent, white text, radius-lg, h-36 |
| `.btn-secondary` | Transparent, border-brand, hover:bg-brand/8 |
| `.btn-ghost` | Transparent, h-32, radius-md |
| `.btn-icon` | 40x40 min, transparent, radius-md |
| `.btn-danger` | Transparent, danger border, danger text |

### Glass Components

| Class | Style |
|-------|-------|
| `.glass-card` | `bg-card` + `backdrop-filter: blur(24px)` + border |
| `.glass-navbar` | `bg-navbar` + `backdrop-filter: blur(20px)` + bottom border |
| `.glass-sidebar` | `bg-sidebar` + `backdrop-filter: blur(24px)` + right border |
| `.glass-overlay` | `bg-overlay` + `backdrop-filter: blur(12px)` |

### Input Fields

- Background: `--theme-input-bg` (`rgba(0, 0, 0, 0.3)`)
- Focus: `--theme-input-bg-focus` + brand border
- Hover: `--theme-input-bg-hover`

---

## Animations

| Animation | Duration | Easing |
|-----------|----------|--------|
| `fadeIn` | 0.35s | ease-out |
| `slideInRight` / `slideInLeft` | 0.3s | cubic-bezier(0.16, 1, 0.3, 1) |
| `mic-pulse` | 1.5s | ease-in-out (loop) |
| `glow-pulse` | 3s | ease-in-out (loop) |
| `nebula-drift` | 20s | ease-in-out (loop) |
| `float` | 3.5s | ease-in-out (loop) |
| `dot-pulse` | 1.8s | ease-in-out (loop) |
| `skeleton-shimmer` | 1.5s | ease-in-out (loop) |

**Reduced Motion**: Respected via `prefers-reduced-motion: reduce` media query.

---

## Key CSS Classes to Use

### Layout
- `.app-root` — Flex column, 100% height, overflow hidden
- `.app-layout` — Flex row, takes remaining space, overflow hidden
- `.glass-navbar` — Fixed header, 56px height
- `.glass-sidebar` — Collapsible sidebar

### Utilities (in `utils.css`)
- `.text-theme` → `var(--theme-text)`
- `.text-muted` → `var(--theme-text-muted)`
- `.text-secondary` → `var(--theme-text-secondary)`
- `.bg-input` → `var(--theme-input-bg)`
- `.bg-card` → `var(--theme-bg-card)`
- `.kbd` — Keyboard shortcut pill styling
- `.touch-target` — 44×44px minimum for accessibility

### Diff Highlights
- `.diff-added` — Green background for additions
- `.diff-removed` — Red background with strikethrough for removals

---

## Files to Reference

| File | Purpose |
|------|---------|
| `frontend/src/index.css` | Main design tokens, theme CSS vars, component styles |
| `frontend/src/styles/utils.css` | Semantic utility classes |
| `frontend/src/styles/tokens.css` | Standalone CSS custom properties (generated) |
| `frontend/tailwind.config.js` | Tailwind theme extension (generated) |

---

## WCAG Compliance

This project follows accessibility best practices:
- ✅ Focus rings on all interactive elements (`--theme-focus`)
- ✅ 44×44px touch targets (`.touch-target`)
- ✅ Reduced motion support
- ✅ Color contrast ratios for text
- ✅ Keyboard navigation support

---

## AI Agent Guidelines

When adding new components or modifying styles:

1. **Always use CSS variables** — Never hardcode colors, use `var(--brand-rgb)`, `--theme-text`, etc.
2. **Respect dark/light mode** — Test both themes, use `[data-theme="light"]` override for light-specific values
3. **Follow button hierarchy** — Primary > Secondary > Ghost > Icon > Danger
4. **Use glassmorphism patterns** — Apply `.glass-card`, `.glass-navbar`, etc. for surfaces
5. **Include focus states** — Add `:focus` and `:focus-visible` rules with `--theme-focus`
6. **Keep animations brief** — Default transitions: 0.15s–0.2s, enter animations: 0.3s–0.35s
