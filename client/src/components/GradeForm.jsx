import { useState } from 'react';
import { normalizeGrade, todayIso, validateGrade } from '../utils/grades.js';

function emptyValues() {
  return {
    student: '',
    subject: '',
    value: '5',
    date: todayIso(),
    semester: '1',
    comment: '',
  };
}

function valuesFromGrade(grade) {
  if (!grade) return emptyValues();
  return {
    student: grade.student,
    subject: grade.subject,
    value: String(grade.value),
    date: grade.date,
    semester: String(grade.semester),
    comment: grade.comment,
  };
}

export default function GradeForm({ grade, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => valuesFromGrade(grade));
  const [errors, setErrors] = useState({});
  const isEditing = Boolean(grade);

  function updateField(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateGrade(values);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(normalizeGrade(values));
    setErrors({});
    if (!isEditing) setValues(emptyValues());
  }

  function handleReset() {
    setValues(valuesFromGrade(grade));
    setErrors({});
  }

  return (
    <form className="grade-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'Редактирование' : 'Новая запись'}</p>
          <h2 id="form-title">{isEditing ? 'Изменить оценку' : 'Добавить оценку'}</h2>
        </div>
        {isEditing && (
          <button type="button" className="button button-ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>

      <div className="form-grid">
        <label className={`field field-wide${errors.student ? ' has-error' : ''}`}>
          <span className="field-label">Ученик</span>
          <input
            value={values.student}
            onChange={(event) => updateField('student', event.target.value)}
            placeholder="Например, Иван Петров"
            maxLength={100}
            aria-invalid={Boolean(errors.student)}
          />
          {errors.student && <span className="field-error">{errors.student}</span>}
        </label>

        <label className={`field field-wide${errors.subject ? ' has-error' : ''}`}>
          <span className="field-label">Предмет</span>
          <input
            value={values.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            placeholder="Например, Математика"
            maxLength={100}
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject && <span className="field-error">{errors.subject}</span>}
        </label>

        <label className={`field${errors.value ? ' has-error' : ''}`}>
          <span className="field-label">Оценка</span>
          <select
            value={values.value}
            onChange={(event) => updateField('value', event.target.value)}
            aria-invalid={Boolean(errors.value)}
          >
            <option value="5">5 — отлично</option>
            <option value="4">4 — хорошо</option>
            <option value="3">3 — удовлетворительно</option>
            <option value="2">2 — неудовлетворительно</option>
          </select>
          {errors.value && <span className="field-error">{errors.value}</span>}
        </label>

        <label className={`field${errors.semester ? ' has-error' : ''}`}>
          <span className="field-label">Семестр</span>
          <select
            value={values.semester}
            onChange={(event) => updateField('semester', event.target.value)}
            aria-invalid={Boolean(errors.semester)}
          >
            <option value="1">1 семестр</option>
            <option value="2">2 семестр</option>
          </select>
          {errors.semester && <span className="field-error">{errors.semester}</span>}
        </label>

        <label className={`field field-wide${errors.date ? ' has-error' : ''}`}>
          <span className="field-label">Дата</span>
          <input
            type="date"
            value={values.date}
            onChange={(event) => updateField('date', event.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </label>

        <label className={`field field-wide${errors.comment ? ' has-error' : ''}`}>
          <span className="field-label">
            Комментарий
            <span className="field-counter">{values.comment.length}/1000</span>
          </span>
          <textarea
            value={values.comment}
            onChange={(event) => updateField('comment', event.target.value)}
            placeholder="Контрольная работа, ответ на уроке…"
            maxLength={1000}
            rows={3}
            aria-invalid={Boolean(errors.comment)}
          />
          {errors.comment && <span className="field-error">{errors.comment}</span>}
        </label>
      </div>

      <p className="form-hint">
        Все изменения автоматически сохраняются в localStorage браузера.
      </p>

      <div className="form-actions">
        <button type="submit" className="button button-primary">
          {isEditing ? 'Сохранить изменения' : 'Добавить в дневник'}
        </button>
        <button type="button" className="button button-ghost" onClick={handleReset}>
          {isEditing ? 'Сбросить' : 'Очистить'}
        </button>
      </div>
    </form>
  );
}