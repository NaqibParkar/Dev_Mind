export type NavigationPage = 'dashboard' | 'analytics' | 'projects' | 'settings' | 'live-detection';
export type TimeGranularity = 'hourly' | 'daily' | 'weekly';

export interface User {
  name: string;
  email: string;
}

export interface CognitiveState {
  currentZone: 'Deep Work' | 'Optimal Focus' | 'Overload' | 'Rest';
  focusScore: number; // 0-100
  burnoutRisk: 'Low' | 'Moderate' | 'High';
  focusStability: number; // 0-100
  deepWorkMinutes: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  emoji: string;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  // color: string; // Removed
  timeSpentMinutes: number;
  avgFocusScore: number;
  workload: number; // Added workload metric
  status: 'Active' | 'Archived' | 'Inactive'; // Added Inactive
}

export interface MockDataPoint {
  label: string; // Generic label (time, day, or week)
  focus: number;
  workload: number;
  cognitiveLoad: number;
  // Comparative fields
  prevFocus?: number;
  prevWorkload?: number;
}

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
}

export type AlertType = 'burnout' | 'focus-drop' | 'context-switching' | 'prolonged-work';

export interface AlertConfig {
  enabled: boolean;
  sensitivity: 'Low' | 'Medium' | 'High';
  types: {
    burnout: boolean;
    focusDrop: boolean;
    contextSwitching: boolean;
    prolongedWork: boolean;
  };
}

export interface AppSettings {
  smartBreaks: boolean;
  comparativeMode: boolean;
  reflectionJournal: boolean;
  passiveMode: boolean;
  alerts: AlertConfig;
}