export interface GameRecord {
  score: number;
  level: number;
  lines: number;
  date: number;
}

const STORAGE_KEY = 'tetris-scores';
const MAX_RECORDS = 20;

export class ScoreHistory {
  private records: GameRecord[] = [];

  constructor() {
    this.records = this.readStorage();
  }

  save(record: GameRecord): void {
    this.records.push(record);
    this.records.sort((a, b) => b.score - a.score);
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(0, MAX_RECORDS);
    }
    this.writeStorage();
  }

  load(): GameRecord[] {
    return [...this.records];
  }

  getBest(): GameRecord | null {
    return this.records.length > 0 ? this.records[0] : null;
  }

  clear(): void {
    this.records = [];
    this.writeStorage();
  }

  private readStorage(): GameRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  private writeStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // localStorage may be full or unavailable
    }
  }
}
