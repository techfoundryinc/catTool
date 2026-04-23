import type { TMMatch } from "../types";

interface Props {
  matches: TMMatch[];
  loading: boolean;
  onApply: (text: string) => void;
}

function scoreColor(score: number): string {
  if (score === 101) return "bg-blue-100 text-blue-900 border-blue-400";
  if (score === 100) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 75) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

function scoreLabel(score: number): string {
  if (score === 101) return "101% ICE match";
  return `${score}% match`;
}

export function TMPanel({ matches, loading, onApply }: Props) {
  return (
    <div className="w-80 min-w-64 border-l border-gray-200 bg-white flex flex-col">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Translation Memory
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && (
          <p className="text-xs text-gray-400 text-center pt-4">Looking up…</p>
        )}
        {!loading && matches.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-4">No matches found</p>
        )}
        {!loading &&
          matches.map((m, i) => (
            <div
              key={i}
              className={`border rounded p-2 text-sm cursor-pointer hover:opacity-80 transition-opacity ${scoreColor(m.score)}`}
              onClick={() => onApply(m.target_text)}
              title="Click to apply this match"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{scoreLabel(m.score)}</span>
                <span className="text-xs opacity-70">click to apply</span>
              </div>
              <div className="text-xs text-gray-500 mb-1 line-clamp-2">{m.source_text}</div>
              <div className="font-medium line-clamp-3">{m.target_text}</div>
            </div>
          ))}
      </div>

      <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-400">
        <p>Confirmed segments are saved automatically.</p>
      </div>
    </div>
  );
}
