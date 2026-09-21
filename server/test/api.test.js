import assert from 'node:assert/strict';
import { before, after, describe, it } from 'node:test';
import request from 'supertest';

let app;
let db;
let projectId;
before(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.NODE_ENV = 'test';
  const knexModule = await import('knex');
  const configModule = await import('../knexfile.js');
  db = knexModule.default(configModule.default);
  await db.migrate.latest();
  const appModule = await import('../src/index.js');
  app = appModule.createApp(db);
});
after(async () => db.destroy());

describe('DevTracker API', () => {
  it('creates, lists, filters, gets and updates projects', async () => {
    let response = await request(app)
      .post('/api/projects')
      .send({ name: '테스트', status: 'development', priority: 'high', tags: ['x'] });
    assert.equal(response.status, 201);
    projectId = response.body.data.id;
    response = await request(app).get('/api/projects?status=development');
    assert.equal(response.body.data.length, 1);
    response = await request(app).get(`/api/projects/${projectId}`);
    assert.equal(response.body.data.name, '테스트');
    response = await request(app).put(`/api/projects/${projectId}`).send({ purpose: '목적' });
    assert.equal(response.body.data.purpose, '목적');
  });
  it('handles tasks, memos, env and git', async () => {
    let response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '첫 작업' });
    assert.equal(response.status, 201);
    const taskId = response.body.data.id;
    response = await request(app).put(`/api/tasks/${taskId}`).send({ status: 'done' });
    assert.equal(response.body.data.status, 'done');
    response = await request(app)
      .post(`/api/projects/${projectId}/memos`)
      .send({ last_work: '작업', next_work: '다음' });
    assert.equal(response.status, 201);
    response = await request(app).get(`/api/projects/${projectId}/memos/latest`);
    assert.equal(response.body.data.last_work, '작업');
    response = await request(app)
      .put(`/api/projects/${projectId}/env`)
      .send({ runtime: 'Node 20' });
    assert.equal(response.body.data.runtime, 'Node 20');
    response = await request(app).put(`/api/projects/${projectId}/git`).send({ branch: 'main' });
    assert.equal(response.body.data.branch, 'main');
    response = await request(app).get('/api/dashboard');
    assert.ok(response.body.data.next_tasks);
  });
  it('validates and returns not found', async () => {
    let response = await request(app).post('/api/projects').send({ name: '' });
    assert.equal(response.status, 400);
    response = await request(app).get('/api/projects/missing');
    assert.equal(response.status, 404);
  });
  it('cascades project deletion', async () => {
    const response = await request(app).delete(`/api/projects/${projectId}`);
    assert.equal(response.status, 200);
    assert.equal((await db('tasks').where({ project_id: projectId })).length, 0);
  });
});
