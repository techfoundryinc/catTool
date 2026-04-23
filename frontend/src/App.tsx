import { useState, useEffect, useCallback, useRef } from "react";
import type { Segment, FileInfo, TMMatch } from "./types";
import { uploadFile, fetchSegments, updateSegment, lookupTM, exportUrl } from "./api/client";
import { Toolbar } from "./components/Toolbar";
import { SegmentEditor } from "./components/SegmentEditor";
import { TMPanel } from "./components/TMPanel";

export default function App() {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [allSegments, setAllSegments] = useState<Segment[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tmMatches, setTmMatches] = useState<TMMatch[]>([]);
  const [tmLoading, setTmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for auto-saving draft
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtered + searched view
  const visibleSegments = allSegments.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.source_text.toLowerCase().includes(q) || s.target_text.toLowerCase().includes(q);
    }
    return true;
  });

  const activeSegment = allSegments.find((s) => s.id === activeId) ?? null;

  // Load TM matches when active segment changes
  useEffect(() => {
    if (!activeSegment) {
      setTmMatches([]);
      return;
    }
    setTmLoading(true);
    lookupTM(activeSegment.source_text, activeSegment.source_lang, activeSegment.target_lang)
      .then(setTmMatches)
      .catch(() => setTmMatches([]))
      .finally(() => setTmLoading(false));
  }, [activeSegment?.id]);

  async function handleFileLoad(file: File) {
    try {
      setError(null);
      const info = await uploadFile(file);
      setFileInfo(info);
      const segs = await fetchSegments(info.file_id);
      setAllSegments(segs);
      setActiveId(segs[0]?.id ?? null);
      setFilter("all");
      setSearchQuery("");
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Failed to load file. Make sure it is a valid XLIFF 1.2 file.");
    }
  }

  const handleFocus = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  const handleChange = useCallback(
    (segId: string, text: string) => {
      if (!fileInfo) return;

      // Optimistic update
      setAllSegments((prev) =>
        prev.map((s) =>
          s.seg_id === segId
            ? { ...s, target_text: text, status: s.status === "new" ? "draft" : s.status }
            : s
        )
      );

      // Debounced save
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const seg = allSegments.find((s) => s.seg_id === segId);
        if (!seg) return;
        const newStatus = seg.status === "new" ? "draft" : seg.status;
        try {
          const updated = await updateSegment(fileInfo.file_id, segId, text, newStatus);
          setAllSegments((prev) => prev.map((s) => (s.seg_id === segId ? updated : s)));
          refreshFileInfo();
        } catch {
          // silent — next explicit save will retry
        }
      }, 800);
    },
    [fileInfo, allSegments]
  );

  const handleConfirm = useCallback(
    async (segId: string) => {
      if (!fileInfo) return;
      const seg = allSegments.find((s) => s.seg_id === segId);
      if (!seg) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);

      const updated = await updateSegment(
        fileInfo.file_id,
        segId,
        seg.target_text,
        "confirmed"
      );
      setAllSegments((prev) => prev.map((s) => (s.seg_id === segId ? updated : s)));
      refreshFileInfo();

      // Auto-advance to next unconfirmed segment
      const idx = allSegments.findIndex((s) => s.seg_id === segId);
      const next = allSegments.slice(idx + 1).find((s) => s.status !== "confirmed");
      if (next) setActiveId(next.id);
    },
    [fileInfo, allSegments]
  );

  function refreshFileInfo() {
    if (!fileInfo) return;
    setFileInfo((prev) => {
      if (!prev) return prev;
      const counts = { new: 0, draft: 0, confirmed: 0 };
      allSegments.forEach((s) => {
        counts[s.status as keyof typeof counts]++;
      });
      return { ...prev, ...counts };
    });
  }

  // Recompute file info from local state whenever segments change
  useEffect(() => {
    if (!fileInfo) return;
    const counts = { new: 0, draft: 0, confirmed: 0 };
    allSegments.forEach((s) => {
      counts[s.status as keyof typeof counts]++;
    });
    setFileInfo((prev) => (prev ? { ...prev, ...counts } : prev));
  }, [allSegments]);

  function handleApplyTM(text: string) {
    if (!activeSegment) return;
    handleChange(activeSegment.seg_id, text);
  }

  function handleExport() {
    if (!fileInfo) return;
    window.open(exportUrl(fileInfo.file_id), "_blank");
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar
        fileInfo={fileInfo}
        onFileLoad={handleFileLoad}
        onExport={handleExport}
        filter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <SegmentEditor
          segments={visibleSegments}
          activeId={activeId}
          onFocus={handleFocus}
          onChange={handleChange}
          onConfirm={handleConfirm}
        />
        <TMPanel
          matches={tmMatches}
          loading={tmLoading}
          onApply={handleApplyTM}
        />
      </div>

      {/* Keyboard shortcut hint */}
      <footer className="bg-gray-50 border-t border-gray-200 px-4 py-1 text-xs text-gray-400 flex gap-4">
        <span><kbd className="bg-gray-200 px-1 rounded">Tab</kbd> Next segment</span>
        <span><kbd className="bg-gray-200 px-1 rounded">Shift+Tab</kbd> Previous</span>
        <span><kbd className="bg-gray-200 px-1 rounded">Ctrl+Enter</kbd> Confirm</span>
      </footer>
    </div>
  );
}
