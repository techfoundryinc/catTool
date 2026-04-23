import React, { useRef, useEffect, useCallback } from "react";
import type { Segment, SegmentStatus } from "../types";

interface Props {
  segment: Segment;
  index: number;
  isActive: boolean;
  onFocus: (id: number) => void;
  onChange: (segId: string, text: string) => void;
  onConfirm: (segId: string) => void;
  onNavigate: (dir: "next" | "prev") => void;
}

const STATUS_STYLES: Record<SegmentStatus, string> = {
  new: "bg-white",
  draft: "bg-yellow-50",
  confirmed: "bg-green-50",
};

function tmBadge(score: number | null): { label: string; cls: string } | null {
  if (score === 101) return { label: "101% ICE", cls: "bg-blue-100 text-blue-800 border border-blue-300" };
  if (score === 100) return { label: "100%", cls: "bg-green-100 text-green-800 border border-green-300" };
  if (score !== null && score >= 75) return { label: `${score}%`, cls: "bg-yellow-100 text-yellow-800 border border-yellow-300" };
  return null;
}

function tmLeftBorder(score: number | null): string {
  if (score === 101) return "border-l-4 border-l-blue-400";
  if (score === 100) return "border-l-4 border-l-green-400";
  if (score !== null && score >= 75) return "border-l-4 border-l-yellow-400";
  return "border-l-4 border-l-transparent";
}

const STATUS_BADGE: Record<SegmentStatus, string> = {
  new: "bg-gray-200 text-gray-600",
  draft: "bg-yellow-200 text-yellow-800",
  confirmed: "bg-green-200 text-green-800",
};

export function SegmentRow({
  segment,
  index,
  isActive,
  onFocus,
  onChange,
  onConfirm,
  onNavigate,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isActive) {
      textareaRef.current?.focus();
    }
  }, [isActive]);

  // Auto-resize textarea height
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [segment.target_text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        onNavigate(e.shiftKey ? "prev" : "next");
      } else if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        onConfirm(segment.seg_id);
      }
    },
    [onNavigate, onConfirm, segment.seg_id]
  );

  const badge = tmBadge(segment.tm_score);

  return (
    <tr
      className={`border-b border-gray-200 transition-colors ${STATUS_STYLES[segment.status]} ${tmLeftBorder(segment.tm_score)} ${
        isActive ? "ring-2 ring-inset ring-blue-400" : "hover:bg-blue-50/30"
      }`}
      onClick={() => onFocus(segment.id)}
    >
      {/* Row number */}
      <td className="w-10 px-2 py-2 text-center text-xs text-gray-400 select-none align-top pt-3">
        {index + 1}
      </td>

      {/* Source */}
      <td className="w-1/2 px-3 py-2 text-sm text-gray-700 align-top whitespace-pre-wrap break-words">
        {segment.source_text}
      </td>

      {/* Target */}
      <td className="w-1/2 px-2 py-2 align-top">
        <textarea
          ref={textareaRef}
          className={`seg-target w-full resize-none text-sm bg-transparent border-0 p-1 rounded min-h-[2rem] ${
            isActive ? "bg-white shadow-inner" : ""
          }`}
          value={segment.target_text}
          placeholder="Enter translation…"
          onChange={(e) => onChange(segment.seg_id, e.target.value)}
          onFocus={() => onFocus(segment.id)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      </td>

      {/* Status badge + TM origin badge + confirm button */}
      <td className="w-28 px-2 py-2 align-top">
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${STATUS_BADGE[segment.status]}`}
          >
            {segment.status}
          </span>
          {badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {isActive && segment.status !== "confirmed" && (
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // keep textarea focus
                onConfirm(segment.seg_id);
              }}
              className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
