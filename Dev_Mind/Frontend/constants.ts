import { AppSettings } from './types';

export const EMOJI_OPTIONS = ['🤯', '😫', '😐', '🙂', '🧠'];

export const DEFAULT_SETTINGS: AppSettings = {
  smartBreaks: true,
  comparativeMode: true,
  reflectionJournal: true,
  passiveMode: false,
  alerts: {
    enabled: true,
    sensitivity: 'Medium',
    types: {
      burnout: true,
      focusDrop: true,
      contextSwitching: true,
      prolongedWork: true
    }
  }
};