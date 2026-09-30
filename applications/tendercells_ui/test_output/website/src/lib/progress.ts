// progress.ts - which tutorial steps a reader has marked done, kept in this browser only
// (localStorage, per lesson). Never required: every read / write tolerates storage being
// unavailable (private mode, blocked site data).

const KEY = "tendercells_lesson_progress_v1";

export interface LessonProgress {
  /** Ids of the steps marked done. */
  done: string[];
  /** How many checkable steps the lesson had when last opened (for the lesson list). */
  total: number;
}

function readAll(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, LessonProgress>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, LessonProgress>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable - progress just is not remembered */
  }
}

export function getProgress(slug: string): LessonProgress {
  return readAll()[slug] ?? { done: [], total: 0 };
}

export function setProgress(slug: string, p: LessonProgress): void {
  const all = readAll();
  all[slug] = p;
  writeAll(all);
}
