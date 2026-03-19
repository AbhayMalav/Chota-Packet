import { useMemo } from 'react';

/**
 * useAutoSettings — Analyzes input text and resolves "auto" dropdown values (Item 12).
 *
 * Only activates when ALL four dropdowns (style, tone, level, outputLang) = "auto".
 * If any dropdown is manually set, that field is skipped.
 */

// ── Intent detection regexes ──────────────────────────────────────────────────

const CODE_RE    = /\b(function|class|const|let|var|import|export|async|await|return|api|endpoint|database|query|sql|html|css|javascript|python|react|component|algorithm|debug|refactor|deploy|server|client|frontend|backend|code|program|script|bug|test|compile)\b/i;
const CREATIVE_RE = /\b(story|poem|creative|imagine|fiction|narrative|character|plot|write me|blog\s?post|article|essay|content|song|lyrics)\b/i;
const MARKET_RE  = /\b(marketing|campaign|ad|advertisement|brand|audience|conversion|seo|social\s?media|email|newsletter|promotion|sales|landing\s?page|copy|headline)\b/i;
const ACADEMIC_RE = /\b(research|thesis|paper|study|analysis|hypothesis|conclusion|literature|review|methodology|academic|scientific|theory|evidence|citation)\b/i;
const DATA_RE    = /\b(data|analy[sz]e|chart|graph|statistics|metrics|dashboard|report|spreadsheet|csv|dataset|visualization)\b/i;
const STEP_RE    = /\b(steps?|how\s?to|guide|tutorial|instructions?|procedure|process|walkthrough|step[\s-]by[\s-]step)\b/i;

const FORMAL_RE    = /\b(please|kindly|professional|formal|respectfully|officially|proposal|report|presentation|executive|memo)\b/i;
const CASUAL_RE    = /\b(hey|yo|cool|awesome|gonna|wanna|kinda|lol|tbh|btw|quick|simple|easy|just|like)\b/i;
const TECHNICAL_RE = /\b(implementation|architecture|specification|protocol|framework|infrastructure|optimize|optimization|scalable|scalability|performance|latency|throughput|microservice)\b/i;

const HINDI_RE = /[\u0900-\u097F]/;


function analyzeText(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const avgWordLen = wordCount > 0
    ? words.reduce((s, w) => s + w.length, 0) / wordCount
    : 0;

  const hasCode     = CODE_RE.test(text);
  const hasCreative = CREATIVE_RE.test(text);
  const hasMarketing = MARKET_RE.test(text);
  const hasAcademic = ACADEMIC_RE.test(text);
  const hasData     = DATA_RE.test(text);
  const hasStep     = STEP_RE.test(text);

  const hasFormal    = FORMAL_RE.test(text);
  const hasCasual    = CASUAL_RE.test(text);
  const hasTechnical = TECHNICAL_RE.test(text);

  const hasHindi = HINDI_RE.test(text);

  // Complexity score 0-6
  const complexity =
    (avgWordLen > 6 ? 2 : avgWordLen > 4.5 ? 1 : 0) +
    (wordCount > 50 ? 2 : wordCount > 20 ? 1 : 0) +
    (hasCode || hasAcademic ? 1 : 0) +
    (hasTechnical ? 1 : 0);

  return {
    wordCount, avgWordLen, complexity,
    hasCode, hasCreative, hasMarketing, hasAcademic, hasData, hasStep,
    hasFormal, hasCasual, hasTechnical, hasHindi,
  };
}


function resolveStyle(a) {
  if (a.hasCode)      return 'code';
  if (a.hasStep)      return 'stepbystep';
  if (a.hasCreative)  return 'creative';
  if (a.hasMarketing) return 'marketing';
  if (a.hasAcademic)  return 'academic';
  if (a.hasData)      return 'data';
  if (a.wordCount > 30) return 'detailed';
  return 'general';
}

function resolveTone(a) {
  if (a.hasTechnical) return 'technical';
  if (a.hasFormal)    return 'formal';
  if (a.hasCasual)    return 'casual';
  return '';
}

function resolveLevel(a) {
  if (a.complexity >= 4) return 'advanced';
  if (a.complexity >= 2) return 'detailed';
  return 'basic';
}

function resolveOutputLang(a) {
  return a.hasHindi ? 'hi' : 'en';
}


export default function useAutoSettings(inputText, { style, tone, level, outputLang }) {
  const resolved = useMemo(() => {
    if (!inputText || !inputText.trim()) {
      return { style: 'general', tone: '', level: 'basic', outputLang: 'en' };
    }
    const a = analyzeText(inputText);
    return {
      style:      resolveStyle(a),
      tone:       resolveTone(a),
      level:      resolveLevel(a),
      outputLang: resolveOutputLang(a),
    };
  }, [inputText]);

  const isAutoActive =
    style === 'auto' && tone === 'auto' && level === 'auto' && outputLang === 'auto';

  const effective = {
    style:      style === 'auto'      ? resolved.style      : style,
    tone:       tone === 'auto'       ? resolved.tone       : tone,
    level:      level === 'auto'      ? resolved.level      : level,
    outputLang: outputLang === 'auto' ? resolved.outputLang : outputLang,
  };

  return { resolved, effective, isAutoActive };
}
