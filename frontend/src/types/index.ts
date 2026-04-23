export type SegmentStatus = "new" | "draft" | "confirmed";

export interface Segment {
  id: number;
  seg_id: string;
  source_text: string;
  target_text: string;
  status: SegmentStatus;
  tm_score: number | null;
  locked: boolean;
  source_lang: string;
  target_lang: string;
}

export interface FileInfo {
  file_id: string;
  source_lang: string;
  target_lang: string;
  total: number;
  confirmed: number;
  draft: number;
  new: number;
}

export interface TMMatch {
  source_text: string;
  target_text: string;
  score: number;
}
