/**
 * Session Storage
 *
 * Save and load chat sessions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ChatSession } from './types.js';

export class SessionStorage {
  private sessionsDir: string;

  constructor() {
    const homeDir = os.homedir();
    this.sessionsDir = path.join(homeDir, '.corvus', 'sessions');

    // Ensure sessions directory exists
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true, mode: 0o700 });
    }
  }

  save(name: string, session: ChatSession): void {
    const filename = this.sanitizeFilename(name) + '.json';
    const filepath = path.join(this.sessionsDir, filename);

    const data = {
      name,
      savedAt: new Date().toISOString(),
      session: {
        messages: session.messages,
        turnCount: session.turnCount,
        totalCost: session.totalCost,
        startTime: session.startTime.toISOString(),
      },
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  load(name: string): ChatSession | null {
    const filename = this.sanitizeFilename(name) + '.json';
    const filepath = path.join(this.sessionsDir, filename);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        messages: data.session.messages,
        turnCount: data.session.turnCount,
        totalCost: data.session.totalCost,
        startTime: new Date(data.session.startTime),
      };
    } catch {
      return null;
    }
  }

  list(): Array<{ name: string; savedAt: string; turns: number }> {
    if (!fs.existsSync(this.sessionsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.sessionsDir);
    const sessions: Array<{ name: string; savedAt: string; turns: number }> = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filepath = path.join(this.sessionsDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        sessions.push({
          name: data.name,
          savedAt: data.savedAt,
          turns: data.session.turnCount,
        });
      } catch {
        // Skip invalid files
      }
    }

    return sessions.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  delete(name: string): boolean {
    const filename = this.sanitizeFilename(name) + '.json';
    const filepath = path.join(this.sessionsDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }

    return false;
  }

  export(name: string, format: 'json' | 'markdown'): string | null {
    const session = this.load(name);
    if (!session) return null;

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Markdown format
    let md = `# Corvus Chat Session: ${name}\n\n`;
    md += `**Saved:** ${new Date().toLocaleString()}\n`;
    md += `**Turns:** ${session.turnCount}\n`;
    md += `**Cost:** $${session.totalCost.toFixed(4)}\n\n`;
    md += `---\n\n`;

    for (const msg of session.messages) {
      if (msg.role === 'system') continue;

      const speaker = msg.role === 'user' ? '**You:**' : '**Corvus:**';
      md += `${speaker}\n${msg.content}\n\n`;
    }

    return md;
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  }

  getSessionsDir(): string {
    return this.sessionsDir;
  }
}

// Singleton
let storageInstance: SessionStorage | null = null;

export function getSessionStorage(): SessionStorage {
  if (!storageInstance) {
    storageInstance = new SessionStorage();
  }
  return storageInstance;
}
