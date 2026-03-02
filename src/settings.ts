import type { Theme } from './constants';

const STORAGE_KEY = 'tetris-settings';

export interface Settings {
  musicVolume: number;   // 0-1, default 0.25
  sfxVolume: number;     // 0-1, default 0.7
  dasDelay: number;      // ms, default 170
  dasRate: number;       // ms, default 50
  screenShake: boolean;  // default true
  bloom: boolean;        // default true
  theme: Theme;          // default 'neon'
}

const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.25,
  sfxVolume: 0.7,
  dasDelay: 170,
  dasRate: 50,
  screenShake: true,
  bloom: true,
  theme: 'neon',
};

class SettingsManager {
  private _settings: Settings;

  constructor() {
    this._settings = this.load();
  }

  get settings(): Settings {
    return this._settings;
  }

  private load(): Settings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return { ...DEFAULT_SETTINGS };
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
    } catch {
      // Ignore storage errors
    }
  }

  update(partial: Partial<Settings>): void {
    Object.assign(this._settings, partial);
    this.save();
  }

  reset(): void {
    this._settings = { ...DEFAULT_SETTINGS };
    this.save();
  }
}

export const settingsManager = new SettingsManager();
