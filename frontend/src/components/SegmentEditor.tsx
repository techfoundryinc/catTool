import { useCallback } from "react";
import type { Segment } from "../types";
import { SegmentRow } from "./SegmentRow";

interface Props {
  segments: Segment[];
  activeId: number | null;
  onFocus: (id: number) => void;
  onChange: (segId: string, text: string) => void;
  onConfirm: (segId: string) => void;
}

export function SegmentEditor({ segments, activeId, onFocus, onChange, onConfirm }: Props) {
  const handleNavigate = useCallback(
    (dir: "next" | "prev") => {
      if (activeId === null) return;
      const idx = segments.findIndex((s) => s.id === activeId);
      if (idx === -1) return;
      const next = dir === "next" ? segments[idx + 1] : segments[idx - 1];
      if (next) onFocus(next.id);
    },
    [activeId, segments, onFocus]
  );

  if (segments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-lg font-medium">No segments loaded</p>
          <p className="text-sm mt-1">Open an XLIFF file to start translating.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse table-fixed">
        <thead className="sticky top-0 z-10 bg-gray-100 border-b-2 border-gray-300">
          <tr>
            <th className="w-10 px-2 py-2 text-xs text-gray-500 font-semibold text-center">#</th>
            <th className="w-1/2 px-3 py-2 text-xs text-gray-500 font-semibold text-left">Source</th>
            <th className="w-1/2 px-3 py-2 text-xs text-gray-500 font-semibold text-left">Target</th>
            <th className="w-28 px-2 py-2 text-xs text-gray-500 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg, i) => (
            <SegmentRow
              key={seg.id}
              segment={seg}
              index={i}
              isActive={seg.id === activeId}
              onFocus={onFocus}
              onChange={onChange}
              onConfirm={onConfirm}
              onNavigate={handleNavigate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
