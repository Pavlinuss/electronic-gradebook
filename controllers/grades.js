const { grades, allocateId } = require('../models/grades');

function validateGrade(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }
  const allowed = ['student', 'subject', 'value', 'date', 'comment'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    return 'Unknown fields are not allowed; id is assigned by the server';
  }
  for (const field of ['student', 'subject']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > 100) {
      return `${field} must be a non-empty string of at most 100 characters`;
    }
  }
  if (!Number.isInteger(body.value) || body.value < 2 || body.value > 5) {
    return 'value must be an integer from 2 to 5';
  }
  if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return 'date must use YYYY-MM-DD format';
  }
  const date = new Date(`${body.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.date) {
    return 'date must be a valid calendar date';
  }
  if (body.comment !== undefined && (typeof body.comment !== 'string' || body.comment.length > 1000)) {
    return 'comment must be a string of at most 1000 characters';
  }
  return null;
}

function gradeData(body) {
  return {
    student: body.student.trim(),
    subject: body.subject.trim(),
    value: body.value,
    date: body.date,
    comment: body.comment?.trim() ?? '',
  };
}

exports.findGrade = (req, res, next, id) => {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ error: 'id must be a positive safe integer' });
  }
  req.grade = grades.find((grade) => grade.id === Number(id));
  if (!req.grade) return res.status(404).json({ error: 'Grade not found' });
  next();
};

exports.list = (req, res) => {
  for (const field of Object.keys(req.query)) {
    if (!['student', 'subject'].includes(field) || typeof req.query[field] !== 'string' || !req.query[field].trim()) {
      return res.status(400).json({ error: 'Only non-empty student and subject query parameters are supported' });
    }
  }
  const result = grades.filter((grade) => ['student', 'subject'].every((field) =>
    req.query[field] === undefined || grade[field].toLowerCase() === req.query[field].trim().toLowerCase()
  ));
  res.json(result);
};

exports.get = (req, res) => res.json(req.grade);

exports.create = (req, res) => {
  const error = validateGrade(req.body);
  if (error) return res.status(400).json({ error });
  const grade = { id: allocateId(), ...gradeData(req.body) };
  grades.push(grade);
  res.location(`/grades/${grade.id}`).status(201).json(grade);
};

exports.replace = (req, res) => {
  const error = validateGrade(req.body);
  if (error) return res.status(400).json({ error });
  Object.assign(req.grade, gradeData(req.body));
  res.json(req.grade);
};

exports.remove = (req, res) => {
  grades.splice(grades.indexOf(req.grade), 1);
  res.status(204).end();
};
