// lib/settings.ts

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number; // seconds
  prebufferTime: number; // seconds before end
}

export interface Settings {
  crossfade: CrossfadeSettings;
}

const DEFAULT_SETTINGS: Settings = {
  crossfade: {
    enabled: false,
    duration: 5,
    prebufferTime: 10,
  },
};

const SETTINGS_KEY = 'app-settings';

export function getSettings(): Settings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        crossfade: {
          ...DEFAULT_SETTINGS.crossfade,
          ...parsed.crossfade,
        },
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function updateCrossfadeSettings(updates: Partial<CrossfadeSettings>): void {
  const current = getSettings();
  const updated: Settings = {
    ...current,
    crossfade: {
      ...current.crossfade,
      ...updates,
    },
  };
  saveSettings(updated);
}