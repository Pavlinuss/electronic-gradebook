import { formatDate } from '../utils/grades.js';

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GradeList({ grades, editingId, onEdit, onDelete }) {
  if (!grades.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 4h11l3 3v13H5V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <h3>Ничего не найдено</h3>
        <p>Измените условия фильтра или добавьте новую оценку.</p>
      </div>
    );
  }

  return (
    <div className="grade-table" role="table" aria-label="Список оценок">
      <div className="grade-head" role="row">
        <span role="columnheader">Ученик</span>
        <span role="columnheader">Предмет</span>
        <span role="columnheader">Дата</span>
        <span role="columnheader">Оценка</span>
        <span role="columnheader">Семестр</span>
        <span role="columnheader" aria-label="Действия" />
      </div>

      <div className="grade-body" role="rowgroup">
        {grades.map((grade) => (
          <div
            className={`grade-row${editingId === grade.id ? ' is-editing' : ''}`}
            role="row"
            key={grade.id}
          >
            <div className="cell cell-student" role="cell">
              <span className="student-name">{grade.student}</span>
              {grade.comment && <span className="grade-comment">{grade.comment}</span>}
            </div>
            <div className="cell cell-subject" role="cell">{grade.subject}</div>
            <div className="cell cell-date" role="cell">{formatDate(grade.date)}</div>
            <div className="cell cell-grade" role="cell">
              <span className={`grade-badge grade-${grade.value}`}>{grade.value}</span>
            </div>
            <div className="cell cell-semester" role="cell">{grade.semester} сем.</div>
            <div className="cell cell-actions" role="cell">
              <button
                type="button"
                className="icon-button"
                onClick={() => onEdit(grade)}
                aria-label={`Редактировать оценку: ${grade.subject}, ${grade.student}`}
                title="Редактировать"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="icon-button danger"
                onClick={() => onDelete(grade)}
                aria-label={`Удалить оценку: ${grade.subject}, ${grade.student}`}
                title="Удалить"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GradeListSkeleton() {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Загрузка записей">
      {[0, 1, 2, 3].map((row) => (
        <div className="skeleton-row" key={row}>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}