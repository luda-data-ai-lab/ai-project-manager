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
    response = await request(app)
      .put(`/api/projects/${projectId}`)
      .send({ purpose: '목적', tasks: [], latest_memo: {}, counts: {}, unknown: 'ignore me' });
    assert.equal(response.body.data.purpose, '목적');
    assert.equal(response.body.data.unknown, undefined);
    response = await request(app).put(`/api/projects/${projectId}`).send({ name: '   ' });
    assert.equal(response.status, 400);
    response = await request(app).get(`/api/projects/${projectId}`);
    assert.equal(response.body.data.name, '테스트');
    response = await request(app).put(`/api/projects/${projectId}`).send({ status: 'paused' });
    assert.equal(response.status, 200);
  });
  it('handles tasks, memos, env and git', async () => {
    let response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '첫 작업' });
    assert.equal(response.status, 201);
    const taskId = response.body.data.id;
    response = await request(app).put(`/api/tasks/${taskId}`).send({ status: 'done' });
    assert.equal(response.body.data.status, 'done');
    response = await request(app).put(`/api/tasks/${taskId}`).send({ title: '' });
    assert.equal(response.status, 400);
    response = await request(app).put(`/api/tasks/${taskId}`).send({ status: 'invalid' });
    assert.equal(response.status, 400);
    response = await request(app)
      .post(`/api/projects/${projectId}/memos`)
      .send({ last_work: '작업', next_work: '다음', open_files: ['src/index.js', 'README.md'] });
    assert.equal(response.status, 201);
    assert.deepEqual(response.body.data.open_files, ['src/index.js', 'README.md']);
    response = await request(app).get(`/api/projects/${projectId}/memos/latest`);
    assert.equal(response.body.data.last_work, '작업');
    assert.deepEqual(response.body.data.open_files, ['src/index.js', 'README.md']);
    response = await request(app)
      .put(`/api/projects/${projectId}/env`)
      .send({ runtime: 'Node 20' });
    assert.equal(response.body.data.runtime, 'Node 20');
    response = await request(app).put(`/api/projects/${projectId}/git`).send({ branch: 'main' });
    assert.equal(response.body.data.branch, 'main');
    response = await request(app).get('/api/dashboard');
    assert.ok(response.body.data.next_tasks);
  });
  it('includes due-soon projects and excludes paused projects', async () => {
    const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const soonResponse = await request(app)
      .post('/api/projects')
      .send({ name: '마감 임박', target_date: soon });
    const pausedResponse = await request(app)
      .post('/api/projects')
      .send({ name: '중단 프로젝트', status: 'paused', target_date: soon });
    const response = await request(app).get('/api/dashboard');
    assert.ok(
      response.body.data.due_soon.some((project) => project.id === soonResponse.body.data.id),
    );
    assert.equal(
      response.body.data.due_soon.some((project) => project.id === pausedResponse.body.data.id),
      false,
    );
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
