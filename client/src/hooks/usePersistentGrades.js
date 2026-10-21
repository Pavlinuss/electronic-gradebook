import { useEffect, useState } from 'react';
import { parseStoredGrades, STORAGE_KEY } from '../utils/grades.js';

// Пользовательский хук: загрузка из localStorage, debounce-автосохранение и статус сохранения.
export function usePersistentGrades(initialGrades) {
  const [grades, setGrades] = useState(() => {
    if (typeof window === 'undefined') return initialGrades;
    return parseStoredGrades(window.localStorage.getItem(STORAGE_KEY), initialGrades);
  });
  const [saveState, setSaveState] = useState('saved');
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    setSaveState('saving');
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
        setSaveState('saved');
        setSavedAt(new Date());
      } catch {
        setSaveState('error');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [grades]);

  return { grades, setGrades, saveState, savedAt };
}