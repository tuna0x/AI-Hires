import { useSyncExternalStore } from "react";

export type AnalysisResult = {
  fileName: string;
  score: number;
  status: string;
  breakdown: {
    formatting: number;
    keywords: number;
    experience: number;
    education: number;
    skills: number;
    readability: number;
  };
  sections: { id: string; title: string; status: "good" | "warn" | "bad"; note: string }[];
  suggestions: { before: string; after: string; reason: string }[];
  topIssues: { title: string; severity: "high" | "medium" | "low"; fix: string }[];
  createdAt: number;
};

let state: { result: AnalysisResult | null } = { result: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const cvStore = {
  getResult: () => state.result,
  setResult(r: AnalysisResult | null) {
    state = { result: r };
    try {
      if (r) localStorage.setItem("cv:last", JSON.stringify(r));
      else localStorage.removeItem("cv:last");
    } catch {}
    emit();
  },
  hydrate() {
    if (state.result) return;
    try {
      const raw = localStorage.getItem("cv:last");
      if (raw) {
        state = { result: JSON.parse(raw) };
        emit();
      }
    } catch {}
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCvResult() {
  return useSyncExternalStore(
    (cb) => cvStore.subscribe(cb),
    () => state.result,
    () => state.result,
  );
}

export function generateMockResult(fileName: string): AnalysisResult {
  // Deterministic-ish but feels fresh
  const seed = (fileName.length * 13) % 18;
  const score = 74 + seed;
  return {
    fileName,
    score,
    status: score >= 85 ? "Excellent Resume" : score >= 70 ? "Good Resume — Can Improve" : "Needs Improvement",
    breakdown: {
      formatting: 88,
      keywords: 72,
      experience: 81,
      education: 92,
      skills: 68,
      readability: 85,
    },
    sections: [
      { id: "contact", title: "Contact Info", status: "warn", note: "Missing LinkedIn profile and portfolio URL." },
      { id: "summary", title: "Professional Summary", status: "warn", note: "Too generic — add a value proposition and target role." },
      { id: "experience", title: "Experience", status: "bad", note: "Bullets describe duties; add measurable achievements with metrics." },
      { id: "skills", title: "Skills", status: "bad", note: "Missing relevant keywords: React, SEO, SQL, TypeScript." },
      { id: "education", title: "Education", status: "good", note: "Looks solid — clearly formatted and dated." },
    ],
    topIssues: [
      { title: "No quantified outcomes in Experience bullets", severity: "high", fix: "Add metrics (revenue, %, time, scale) to at least 60% of your bullets." },
      { title: "Missing role-critical keywords", severity: "high", fix: "Mirror the exact phrasing from your target job descriptions in Skills + Summary." },
      { title: "Generic professional summary", severity: "medium", fix: "Open with a one-line value proposition specific to your target role." },
    ],
    suggestions: [
      {
        before: "Managed sales team",
        after: "Led 8-member sales team and increased quarterly revenue by 28% through pipeline restructuring",
        reason: "Adds team size, metric, and the action that drove impact.",
      },
      {
        before: "Responsible for marketing campaigns",
        after: "Launched 12 multi-channel campaigns generating $1.4M in pipeline at 3.8× ROAS",
        reason: "Quantifies scale, revenue, and efficiency.",
      },
      {
        before: "Helped improve website",
        after: "Redesigned key landing pages, lifting conversion rate from 2.1% to 4.7% in 90 days",
        reason: "Specific outcome with before/after metric and timeframe.",
      },
    ],
    createdAt: Date.now(),
  };
}