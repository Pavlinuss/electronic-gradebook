const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../server');

let server;
let base;
const record = { student: 'Ivan Petrov', subject: 'Mathematics', value: 5, date: '2026-09-09', comment: 'Test' };

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

function request(path, method = 'GET', body) {
  return fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('CRUD lifecycle, filters, full replacement and repeated deletion', async () => {
  const initial = await request('/grades');
  assert.equal(initial.status, 200);
  assert.deepEqual(await initial.json(), []);
  const created = await request('/grades', 'POST', record);
  assert.equal(created.status, 201);
  const grade = await created.json();
  const path = `/grades/${grade.id}`;
  assert.equal(created.headers.get('location'), path);
  const found = await request(path);
  assert.equal(found.status, 200);
  assert.deepEqual(await found.json(), { id: grade.id, ...record });
  assert.equal((await (await request('/grades?subject=mathematics&student=Ivan%20Petrov')).json()).length, 1);
  assert.deepEqual(await (await request('/grades?subject=Physics')).json(), []);
  const replacement = { ...record, value: 4 };
  delete replacement.comment;
  const updated = await request(path, 'PUT', replacement);
  assert.equal(updated.status, 200);
  assert.deepEqual(await updated.json(), { id: grade.id, ...replacement, comment: '' });
  assert.equal((await request(path, 'PUT', { value: 3 })).status, 400);
  assert.equal((await (await request(path)).json()).value, 4);
  const deleted = await request(path, 'DELETE');
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), '');
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await request(path, method, method === 'PUT' ? record : undefined);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Grade not found' });
  }
});

test('Invalid records are rejected without modifying the collection', async () => {
  const invalid = [null, [], {}, { ...record, student: ' ' }, { ...record, subject: 1 },
    { ...record, value: 1 }, { ...record, value: 6 }, { ...record, value: 3.5 },
    { ...record, value: '5' }, { ...record, date: '2026-02-30' },
    { ...record, date: '09.09.2026' }, { ...record, comment: 1 }, { ...record, id: 1 }];
  for (const body of invalid) {
    const response = await request('/grades', 'POST', body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal(typeof (await response.json()).error, 'string');
  }
  assert.deepEqual(await (await request('/grades')).json(), []);
});

test('Malformed JSON, invalid IDs, invalid query strings and missing routes', async () => {
  const malformed = await fetch(`${base}/grades`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'Invalid JSON body' });
  for (const path of ['/grades/abc', '/grades/0', '/grades/-1', '/grades/1.5', '/grades/9007199254740992', '/grades?student=', '/grades?student=a&student=b', '/grades?unknown=1']) {
    assert.equal((await request(path)).status, 400, path);
  }
  const missing = await request('/missing');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Route not found' });
});
