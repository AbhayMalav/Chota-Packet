import { useState, useMemo, useCallback } from 'react';

/**
 * useTokenAnalytics — Tracks cumulative enhancement statistics (Item 14).
 *
 * Persists to localStorage. Computes hero stats:
 *   - Total Tokens Saved
 *   - Estimated Cost Saved ($0.003 / 1K tokens)
 *   - Total Prompts Improved
 *   - Efficiency Score (0–100) + letter grade (A+ – F)
 */

const STORAGE_KEY = 'cp-token-analytics';
const COST_PER_1K = 0.003;

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function letterGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

export default function useTokenAnalytics() {
  const [data, setData] = useState(loadData);

  const recordEnhancement = useCallback((inputText, outputText) => {
    const inTokens  = inputText.trim().split(/\s+/).filter(Boolean).length;
    const outTokens = outputText.trim().split(/\s+/).filter(Boolean).length;

    setData(prev => {
      const updated = {
        entries: [
          ...prev.entries,
          { inTokens, outTokens, ts: Date.now() },
        ],
      };
      saveData(updated);
      return updated;
    });
  }, []);

  const stats = useMemo(() => {
    const { entries } = data;
    if (entries.length === 0) {
      return {
        totalTokensSaved: 0,
        estimatedCostSaved: '0.000000',
        totalPrompts: 0,
        efficiencyScore: 0,
        grade: 'N/A',
      };
    }

    let totalIn = 0;
    let totalOut = 0;
    let ratioSum = 0;

    for (const e of entries) {
      totalIn  += e.inTokens;
      totalOut += e.outTokens;
      const saved = e.outTokens - e.inTokens;
      ratioSum += saved / Math.max(e.outTokens, 1);
    }

    const tokensSaved = Math.max(0, totalOut - totalIn);
    const costSaved   = (tokensSaved / 1000) * COST_PER_1K;
    const avgRatio    = (ratioSum / entries.length) * 100;
    const score       = Math.round(Math.max(0, Math.min(100, avgRatio)));

    return {
      totalTokensSaved: tokensSaved,
      estimatedCostSaved: costSaved.toFixed(6),
      totalPrompts: entries.length,
      efficiencyScore: score,
      grade: letterGrade(score),
    };
  }, [data]);

  return { stats, recordEnhancement };
}
