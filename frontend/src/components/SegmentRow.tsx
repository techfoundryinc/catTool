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

function rowBg(status: SegmentStatus, locked: boolean, isActive: boolean): string {
  if (locked) return isActive ? "bg-blue-100" : "bg-blue-50/60";
  if (isActive) return "bg-orange-50";
  if (status === "confirmed") return "bg-green-50";
  return "bg-white";
}

function StatusIcon({ status, locked }: { status: SegmentStatus; locked: boolean }) {
  if (locked)
    return <span className="text-blue-500 text-base leading-none" title="Locked — 101% ICE match">🔒</span>;
  if (status === "confirmed")
    return <span className="text-green-600 text-base leading-none">✓</span>;
  if (status === "draft")
    return <span className="text-red-500 text-base leading-none">✗</span>;
  return <span className="text-gray-300 text-base leading-none">○</span>;
}

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
    if (isActive) textareaRef.current?.focus();
  }, [isActive]);

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

  return (
    <tr
      className={`border-b border-gray-200 transition-colors cursor-pointer ${rowBg(segment.status, segment.locked, isActive)} ${
        isActive && !segment.locked ? "outline outline-2 outline-orange-400 outline-offset-[-2px]" : ""
        }${isActive && segment.locked ? "outline outline-2 outline-blue-400 outline-offset-[-2px]" : ""
        }${!isActive ? "hover:bg-orange-50/40" : ""}`}
      onClick={() => onFocus(segment.id)}
    >
      {/* Row number */}
      <td className="w-8 px-2 py-2 text-center text-xs text-gray-500 select-none align-top pt-2.5 border-r border-gray-200 font-medium">
        {index + 1}
      </td>

      {/* Source */}
      <td className="w-[47%] px-3 py-2 text-sm text-gray-800 align-top whitespace-pre-wrap break-words border-r border-gray-200">
        {segment.source_text}
      </td>

      {/* Target */}
      <td className="w-[47%] px-2 py-1.5 align-top border-r border-gray-200">
        <textarea
          ref={textareaRef}
          className={`seg-target w-full resize-none text-sm border-0 p-1 min-h-[1.5rem] focus:outline-none placeholder-gray-300 ${
            segment.locked ? "bg-transparent text-gray-500 cursor-not-allowed select-none" : "bg-transparent"
          }`}
          value={segment.target_text}
          placeholder={isActive && !segment.locked ? "Type translation…" : ""}
          readOnly={segment.locked}
          onChange={(e) => !segment.locked && onChange(segment.seg_id, e.target.value)}
          onFocus={() => onFocus(segment.id)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        {isActive && segment.locked && (
          <div className="mt-0.5 text-xs text-blue-500 text-right">🔒 Locked — 101% ICE match</div>
        )}
        {isActive && !segment.locked && segment.status !== "confirmed" && (
          <div className="flex justify-end mt-0.5">
            <button
              onMouseDown={(e) => { e.preventDefault(); onConfirm(segment.seg_id); }}
              className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        )}
      </td>

      {/* Status icons */}
      <td className="w-12 px-2 py-2 align-top">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <StatusIcon status={segment.status} locked={segment.locked} />
          {!segment.locked && segment.tm_score !== null && (
            <span className="text-xs text-gray-400 font-mono">{segment.tm_score}%</span>
          )}
        </div>
      </td>
    </tr>
  );
}
