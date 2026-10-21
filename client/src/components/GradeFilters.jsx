import { SORT_OPTIONS } from '../utils/grades.js';

export default function GradeFilters({ filters, onChange, onReset }) {
  const hasActiveFilters = filters.query.trim() !== ''
    || filters.semester !== 'all'
    || filters.sort !== 'date-desc';

  function update(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="filters" role="search">
      <label className="field search-field">
        <span className="field-label">Поиск</span>
        <span className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16.2 16.2 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={filters.query}
            onChange={(event) => update('query', event.target.value)}
            placeholder="Ученик или предмет"
            aria-label="Поиск по ученику или предмету"
          />
        </span>
      </label>

      <label className="field">
        <span className="field-label">Семестр</span>
        <select
          value={filters.semester}
          onChange={(event) => update('semester', event.target.value)}
        >
          <option value="all">Все семестры</option>
          <option value="1">1 семестр</option>
          <option value="2">2 семестр</option>
        </select>
      </label>

      <label className="field">
        <span className="field-label">Сортировка</span>
        <select
          value={filters.sort}
          onChange={(event) => update('sort', event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      {hasActiveFilters && (
        <button type="button" className="button button-ghost reset-filters" onClick={onReset}>
          Сбросить
        </button>
      )}
    </div>
  );
}