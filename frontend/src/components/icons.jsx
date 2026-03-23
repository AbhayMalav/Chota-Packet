// icons.jsx - Shared SVG icon components for the Chota Packet navbar and UI controls.
// All icons are decorative; they must always be paired with a labelled parent element.
// Icon set: Heroicons v2 Solid (20x20)


// Shared accessibility props applied to every icon SVG.
// aria-hidden: hides decorative icons from screen readers.
// focusable: prevents SVGs from becoming tab stops in older browsers.
const iconA11y = {
  'aria-hidden': true,
  focusable: 'false',
}


export function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} {...iconA11y}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
        clipRule="evenodd"
      />
    </svg>
  )
}


export function GearIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} {...iconA11y}>
      <path
        fillRule="evenodd"
        d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.992 6.992 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  )
}


export function SunIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} {...iconA11y}>
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
    </svg>
  )
}


export function MoonIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} {...iconA11y}>
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  )
}


export function ChevronDownIcon({ className = 'w-2.5 h-2.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} {...iconA11y}>
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}


// ── Settings panel icons ───────────────────────────────────────────────────────


export function PlugIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M10 2a.75.75 0 01.75.75v.5h1.5a.75.75 0 010 1.5h-.75v2.836l2.539 2.538A3.5 3.5 0 0114.5 13H13v3.25a.75.75 0 01-1.5 0V13H8.5v3.25a.75.75 0 01-1.5 0V13H5.5a3.5 3.5 0 01-.539-6.876L7.5 3.586V3.75H6.75a.75.75 0 010-1.5h1.5v-.5A.75.75 0 0110 2z" />
    </svg>
  )
}


export function KeyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
    </svg>
  )
}


export function CpuIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M6 4.75A.75.75 0 016.75 4h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 4.75zM4 7.75A.75.75 0 014.75 7h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 7.75zm0 3A.75.75 0 014.75 10h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10.75zm2 3A.75.75 0 016.75 13h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 016 13.75zM2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  )
}


export function KeyboardIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 000-2H5zm2 0a1 1 0 011-1h.01a1 1 0 110 2H8a1 1 0 01-1-1zm3 0a1 1 0 000 2h.01a1 1 0 000-2H11zm2 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1zm2 3a1 1 0 000 2h.01a1 1 0 000-2H15zm-2 0a1 1 0 011-1h.01a1 1 0 110 2H14a1 1 0 01-1-1zm-3 0a1 1 0 000 2h.01a1 1 0 000-2H11zm-2 0a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 9a1 1 0 000 2h.01a1 1 0 000-2H7zm-2 0a1 1 0 011-1h.01a1 1 0 110 2H6a1 1 0 01-1-1zm8 2a1 1 0 000 2h.01a1 1 0 000-2H15v-1zM5 12a1 1 0 011 1h6a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  )
}


export function ShieldIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
    </svg>
  )
}


export function ArrowRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  )
}


export function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  )
}


export function PinIcon({ className = 'w-4 h-4', filled = false }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.5} className={className} aria-hidden="true" focusable="false">
      {filled
        ? <path d="M9.828 3.009a.75.75 0 01.727.182l5.254 5.254a.75.75 0 01-.499 1.285l-1.56.013-2.835 2.836.013 1.56a.75.75 0 01-1.285.499L4.39 9.385a.75.75 0 01.499-1.285l1.56-.013 2.836-2.835-.013-1.56a.75.75 0 01.556-.683zM3.22 14.97a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06z" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M9.828 3.009a.75.75 0 01.727.182l5.254 5.254a.75.75 0 01-.499 1.285l-1.56.013-2.835 2.836.013 1.56a.75.75 0 01-1.285.499L4.39 9.385a.75.75 0 01.499-1.285l1.56-.013 2.836-2.835-.013-1.56a.75.75 0 01.556-.683zM3.22 14.97a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06z" />
      }
    </svg>
  )
}


export function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  )
}


export function HistoryIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  )
}


export function LoadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  )
}


export function XIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}


export function MicIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
      <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
    </svg>
  )
}


export function StopIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M4.5 4.5a1 1 0 00-1 1v9a1 1 0 001 1h11a1 1 0 001-1v-9a1 1 0 00-1-1h-11z" clipRule="evenodd" />
    </svg>
  )
}


// ── Onboarding icons ───────────────────────────────────────────────────────────


export function SparklesIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
  )
}


export function GlobeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
    </svg>
  )
}


// ── Error boundary icon ────────────────────────────────────────────────────────


export function ExclamationTriangleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}
// ── ControlBar icons ──────────────────────────────────────────────────────────


export function RegenerateIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H5.498a.75.75 0 00-.75.75v3.213a.75.75 0 001.5 0v-1.67l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V3.928a.75.75 0 00-1.5 0v1.67l-.311-.31A7 7 0 003.239 8.424a.75.75 0 001.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h3.218a.75.75 0 00.53-.219z" clipRule="evenodd" />
    </svg>
  )
}
// ── OutputCard icons ──────────────────────────────────────────────────────────


export function ClipboardIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}


export function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}


export function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}


export function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

// ── SettingsModal icons ───────────────────────────────────────────────────────


export function EyeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  )
}


export function EyeOffIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
    </svg>
  )
}
