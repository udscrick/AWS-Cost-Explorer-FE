import type { ReactNode } from 'react';

export type CloudProvider = 'aws' | 'mock';
export type ChartView = 'line' | 'bar' | 'area' | 'stacked-bar';
export type ChartGranularity = 'day' | 'month' | 'year';

export interface CostData {
  date: string;
  cost: number;
  service: string;
  region: string;
}

export interface Anomaly {
  date: string;
  cost: number;
  expectedCost: number;
  description: string;
}

export interface Recommendation {
  title: string;
  description: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string | ReactNode;
}
