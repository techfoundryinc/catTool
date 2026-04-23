import { useState } from "react";
import type { TMMatch } from "../types";

interface Props {
  matches: TMMatch[];
  loading: boolean;
  onApply: (text: string) => void;
  sourceLang?: string;
  targetLang?: string;
}

function ScorePill({ score }: { score: number }) {
  if (score === 101)
    return <div className="w-10 text-center text-xs font-bold py-0.5 px-1 rounded bg-blue-600 text-white shrink-0">101%</div>;
  if (score === 100)
    return <div className="w-10 text-center text-xs font-bold py-0.5 px-1 rounded bg-green-600 text-white shrink-0">100%</div>;
  if (score >= 75)
    return <div className="w-10 text-center text-xs font-bold py-0.5 px-1 rounded bg-green-200 text-green-800 shrink-0">{score}%</div>;
  return <div className="w-10 text-center text-xs font-bold py-0.5 px-1 rounded bg-gray-200 text-gray-600 shrink-0">{score}%</div>;
}

function matchLabel(score: number): string {
  if (score === 101) return "In-context exact match";
  if (score === 100) return "Exact match";
  if (score >= 75) return "Fuzzy match";
  return "Low fuzzy match";
}

export function TMPanel({ matches, loading, sourceLang, targetLang, onApply }: Props) {
  const [selected, setSelected] = useState<number>(0);
  const selectedMatch = matches[selected] ?? null;

  return (
    <div className="w-80 min-w-[280px] border-l border-gray-300 bg-white flex flex-col text-sm">

      {/* Header */}
      <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-300 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Translation Memory</span>
        {sourceLang && targetLang && (
          <span className="text-xs text-gray-400">{sourceLang} → {targetLang}</span>
        )}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-3 text-xs text-gray-400 text-center">Searching TM…</div>
        )}
        {!loading && matches.length === 0 && (
          <div className="p-3 text-xs text-gray-400 text-center">No TM matches for this segment</div>
        )}
        {!loading && matches.map((m, i) => (
          <div
            key={i}
            onClick={() => { setSelected(i); onApply(m.target_text); }}
            className={`px-3 py-2 border-b border-gray-100 cursor-pointer transition-colors ${
              selected === i ? "bg-orange-50 border-l-2 border-l-orange-400" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-2 mb-1">
              <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
              <ScorePill score={m.score} />
              <span className="text-xs text-gray-500 leading-4">{matchLabel(m.score)}</span>
            </div>
            <div className="ml-6 text-xs text-gray-500 mb-0.5 line-clamp-2">{m.source_text}</div>
            <div className="ml-6 text-sm text-gray-900 font-medium line-clamp-2">{m.target_text}</div>
          </div>
        ))}
      </div>

      {/* Selected match metadata (Phrase-style bottom detail pane) */}
      {selectedMatch && (
        <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 shrink-0">
          <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-1">{selectedMatch.target_text}</div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <div><span className="text-gray-400">Score:</span> {selectedMatch.score === 101 ? "101% ICE" : `${selectedMatch.score}%`}</div>
            <div><span className="text-gray-400">Type:</span> {matchLabel(selectedMatch.score)}</div>
          </div>
        </div>
      )}

      {/* Bottom tabs */}
      <div className="flex border-t border-gray-300 bg-gray-100 shrink-0">
        {["CAT", "Search", "QA"].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-1 text-xs font-medium transition-colors ${
              tab === "CAT" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
