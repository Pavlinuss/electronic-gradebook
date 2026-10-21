export const STORAGE_KEY = 'gradebook.grades.v1';

export const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Сначала новые' },
  { value: 'date-asc', label: 'Сначала старые' },
  { value: 'grade-desc', label: 'Оценка: по убыванию' },
  { value: 'grade-asc', label: 'Оценка: по возрастанию' },
];

export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `grade-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateGrade(values = {}) {
  const errors = {};
  const student = typeof values.student === 'string' ? values.student.trim() : '';
  const subject = typeof values.subject === 'string' ? values.subject.trim() : '';
  const comment = values.comment ?? '';
  const value = Number(values.value);
  const semester = Number(values.semester);

  if (!student) errors.student = 'Укажите имя ученика';
  else if (student.length > 100) errors.student = 'Не более 100 символов';

  if (!subject) errors.subject = 'Укажите предмет';
  else if (subject.length > 100) errors.subject = 'Не более 100 символов';

  if (!Number.isInteger(value) || value < 2 || value > 5) {
    errors.value = 'Оценка должна быть целым числом от 2 до 5';
  }

  if (!isIsoDate(values.date)) errors.date = 'Укажите корректную дату';

  if (![1, 2].includes(semester)) errors.semester = 'Выберите семестр';

  if (typeof comment !== 'string' || comment.length > 1000) {
    errors.comment = 'Комментарий не должен превышать 1000 символов';
  }

  return errors;
}

export function normalizeGrade(values) {
  return {
    student: values.student.trim(),
    subject: values.subject.trim(),
    value: Number(values.value),
    date: values.date,
    semester: Number(values.semester),
    comment: (values.comment ?? '').trim(),
  };
}

export function isStoredGrade(grade) {
  if (!grade || typeof grade !== 'object') return false;
  const hasId = typeof grade.id === 'string'
    ? grade.id.trim().length > 0
    : Number.isInteger(grade.id) && grade.id > 0;
  return hasId && Object.keys(validateGrade(grade)).length === 0;
}

export function parseStoredGrades(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed
      .filter(isStoredGrade)
      .map((grade) => ({ id: grade.id, ...normalizeGrade(grade) }));
  } catch {
    return fallback;
  }
}

export function calculateStats(grades = []) {
  const total = grades.length;
  const sum = grades.reduce((accumulator, grade) => accumulator + Number(grade.value), 0);
  return {
    total,
    average: total ? Math.round((sum / total) * 100) / 100 : null,
    fives: grades.filter((grade) => Number(grade.value) === 5).length,
    semester1: grades.filter((grade) => Number(grade.semester) === 1).length,
    semester2: grades.filter((grade) => Number(grade.semester) === 2).length,
  };
}

const comparators = {
  'date-desc': (a, b) => b.date.localeCompare(a.date) || a.student.localeCompare(b.student, 'ru'),
  'date-asc': (a, b) => a.date.localeCompare(b.date) || a.student.localeCompare(b.student, 'ru'),
  'grade-desc': (a, b) => b.value - a.value || b.date.localeCompare(a.date),
  'grade-asc': (a, b) => a.value - b.value || b.date.localeCompare(a.date),
};

export function filterAndSortGrades(grades = [], filters = {}) {
  const query = (filters.query ?? '').trim().toLocaleLowerCase('ru-RU');
  const semester = filters.semester ?? 'all';
  const comparator = comparators[filters.sort] ?? comparators['date-desc'];

  return grades
    .filter((grade) => {
      const matchesQuery = !query
        || grade.student.toLocaleLowerCase('ru-RU').includes(query)
        || grade.subject.toLocaleLowerCase('ru-RU').includes(query);
      const matchesSemester = semester === 'all' || Number(grade.semester) === Number(semester);
      return matchesQuery && matchesSemester;
    })
    .sort(comparator);
}

export function formatDate(iso) {
  if (!isIsoDate(iso)) return iso;
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatAverage(average) {
  return average === null ? '—' : average.toFixed(2).replace('.', ',');
}

export function pluralizeGrades(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'оценка';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'оценки';
  return 'оценок';
}