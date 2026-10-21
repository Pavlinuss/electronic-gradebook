import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStats,
  filterAndSortGrades,
  formatAverage,
  isIsoDate,
  isStoredGrade,
  normalizeGrade,
  parseStoredGrades,
  pluralizeGrades,
  validateGrade,
} from '../src/utils/grades.js';

const valid = {
  student: 'Иван Петров',
  subject: 'Математика',
  value: '5',
  date: '2026-09-09',
  semester: '1',
  comment: 'Контрольная работа',
};

test('validateGrade принимает корректную запись', () => {
  assert.deepEqual(validateGrade(valid), {});
});

test('validateGrade возвращает ошибки для некорректных данных', () => {
  assert.ok(validateGrade({ ...valid, student: '  ' }).student);
  assert.ok(validateGrade({ ...valid, subject: '' }).subject);
  assert.ok(validateGrade({ ...valid, value: '6' }).value);
  assert.ok(validateGrade({ ...valid, value: '3.5' }).value);
  assert.ok(validateGrade({ ...valid, value: 'abc' }).value);
  assert.ok(validateGrade({ ...valid, date: '2026-02-30' }).date);
  assert.ok(validateGrade({ ...valid, date: '09.09.2026' }).date);
  assert.ok(validateGrade({ ...valid, semester: '3' }).semester);
  assert.ok(validateGrade({ ...valid, comment: 'x'.repeat(1001) }).comment);
});

test('normalizeGrade приводит типы и обрезает пробелы', () => {
  assert.deepEqual(normalizeGrade({ ...valid, student: ' Иван Петров ', value: '4', semester: '2' }), {
    student: 'Иван Петров',
    subject: 'Математика',
    value: 4,
    date: '2026-09-09',
    semester: 2,
    comment: 'Контрольная работа',
  });
});

test('isIsoDate отсеивает неправильные даты', () => {
  assert.equal(isIsoDate('2026-09-09'), true);
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isIsoDate('2026-9-9'), false);
  assert.equal(isIsoDate('abc'), false);
});

test('parseStoredGrades фильтрует повреждённые записи и не падает', () => {
  const fallback = [{ id: 'seed-1' }];
  assert.deepEqual(parseStoredGrades(null, fallback), fallback);
  assert.deepEqual(parseStoredGrades('{не json}', fallback), fallback);
  assert.deepEqual(parseStoredGrades('{"a":1}', fallback), fallback);
  const raw = JSON.stringify([
    { id: 'ok-1', ...valid },
    { id: 'bad-1', ...valid, value: '9' },
    { ...valid },
    null,
  ]);
  const parsed = parseStoredGrades(raw, fallback);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'ok-1');
  assert.equal(parsed[0].value, 5);
});

test('isStoredGrade проверяет id и поля', () => {
  assert.equal(isStoredGrade({ id: 'seed-1', ...valid }), true);
  assert.equal(isStoredGrade({ id: 7, ...valid }), true);
  assert.equal(isStoredGrade({ id: 0, ...valid }), false);
  assert.equal(isStoredGrade({ ...valid }), false);
  assert.equal(isStoredGrade({ id: 'x', ...valid, value: '2.5' }), false);
});

const grades = [
  { id: '1', student: 'Иван Петров', subject: 'Математика', value: 5, date: '2026-09-09', semester: 1, comment: '' },
  { id: '2', student: 'Анна Смирнова', subject: 'Информатика', value: 4, date: '2026-09-10', semester: 1, comment: '' },
  { id: '3', student: 'Иван Петров', subject: 'Физика', value: 3, date: '2026-02-01', semester: 2, comment: '' },
  { id: '4', student: 'Мария Волкова', subject: 'Литература', value: 5, date: '2026-10-02', semester: 1, comment: '' },
];

test('filterAndSortGrades фильтрует по поиску и семестру', () => {
  assert.equal(filterAndSortGrades(grades, { query: 'иван' }).length, 2);
  assert.equal(filterAndSortGrades(grades, { query: 'информатика' }).length, 1);
  assert.equal(filterAndSortGrades(grades, { semester: '2' }).length, 1);
  assert.equal(filterAndSortGrades(grades, { query: 'иван', semester: '2' })[0].id, '3');
  assert.equal(filterAndSortGrades(grades, { query: 'нет такого' }).length, 0);
});

test('filterAndSortGrades сортирует по дате и оценке', () => {
  assert.equal(filterAndSortGrades(grades, { sort: 'date-desc' })[0].id, '4');
  assert.equal(filterAndSortGrades(grades, { sort: 'date-asc' })[0].id, '3');
  assert.equal(filterAndSortGrades(grades, { sort: 'grade-asc' })[0].value, 3);
  assert.equal(filterAndSortGrades(grades, { sort: 'grade-desc' })[0].value, 5);
});

test('filterAndSortGrades не мутирует исходный массив', () => {
  const snapshot = grades.map((grade) => grade.id);
  filterAndSortGrades(grades, { sort: 'grade-desc' });
  assert.deepEqual(grades.map((grade) => grade.id), snapshot);
});

test('calculateStats считает средний балл и семестры', () => {
  const stats = calculateStats(grades);
  assert.equal(stats.total, 4);
  assert.equal(stats.average, 4.25);
  assert.equal(stats.fives, 2);
  assert.equal(stats.semester1, 3);
  assert.equal(stats.semester2, 1);
  assert.equal(calculateStats([]).average, null);
});

test('formatAverage и pluralizeGrades форматируют вывод', () => {
  assert.equal(formatAverage(4.25), '4,25');
  assert.equal(formatAverage(5), '5,00');
  assert.equal(formatAverage(null), '—');
  assert.equal(pluralizeGrades(1), 'оценка');
  assert.equal(pluralizeGrades(3), 'оценки');
  assert.equal(pluralizeGrades(5), 'оценок');
  assert.equal(pluralizeGrades(11), 'оценок');
  assert.equal(pluralizeGrades(22), 'оценки');
});