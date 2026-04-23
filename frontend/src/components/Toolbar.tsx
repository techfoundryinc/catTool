import React, { useRef } from "react";
import type { FileInfo } from "../types";

interface Props {
  fileInfo: FileInfo | null;
  onFileLoad: (file: File) => void;
  onExport: () => void;
  filter: string;
  onFilterChange: (f: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Toolbar({
  fileInfo,
  onFileLoad,
  onExport,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileLoad(file);
    e.target.value = "";
  }

  const pct = fileInfo
    ? Math.round((fileInfo.confirmed / (fileInfo.total || 1)) * 100)
    : 0;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
      <img src="/intuit-logo.png" alt="Intuit" className="h-7 mr-2" />

      <button
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Open XLIFF
      </button>
      <input ref={inputRef} type="file" accept=".xliff,.xlf" className="hidden" onChange={handleFile} />

      {fileInfo && (
        <>
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export XLIFF
          </button>

          <div className="flex items-center gap-1 text-sm text-gray-600 border-l pl-3">
            <span className="font-medium">{fileInfo.source_lang}</span>
            <span>→</span>
            <span className="font-medium">{fileInfo.target_lang}</span>
          </div>

          <div className="flex items-center gap-2 border-l pl-3">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">
              {fileInfo.confirmed}/{fileInfo.total} confirmed ({pct}%)
            </span>
          </div>

          <div className="flex items-center gap-1 border-l pl-3">
            {(["all", "new", "draft", "confirmed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
                {f !== "all" && fileInfo && (
                  <span className="ml-1 font-mono">
                    ({fileInfo[f as keyof FileInfo] as number})
                  </span>
                )}
              </button>
            ))}
          </div>

          <input
            type="search"
            placeholder="Search segments…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ml-auto px-2 py-1.5 text-sm border border-gray-300 rounded w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </>
      )}
    </header>
  );
}
