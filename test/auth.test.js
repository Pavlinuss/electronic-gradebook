const { test, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UniqueConstraintError } = require('sequelize');
const { User, Grade, sequelize } = require('../models');
const app = require('../server');

// These HTTP tests use real bcrypt/JWT but mock only database operations.
const users = [];
let server;
let base;
before(async () => {
  const findOne = async ({ where }) => users.find((user) => user.email === where.email) || null;
  mock.method(User, 'findOne', findOne);
  mock.method(User, 'scope', () => ({ findOne }));
  mock.method(User, 'findByPk', async (id) => users.find((user) => user.id === id) || null);
  mock.method(User, 'create', async (data) => {
    const user = User.build({ id: users.length + 1, ...data });
    users.push(user);
    return user;
  });
  mock.method(Grade, 'findAll', async () => []);
  mock.method(Grade, 'create', async (data) => ({ id: 1, ...data }));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  mock.restoreAll();
  await sequelize.close();
});
function request(path, method = 'GET', body, token) {
  return fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('Registration, bcrypt, login, profile and live database role checks', async () => {
  const credentials = { email: ' Student@Example.com ', password: 'StudentPass123!' };
  const registered = await request('/auth/register', 'POST', credentials);
  assert.equal(registered.status, 201);
  assert.deepEqual(await registered.json(), { id: 1, email: 'student@example.com', role: 'user' });
  assert.notEqual(users[0].passwordHash, credentials.password);
  assert.equal(bcrypt.getRounds(users[0].passwordHash), 10);
  assert.equal(await bcrypt.compare(credentials.password, users[0].passwordHash), true);
  assert.equal((await request('/auth/register', 'POST', credentials)).status, 409);
  const login = await request('/auth/login', 'POST', credentials);
  assert.equal(login.status, 200);
  assert.equal(login.headers.get('cache-control'), 'no-store');
  const { token } = await login.json();
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(decoded.exp - decoded.iat, 3600);
  assert.equal(decoded.id, 1);
  const profile = await request('/profile', 'GET', undefined, token);
  assert.equal(profile.status, 200);
  assert.deepEqual(await profile.json(), { id: 1, email: 'student@example.com', role: 'user' });
  assert.equal((await request('/grades', 'GET', undefined, token)).status, 200);
  const grade = { student: 'Test', subject: 'Math', value: 5, date: '2026-10-06' };
  for (const [method, path] of [['POST', '/grades'], ['PUT', '/grades/1'], ['DELETE', '/grades/1']]) {
    assert.equal((await request(path, method, method === 'DELETE' ? undefined : grade, token)).status, 403);
  }
  users[0].role = 'admin';
  assert.equal((await request('/grades', 'POST', grade, token)).status, 201);
  users[0].role = 'user';
  assert.equal((await request('/grades', 'POST', grade, token)).status, 403);
});

test('Reject invalid credentials, role injection and bcrypt truncation', async () => {
  for (const body of [null, [], {}, { email: 'bad', password: 'ValidPass123!' },
    { email: 'new@example.com', password: 'short' },
    { email: 'new@example.com', password: 'x'.repeat(73) },
    { email: 'new@example.com', password: '\u00e9'.repeat(37) },
    { email: 'new@example.com', password: 'ValidPass123!', role: 'admin' }]) {
    assert.equal((await request('/auth/register', 'POST', body)).status, 400);
  }
  for (const email of ['student@example.com', 'missing@example.com']) {
    const response = await request('/auth/login', 'POST', { email, password: 'Incorrect123!' });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Invalid email or password' });
  }
});

test('Reject missing, expired, forged tokens and nonexistent users', async () => {
  for (const path of ['/profile', '/grades', '/grades/1']) {
    assert.equal((await request(path)).status, 401);
  }
  const sign = (payload, options = {}) => jwt.sign(payload, process.env.JWT_SECRET, options);
  const tokens = ['broken', sign({ id: 1 }, { expiresIn: -1 }),
    jwt.sign({ id: 1 }, 'wrong-key', { expiresIn: '1h' }),
    sign({ id: 1 }, { algorithm: 'HS384', expiresIn: '1h' }),
    sign({ id: 1 }), sign({ id: '1' }, { expiresIn: '1h' }),
    sign({ id: 99999 }, { expiresIn: '1h' })];
  for (const token of tokens) assert.equal((await request('/profile', 'GET', undefined, token)).status, 401);
});

test('Concurrent duplicate registration returns 409', async () => {
  const override = mock.method(User, 'create', async () => { throw new UniqueConstraintError({ errors: [] }); });
  try {
    assert.equal((await request('/auth/register', 'POST', { email: 'race@example.com', password: 'ValidPass123!' })).status, 409);
  } finally { override.mock.restore(); }
});

test('JWT secret must be configured without an insecure fallback', () => {
  const secret = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => require('../config/auth')(), /JWT_SECRET/);
    process.env.JWT_SECRET = 'short';
    assert.throws(() => require('../config/auth')(), /JWT_SECRET/);
  } finally { process.env.JWT_SECRET = secret; }
});
