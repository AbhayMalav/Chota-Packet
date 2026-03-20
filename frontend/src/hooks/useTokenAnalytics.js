import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LS_ANALYTICS, estimateTokens } from '../constants';

const COST_PER_1K = 0.003;
const MAX_ENTRIES = 500;

// ── Storage helpers ────────────────────────────────────────────────────────────

function loadData() {
  try {
    const raw = localStorage.getItem(LS_ANALYTICS);
    if (!raw) return { entries: [] };

    const parsed = JSON.parse(raw);

    // Guard against corrupted / manually-edited localStorage
    if (!parsed || !Array.isArray(parsed.entries)) {
      if (import.meta.env.DEV) {
        console.warn('[useTokenAnalytics] Corrupt data in localStorage - resetting.');
      }
      return { entries: [] };
    }

    return parsed;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[useTokenAnalytics] Failed to parse localStorage data - resetting:', err);
    }
    return { entries: [] };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(LS_ANALYTICS, JSON.stringify(data));
  } catch (err) {
    // Quota exceeded or private browsing - non-fatal, analytics just won't persist
    if (import.meta.env.DEV) {
      console.warn('[useTokenAnalytics] Failed to persist analytics to localStorage:', err);
    }
  }
}

// ── Grade helper ───────────────────────────────────────────────────────────────

function letterGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * useTokenAnalytics - Tracks cumulative enhancement statistics.
 *
 * Persists to localStorage (capped at MAX_ENTRIES). Computes hero stats:
 * - Total Tokens Saved
 * - Estimated Cost Saved ($0.003 / 1K tokens)
 * - Total Prompts Improved
 * - Efficiency Score (0–100) + letter grade (A+ – F)
 */
export default function useTokenAnalytics() {
  const [data, setData] = useState(loadData);

  // Prevents writing data back to localStorage on the initial mount read
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    saveData(data);
  }, [data]);

  const recordEnhancement = useCallback((inputText, outputText) => {
    if (typeof inputText !== 'string' || typeof outputText !== 'string') {
      if (import.meta.env.DEV) {
        console.warn(
          '[useTokenAnalytics] recordEnhancement expects two strings. Got:',
          typeof inputText,
          typeof outputText
        );
      }
      return;
    }

    const inTokens = estimateTokens(inputText.trim());
    const outTokens = estimateTokens(outputText.trim());

    setData((prev) => {
      const updated = [
        ...prev.entries,
        { inTokens, outTokens, ts: Date.now() },
      ];

      // Evict oldest entries if we exceed the cap
      const bounded = updated.length > MAX_ENTRIES
        ? updated.slice(updated.length - MAX_ENTRIES)
        : updated;

      return { entries: bounded };
    });
  }, []);

  const stats = useMemo(() => {
    const { entries } = data;

    if (entries.length === 0) {
      return {
        totalTokensSaved: 0,
        estimatedCostSaved: 0,
        totalPrompts: 0,
        efficiencyScore: 0,
        grade: 'N/A',
      };
    }

    let totalIn = 0;
    let totalOut = 0;
    let ratioSum = 0;

    for (const e of entries) {
      totalIn += e.inTokens;
      totalOut += e.outTokens;
      const saved = e.outTokens - e.inTokens;
      ratioSum += saved / Math.max(e.outTokens, 1);
    }

    const tokensSaved = Math.max(0, totalOut - totalIn);
    const costSaved = (tokensSaved / 1000) * COST_PER_1K;  // raw number
    const avgRatio = (ratioSum / entries.length) * 100;
    const score = Math.round(Math.max(0, Math.min(100, avgRatio)));

    return {
      totalTokensSaved: tokensSaved,
      estimatedCostSaved: costSaved,   // number - let the display layer call .toFixed()
      totalPrompts: entries.length,
      efficiencyScore: score,
      grade: letterGrade(score),
    };
  }, [data]);

  return { stats, recordEnhancement };
}
