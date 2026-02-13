/**
 * Configuration Manager
 *
 * Manages user preferences and settings
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LLMProvider } from '../llm/types.js';

export interface CorvusConfig {
  llm: {
    provider: LLMProvider;
    model?: string;
    temperature?: number;
  };
  chat: {
    maxTurns: number;
    maxCost: number;
    saveHistory: boolean;
  };
  ui: {
    colors: boolean;
    privacyWarning: boolean;
  };
}

const DEFAULT_CONFIG: CorvusConfig = {
  llm: {
    provider: 'groq',
    temperature: 0.7,
  },
  chat: {
    maxTurns: 15,
    maxCost: 0.50,
    saveHistory: true,
  },
  ui: {
    colors: true,
    privacyWarning: true,
  },
};

export class ConfigManager {
  private configPath: string;
  private config: CorvusConfig;

  constructor() {
    const homeDir = os.homedir();
    const corvusDir = path.join(homeDir, '.corvus');

    // Ensure .corvus directory exists
    if (!fs.existsSync(corvusDir)) {
      fs.mkdirSync(corvusDir, { recursive: true, mode: 0o700 });
    }

    this.configPath = path.join(corvusDir, 'config.json');
    this.config = this.load();
  }

  private load(): CorvusConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(data);

        // Merge with defaults (in case new fields were added)
        return this.mergeWithDefaults(loadedConfig);
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults');
    }

    return DEFAULT_CONFIG;
  }

  private mergeWithDefaults(loaded: any): CorvusConfig {
    return {
      llm: { ...DEFAULT_CONFIG.llm, ...loaded.llm },
      chat: { ...DEFAULT_CONFIG.chat, ...loaded.chat },
      ui: { ...DEFAULT_CONFIG.ui, ...loaded.ui },
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        { mode: 0o600 } // Owner read/write only
      );
    } catch (error: any) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  get(key: string): any {
    const parts = key.split('.');
    let value: any = this.config;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  set(key: string, value: any): void {
    const parts = key.split('.');
    let current: any = this.config;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;

    this.save();
  }

  getAll(): CorvusConfig {
    return { ...this.config };
  }

  reset(): void {
    this.config = DEFAULT_CONFIG;
    this.save();
  }

  delete(key: string): void {
    const parts = key.split('.');
    let current: any = this.config;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        return; // Key doesn't exist
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    delete current[lastPart];

    this.save();
  }

  getConfigPath(): string {
    return this.configPath;
  }
}

// Singleton instance
let configInstance: ConfigManager | null = null;

export function getConfig(): ConfigManager {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance;
}
