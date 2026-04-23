import axios from "axios";
import type { Segment, FileInfo, TMMatch } from "../types";

const api = axios.create({ baseURL: "/api" });

export async function uploadFile(file: File): Promise<FileInfo> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<FileInfo>("/files/upload", form);
  return data;
}

export async function fetchSegments(fileId: string): Promise<Segment[]> {
  const { data } = await api.get<Segment[]>(`/files/${fileId}/segments`);
  return data;
}

export async function updateSegment(
  fileId: string,
  segId: string,
  targetText: string,
  status: string
): Promise<Segment> {
  const { data } = await api.patch<Segment>(
    `/files/${fileId}/segments/${segId}`,
    { target_text: targetText, status }
  );
  return data;
}

export async function lookupTM(
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<TMMatch[]> {
  const { data } = await api.get<TMMatch[]>("/tm/lookup", {
    params: { source_text: sourceText, source_lang: sourceLang, target_lang: targetLang },
  });
  return data;
}

export function exportUrl(fileId: string): string {
  return `/api/files/${fileId}/export`;
}
