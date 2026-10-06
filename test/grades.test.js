const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID, randomBytes } = require('node:crypto');
require('dotenv').config();
const databaseUrl = process.env.TEST_DATABASE_URL;

test('PostgreSQL registration, login, RBAC and grade CRUD', {
  skip: !databaseUrl && 'Set TEST_DATABASE_URL to a separate migrated database',
}, async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  const { sequelize, Grade, User } = require('../models');
  const app = require('../server');
  const email = `test-${randomUUID()}@example.com`;
  let server;
  let gradeId;
  try {
    await sequelize.authenticate();
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    let token;
    const request = (path, method = 'GET', body) => fetch(`${base}${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const credentials = { email, password: 'IntegrationPass123!' };
    const registration = await request('/auth/register', 'POST', credentials);
    assert.equal(registration.status, 201);
    const user = await registration.json();
    assert.equal(user.passwordHash, undefined);
    assert.equal((await request('/auth/register', 'POST', credentials)).status, 409);
    const login = await request('/auth/login', 'POST', credentials);
    assert.equal(login.status, 200);
    token = (await login.json()).token;
    assert.equal((await request('/profile')).status, 200);
    const record = { student: email, subject: 'Mathematics', value: 5, date: '2026-10-06', semester: 1 };
    assert.equal((await request('/grades', 'POST', record)).status, 403);
    await User.update({ role: 'admin' }, { where: { id: user.id } });
    const created = await request('/grades', 'POST', record);
    assert.equal(created.status, 201);
    gradeId = (await created.json()).id;
    const path = `/grades/${gradeId}`;
    assert.equal((await request(path)).status, 200);
    assert.equal((await (await request(`/grades?student=${encodeURIComponent(email)}`)).json()).length, 1);
    const updated = await request(path, 'PUT', { ...record, value: 4, semester: 2 });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).semester, 2);
    assert.equal((await Grade.findByPk(gradeId)).value, 4);
    assert.equal((await request(path, 'DELETE')).status, 204);
    assert.equal((await request(path, 'DELETE')).status, 404);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      if (gradeId) await Grade.destroy({ where: { id: gradeId } });
      await User.destroy({ where: { email } });
    } finally { await sequelize.close(); }
  }
});
