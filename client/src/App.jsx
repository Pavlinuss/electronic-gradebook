import { useEffect, useMemo, useRef, useState } from 'react';
import GradeFilters from './components/GradeFilters.jsx';
import GradeForm from './components/GradeForm.jsx';
import GradeList, { GradeListSkeleton } from './components/GradeList.jsx';
import Stats from './components/Stats.jsx';
import { seedGrades } from './data/seedGrades.js';
import { usePersistentGrades } from './hooks/usePersistentGrades.js';
import {
  calculateStats,
  createId,
  filterAndSortGrades,
  pluralizeGrades,
} from './utils/grades.js';

export default function App() {
  const { grades, setGrades, saveState, savedAt } = usePersistentGrades(seedGrades);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ query: '', semester: 'all', sort: 'date-desc' });
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef(null);

  const stats = useMemo(() => calculateStats(grades), [grades]);
  const visibleGrades = useMemo(
    () => filterAndSortGrades(grades, filters),
    [grades, filters],
  );
  const editingGrade = grades.find((grade) => grade.id === editingId) ?? null;

  // Дополнительный эффект: имитация загрузки данных с сервера.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  // Дополнительный эффект: заголовок страницы зависит от количества записей.
  useEffect(() => {
    document.title = `Дневник · ${grades.length} ${pluralizeGrades(grades.length)}`;
  }, [grades.length]);

  function handleSubmit(values) {
    if (editingId) {
      setGrades((previous) => previous.map((grade) => (
        grade.id === editingId ? { ...grade, ...values } : grade
      )));
    } else {
      setGrades((previous) => [{ id: createId(), ...values }, ...previous]);
    }

    setEditingId(null);
  }

  function handleEdit(grade) {
    setEditingId(grade.id);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector('input')?.focus({ preventScroll: true });
    });
  }

  function handleDelete(grade) {
    const confirmed = window.confirm(
      `Удалить оценку «${grade.subject}» у ученика ${grade.student}?`,
    );
    if (!confirmed) return;

    setGrades((previous) => previous.filter((item) => item.id !== grade.id));
    if (editingId === grade.id) setEditingId(null);
  }

  function resetFilters() {
    setFilters({ query: '', semester: 'all', sort: 'date-desc' });
  }

  const saveLabel = saveState === 'saving'
    ? 'Сохранение…'
    : saveState === 'error'
      ? 'Не удалось сохранить'
      : savedAt
        ? `Сохранено в ${savedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
        : 'Сохранено';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">ЭД</span>
          <div>
            <p className="eyebrow">Учебный год 2026/2027</p>
            <h1>Электронный дневник</h1>
          </div>
        </div>
        <div className={`save-status is-${saveState}`} role="status" aria-live="polite">
          <span className="save-dot" aria-hidden="true" />
          {saveLabel}
        </div>
      </header>

      <main>
        <section className="intro" aria-labelledby="intro-title">
          <div className="intro-copy">
            <p className="eyebrow">Успеваемость класса</p>
            <h2 id="intro-title">Оценки под контролем</h2>
            <p className="lede">
              Добавляйте записи, редактируйте их и находите нужное по ученику,
              предмету или семестру. Изменения автоматически сохраняются в браузере.
            </p>
            <p className="hint">
              <span className="hint-key">Enter</span>
              в любом поле сохраняет новую оценку
            </p>
          </div>
          <Stats stats={stats} />
        </section>

        <div className="workspace">
          <section className="panel form-panel" ref={formRef} aria-labelledby="form-title">
            <GradeForm
              key={editingId ?? 'new'}
              grade={editingGrade}
              onSubmit={handleSubmit}
              onCancel={() => setEditingId(null)}
            />
          </section>

          <section className="panel list-panel" aria-labelledby="list-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Журнал</p>
                <h2 id="list-title">Записи об успеваемости</h2>
              </div>
              <span className="count-pill">
                {visibleGrades.length} из {grades.length}
              </span>
            </div>

            <GradeFilters
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
            />

            {isLoading
              ? <GradeListSkeleton />
              : (
                <GradeList
                  grades={visibleGrades}
                  editingId={editingId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>Данные хранятся только в этом браузере через localStorage.</p>
        <p>Электронный дневник · лабораторная работа №4</p>
      </footer>
    </div>
  );
}