import { useMemo } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

// Cap analysis to avoid running regexes over huge pasted documents
const ANALYSIS_CAP = 500

// ── Regexes ───────────────────────────────────────────────────────────────────
// No `g` flag on any regex - avoids stateful lastIndex bugs when reused across calls

const CODE_RE = /\b(function|class|const|let|var|import|export|async|await|return|api|endpoint|database|query|sql|html|css|javascript|python|react|component|algorithm|debug|refactor|deploy|server|client|frontend|backend|code|program|script|bug|test|compile)\b/i
const CREATIVE_RE = /\b(story|poem|creative|imagine|fiction|narrative|character|plot|write me|blog\s?post|article|essay|content|song|lyrics)\b/i
const MARKET_RE = /\b(marketing|campaign|ad|advertisement|brand|audience|conversion|seo|social\s?media|email|newsletter|promotion|sales|landing\s?page|copy|headline)\b/i
const ACADEMIC_RE = /\b(research|thesis|paper|study|analysis|hypothesis|conclusion|literature|review|methodology|academic|scientific|theory|evidence|citation)\b/i
const DATA_RE = /\b(data|analy[sz]e|chart|graph|statistics|metrics|dashboard|report|spreadsheet|csv|dataset|visualization)\b/i
const STEP_RE = /\b(steps?|how\s?to|guide|tutorial|instructions?|procedure|process|walkthrough|step[\s-]by[\s-]step)\b/i

const FORMAL_RE = /\b(please|kindly|professional|formal|respectfully|officially|proposal|report|presentation|executive|memo)\b/i
const CASUAL_RE = /\b(hey|yo|cool|awesome|gonna|wanna|kinda|lol|tbh|btw|quick|simple|easy|just|like)\b/i
const TECHNICAL_RE = /\b(implementation|architecture|specification|protocol|framework|infrastructure|optimize|optimization|scalable|scalability|performance|latency|throughput|microservice)\b/i

const HINDI_RE = /[\u0900-\u097F]/

// ── Text analysis ─────────────────────────────────────────────────────────────

function analyzeText(rawText) {
  // Cap input length to avoid regex overhead on large pastes
  const text = rawText.slice(0, ANALYSIS_CAP)
  const words = text.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const avgWordLen = wordCount > 0
    ? words.reduce((s, w) => s + w.length, 0) / wordCount
    : 0

  const hasCode = CODE_RE.test(text)
  const hasCreative = CREATIVE_RE.test(text)
  const hasMarketing = MARKET_RE.test(text)
  const hasAcademic = ACADEMIC_RE.test(text)
  const hasData = DATA_RE.test(text)
  const hasStep = STEP_RE.test(text)

  const hasFormal = FORMAL_RE.test(text)
  const hasCasual = CASUAL_RE.test(text)
  const hasTechnical = TECHNICAL_RE.test(text)

  const hasHindi = HINDI_RE.test(rawText) // Hindi check on full text - chars not in first 500 are valid

  // Complexity score 0–6
  const complexity =
    (avgWordLen > 6 ? 2 : avgWordLen > 4.5 ? 1 : 0) +
    (wordCount > 50 ? 2 : wordCount > 20 ? 1 : 0) +
    (hasCode || hasAcademic ? 1 : 0) +
    (hasTechnical ? 1 : 0)

  return {
    wordCount, avgWordLen, complexity,
    hasCode, hasCreative, hasMarketing, hasAcademic, hasData, hasStep,
    hasFormal, hasCasual, hasTechnical, hasHindi,
  }
}

// ── Resolvers ─────────────────────────────────────────────────────────────────

function resolveStyle(a) {
  // Use signal scoring so prompts matching multiple categories pick the strongest
  const scores = {
    code: a.hasCode ? 2 : 0,
    stepbystep: a.hasStep ? 2 : 0,
    creative: a.hasCreative ? 2 : 0,
    marketing: a.hasMarketing ? 2 : 0,
    academic: a.hasAcademic ? 2 : 0,
    data: a.hasData ? 2 : 0,
  }

  // Boost code if technical signals also present (e.g. "optimize SQL query")
  if (a.hasCode && a.hasTechnical) scores.code += 1
  // Boost stepbystep if formal signals present (e.g. "please provide steps")
  if (a.hasStep && a.hasFormal) scores.stepbystep += 1

  const top = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)[0]

  if (top) return top[0]
  return a.wordCount > 30 ? 'detailed' : 'general'
}

function resolveTone(a) {
  if (a.hasTechnical) return 'technical'
  if (a.hasFormal) return 'formal'
  if (a.hasCasual) return 'casual'
  // Return 'auto' not '' - lets callers distinguish "undetected" from "not resolved"
  return 'auto'
}

function resolveLevel(a) {
  // Short but highly technical prompts (e.g. "optimize SQL") should be advanced
  if (a.complexity >= 4) return 'advanced'
  if (a.complexity >= 3) return 'advanced'
  if (a.complexity >= 2) return 'detailed'
  if (a.hasTechnical && a.wordCount <= 10) return 'advanced'
  return 'basic'
}

function resolveOutputLang(a) {
  return a.hasHindi ? 'hi' : 'en'
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Analyses input text and resolves "auto" dropdown values to concrete settings.
 *
 * Each field is resolved independently - if a field is manually set (not "auto"),
 * the detected value for that field is ignored and the manual value is used.
 *
 * `isAutoActive` is true when ALL four fields are "auto". Intended for UI use
 * only (e.g. showing an "Auto" badge in ControlBar) - it does not gate resolution
 * inside this hook.
 *
 * @param {string} inputText - The current prompt input
 * @param {{ style: string, tone: string, level: string, outputLang: string }} settings
 * @returns {{ resolved: object, effective: object, isAutoActive: boolean }}
 */
export default function useAutoSettings(inputText, { style, tone, level, outputLang }) {
  const resolved = useMemo(() => {
    if (!inputText?.trim()) {
      return { style: 'general', tone: 'auto', level: 'basic', outputLang: 'en' }
    }
    const a = analyzeText(inputText)
    return {
      style: resolveStyle(a),
      tone: resolveTone(a),
      level: resolveLevel(a),
      outputLang: resolveOutputLang(a),
    }
  }, [inputText])

  // True when all dropdowns are on auto - useful for showing an "Auto mode" badge in UI
  const isAutoActive =
    style === 'auto' && tone === 'auto' && level === 'auto' && outputLang === 'auto'

  // Each field resolved independently - manual selections always take precedence
  const effective = {
    style: style === 'auto' ? resolved.style : style,
    tone: tone === 'auto' ? resolved.tone : tone,
    level: level === 'auto' ? resolved.level : level,
    outputLang: outputLang === 'auto' ? resolved.outputLang : outputLang,
  }

  return { resolved, effective, isAutoActive }
}
