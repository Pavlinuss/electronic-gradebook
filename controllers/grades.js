const { Op, ValidationError, UniqueConstraintError } = require('sequelize');
const { Grade } = require('../models');

const allowedFields = ['student', 'subject', 'value', 'date', 'comment', 'semester'];

function validateGrade(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';
  if (Object.keys(body).some((key) => !allowedFields.includes(key))) return 'Unknown fields are not allowed; id is assigned by the server';
  for (const field of ['student', 'subject']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > 100) {
      return `${field} must be a non-empty string of at most 100 characters`;
    }
  }
  if (!Number.isInteger(body.value) || body.value < 2 || body.value > 5) return 'value must be an integer from 2 to 5';
  if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return 'date must use YYYY-MM-DD format';
  const date = new Date(`${body.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== body.date) return 'date must be a valid calendar date';
  if (body.comment !== undefined && (typeof body.comment !== 'string' || body.comment.length > 1000)) return 'comment must be a string of at most 1000 characters';
  if (body.semester !== undefined && (![1, 2].includes(body.semester))) return 'semester must be 1 or 2';
  return null;
}

function gradeData(body) {
  return { student: body.student.trim(), subject: body.subject.trim(), value: body.value, date: body.date, comment: body.comment?.trim() ?? '', semester: body.semester ?? 1 };
}

function handleDatabaseError(error, res, next) {
  if (error instanceof ValidationError) return res.status(400).json({ error: error.errors.map((item) => item.message).join('; ') });
  if (error instanceof UniqueConstraintError) return res.status(409).json({ error: 'A grade with these unique fields already exists' });
  return next(error);
}

exports.findGrade = async (req, res, next, id) => {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return res.status(400).json({ error: 'id must be a positive safe integer' });
  try {
    req.grade = await Grade.findByPk(Number(id));
    if (!req.grade) return res.status(404).json({ error: 'Grade not found' });
    next();
  } catch (error) { next(error); }
};

exports.list = async (req, res, next) => {
  for (const field of Object.keys(req.query)) {
    if (!['student', 'subject'].includes(field) || typeof req.query[field] !== 'string' || !req.query[field].trim()) return res.status(400).json({ error: 'Only non-empty student and subject query parameters are supported' });
  }
  const where = {};
  if (req.query.student) where.student = { [Op.iLike]: req.query.student.trim() };
  if (req.query.subject) where.subject = { [Op.iLike]: req.query.subject.trim() };
  try { res.json(await Grade.findAll({ where, order: [['id', 'ASC']] })); } catch (error) { next(error); }
};

exports.get = (req, res) => res.json(req.grade);

exports.create = async (req, res, next) => {
  const error = validateGrade(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const grade = await Grade.create(gradeData(req.body));
    res.location(`/grades/${grade.id}`).status(201).json(grade);
  } catch (databaseError) { handleDatabaseError(databaseError, res, next); }
};

exports.replace = async (req, res, next) => {
  const error = validateGrade(req.body);
  if (error) return res.status(400).json({ error });
  try { await req.grade.update(gradeData(req.body)); res.json(req.grade); } catch (databaseError) { handleDatabaseError(databaseError, res, next); }
};

exports.remove = async (req, res, next) => {
  try { await req.grade.destroy(); res.status(204).end(); } catch (error) { next(error); }
};
