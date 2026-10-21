import { formatAverage, pluralizeGrades } from '../utils/grades.js';

export default function Stats({ stats }) {
  return (
    <div className="stats-grid" aria-label="Статистика дневника">
      <article className="stat-card stat-primary">
        <span className="stat-label">Средний балл</span>
        <strong>{formatAverage(stats.average)}</strong>
        <span className="stat-note">
          по {stats.total} {pluralizeGrades(stats.total)}
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-label">Всего оценок</span>
        <strong>{stats.total}</strong>
        <span className="stat-note">в дневнике</span>
      </article>

      <article className="stat-card">
        <span className="stat-label">Отличных</span>
        <strong>{stats.fives}</strong>
        <span className="stat-note">оценок «5»</span>
      </article>

      <article className="stat-card stat-split-card">
        <span className="stat-label">По семестрам</span>
        <div className="semester-split">
          <span><b>{stats.semester1}</b>1 сем.</span>
          <span><b>{stats.semester2}</b>2 сем.</span>
        </div>
      </article>
    </div>
  );
}