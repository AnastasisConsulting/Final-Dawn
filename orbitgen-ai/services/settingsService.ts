// PATH: services/settingsService.ts
import { AppSettings } from '../types';

const SETTINGS_KEY = 'OrbitGenSettings';

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3' // Default fallback
  }
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      ollama: {
        ...DEFAULT_SETTINGS.ollama,
        ...(parsed.ollama || {})
      }
    };
  } catch (e) {
    console.error("Failed to load settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log("Settings saved:", settings);
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};
