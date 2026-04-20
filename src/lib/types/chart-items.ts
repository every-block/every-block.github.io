import type { Rgb } from "@/types/domain";

export interface SeriesItem {
  key: string;
  label: string;
  value: number;
  color: string;
  textColor?: string;
  meta?: string;
}

export interface ColorPoint {
  key: string;
  label: string;
  rgb: Rgb;
  image?: HTMLImageElement | null | false;
  weight: number;
}

export interface HuePoint {
  key: string;
  label: string;
  hueDeg: number;
  color: string;
  weight: number;
  meta?: string;
}

export interface TimePoint {
  timestamp: number;
}

export interface TimeAnnotation {
  timestamp: number;
  label: string;
  description: string;
}
