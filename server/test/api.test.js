import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { before, after, describe, it } from 'node:test';
import request from 'supertest';
import { processManager } from '../src/services/processManager.js';

let app;
let db;
let projectId;
let processProjectId;
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
after(async () => {
  if (processProjectId) {
    try {
      await processManager().stop(processProjectId);
    } catch {
      // The process may already have stopped during the test.
    }
  }
  await db.destroy();
});

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
  it('filters projects by group and normalizes an empty group', async () => {
    let response = await request(app).post('/api/projects').send({
      name: '그룹 프로젝트',
      group_name: 'LUDA',
    });
    assert.equal(response.status, 201);
    const groupedProjectId = response.body.data.id;
    response = await request(app).get('/api/projects?group=LUDA');
    assert.ok(response.body.data.some((project) => project.id === groupedProjectId));
    response = await request(app).get('/api/projects/groups');
    assert.deepEqual(response.body.data, ['LUDA']);
    response = await request(app).put(`/api/projects/${groupedProjectId}`).send({ group_name: '' });
    assert.equal(response.status, 200);
    response = await request(app).get(`/api/projects/${groupedProjectId}`);
    assert.equal(response.body.data.group_name, null);
    response = await request(app).delete(`/api/projects/${groupedProjectId}`);
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
    response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '마감 작업', due_date: '2026-09-25' });
    assert.equal(response.status, 201);
    assert.equal(response.body.data.due_date, '2026-09-25');
    response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '잘못된 마감일', due_date: '2026/09/25' });
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
    response = await request(app).get(`/api/projects/${projectId}/deploy`);
    assert.equal(response.body.data, null);
    response = await request(app).put(`/api/projects/${projectId}/deploy`).send({
      service_url: 'https://example.test',
      infra: 'local',
      deploy_method: 'manual',
    });
    assert.equal(response.body.data.infra, 'local');
    response = await request(app).get(`/api/projects/${projectId}`);
    assert.equal(response.body.data.deploy.service_url, 'https://example.test');
    response = await request(app)
      .post(`/api/projects/${projectId}/tests`)
      .send({ target: 'npm test', method: 'auto', result: 'pass' });
    assert.equal(response.status, 201);
    const testId = response.body.data.id;
    response = await request(app).post(`/api/projects/${projectId}/tests`).send({
      target: '브라우저 확인',
      method: 'manual',
      result: 'fail',
      unresolved_issues: '모바일 확인 필요',
    });
    assert.equal(response.status, 201);
    response = await request(app).get(`/api/projects/${projectId}/tests`);
    assert.equal(response.body.data.length, 2);
    response = await request(app)
      .post(`/api/projects/${projectId}/tests`)
      .send({ target: '   ', result: 'pass' });
    assert.equal(response.status, 400);
    response = await request(app)
      .post(`/api/projects/${projectId}/tests`)
      .send({ target: '잘못된 결과', result: 'broken' });
    assert.equal(response.status, 400);
    response = await request(app).delete(`/api/tests/${testId}`);
    assert.equal(response.status, 200);
    response = await request(app).get(`/api/projects/${projectId}/tests`);
    assert.equal(response.body.data.length, 1);
    response = await request(app).get('/api/dashboard');
    assert.ok(response.body.data.next_tasks);
  });
  it('handles project relations and graph data', async () => {
    const first = await request(app).post('/api/projects').send({ name: '관계 대상 A' });
    const second = await request(app).post('/api/projects').send({ name: '관계 대상 B' });
    let response = await request(app)
      .post(`/api/projects/${projectId}/relations`)
      .send({ target_id: first.body.data.id, relation_type: 'depends_on', label: '선행 필요' });
    assert.equal(response.status, 201);
    const firstRelationId = response.body.data.id;
    response = await request(app)
      .post(`/api/projects/${first.body.data.id}/relations`)
      .send({ target_id: second.body.data.id, relation_type: 'shares_module' });
    assert.equal(response.status, 201);
    const secondRelationId = response.body.data.id;
    response = await request(app)
      .post(`/api/projects/${second.body.data.id}/relations`)
      .send({ target_id: projectId, relation_type: 'uses_api' });
    assert.equal(response.status, 201);
    response = await request(app).get(`/api/projects/${projectId}/relations`);
    assert.equal(response.body.data.length, 2);
    assert.ok(response.body.data.some((relation) => relation.source_name === '테스트'));
    response = await request(app).get('/api/projects/missing-project/relations');
    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      success: false,
      error: '프로젝트를 찾을 수 없습니다.',
    });
    response = await request(app).get(`/api/projects/${first.body.data.id}/relations`);
    assert.equal(response.body.data.length, 2);
    assert.ok(response.body.data.some((relation) => relation.target_name === '관계 대상 B'));
    response = await request(app)
      .post(`/api/projects/${projectId}/relations`)
      .send({ target_id: projectId, relation_type: 'depends_on' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, '같은 프로젝트를 연결할 수 없습니다.');
    response = await request(app)
      .post(`/api/projects/${projectId}/relations`)
      .send({ target_id: 'missing-project', relation_type: 'depends_on' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, '프로젝트를 찾을 수 없습니다.');
    response = await request(app)
      .post(`/api/projects/${projectId}/relations`)
      .send({ target_id: first.body.data.id, relation_type: 'depends_on' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, '이미 존재하는 관계입니다.');
    response = await request(app).get('/api/relations/graph');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.nodes.length, 3);
    assert.equal(response.body.data.edges.length, 3);
    assert.ok(response.body.data.edges.every((edge) => !edge.source_name && !edge.target_name));
    response = await request(app).delete(`/api/relations/${secondRelationId}`);
    assert.equal(response.status, 200);
    response = await request(app).delete(`/api/relations/${firstRelationId}`);
    assert.equal(response.status, 200);
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
    assert.ok(
      response.body.data.calendar.some(
        (event) => event.project_id === soonResponse.body.data.id && event.type === 'target',
      ),
    );
  });
  it('includes unfinished task due dates in the calendar', async () => {
    const dueDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const doneDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const pending = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '캘린더 마감 작업', due_date: dueDate });
    const done = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '완료 마감 작업', due_date: doneDate, status: 'done' });
    const response = await request(app).get('/api/dashboard');
    assert.ok(
      response.body.data.calendar.some(
        (event) => event.type === 'task_due' && event.task_id === pending.body.data.id,
      ),
    );
    assert.equal(
      response.body.data.calendar.some((event) => event.task_id === done.body.data.id),
      false,
    );
  });
  it('handles prompt logs and validates linked tasks', async () => {
    const projectTask = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: '프롬프트 연결 작업' });
    let response = await request(app).post(`/api/projects/${projectId}/prompts`).send({
      task_id: projectTask.body.data.id,
      prompt_text: '테스트 프롬프트',
      tool: 'devin',
    });
    assert.equal(response.status, 201);
    const promptId = response.body.data.id;
    response = await request(app).get(`/api/projects/${projectId}/prompts`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].task_title, '프롬프트 연결 작업');
    response = await request(app)
      .post(`/api/projects/${projectId}/prompts`)
      .send({ prompt_text: '   ' });
    assert.equal(response.status, 400);
    response = await request(app)
      .post(`/api/projects/${projectId}/prompts`)
      .send({ prompt_text: '잘못된 도구', tool: 'invalid' });
    assert.equal(response.status, 400);
    const otherProject = await request(app).post('/api/projects').send({ name: '다른 프로젝트' });
    const otherTask = await request(app)
      .post(`/api/projects/${otherProject.body.data.id}/tasks`)
      .send({ title: '다른 작업' });
    response = await request(app)
      .post(`/api/projects/${projectId}/prompts`)
      .send({ prompt_text: '잘못된 연결', task_id: otherTask.body.data.id });
    assert.equal(response.status, 400);
    response = await request(app).delete(`/api/prompts/${promptId}`);
    assert.equal(response.status, 200);
    response = await request(app).delete(`/api/prompts/${promptId}`);
    assert.equal(response.status, 404);
  });
  it('handles issue CRUD and validation', async () => {
    let response = await request(app)
      .post(`/api/projects/${projectId}/issues`)
      .send({ title: '테스트 이슈', type: 'bug', priority: 'high' });
    assert.equal(response.status, 201);
    const issueId = response.body.data.id;
    response = await request(app).get(`/api/projects/${projectId}/issues?status=open&type=bug`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].id, issueId);
    response = await request(app).put(`/api/issues/${issueId}`).send({ title: '' });
    assert.equal(response.status, 400);
    response = await request(app).put(`/api/issues/${issueId}`).send({ status: 'invalid' });
    assert.equal(response.status, 400);
    response = await request(app).put(`/api/issues/${issueId}`).send({ status: 'done' });
    assert.equal(response.body.data.status, 'done');
    response = await request(app).delete(`/api/issues/${issueId}`);
    assert.equal(response.status, 200);
    response = await request(app).delete(`/api/issues/${issueId}`);
    assert.equal(response.status, 404);
  });
  it('handles documents without exposing content in lists', async () => {
    let response = await request(app).post(`/api/projects/${projectId}/documents`).send({
      title: '테스트 문서',
      doc_type: 'spec',
      content: '# 제목\n\n내용',
      source_location: 'docs/test.md',
    });
    assert.equal(response.status, 201);
    const documentId = response.body.data.id;
    response = await request(app).get(`/api/projects/${projectId}/documents`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].content, undefined);
    response = await request(app).get(`/api/documents/${documentId}`);
    assert.equal(response.body.data.content, '# 제목\n\n내용');
    assert.equal(response.body.data.version, 1);
    response = await request(app)
      .put(`/api/documents/${documentId}`)
      .send({ content: '# 수정된 제목' });
    assert.equal(response.body.data.content, '# 수정된 제목');
    assert.equal(response.body.data.version, 2);
    response = await request(app).delete(`/api/documents/${documentId}`);
    assert.equal(response.status, 200);
    response = await request(app).get(`/api/documents/${documentId}`);
    assert.equal(response.status, 404);
    response = await request(app).put(`/api/documents/${documentId}`).send({ content: '없음' });
    assert.equal(response.status, 404);
    response = await request(app).delete(`/api/documents/${documentId}`);
    assert.equal(response.status, 404);
  });
  it('handles cost records, filters, updates and summaries', async () => {
    const otherProject = await request(app).post('/api/projects').send({ name: '비용 프로젝트' });
    let response = await request(app).post('/api/costs').send({
      project_id: projectId,
      category: 'ai_tool',
      vendor: 'Devin',
      amount: 12.5,
      currency: 'USD',
      period: '2026-09',
      memo: '에이전트',
    });
    assert.equal(response.status, 201);
    const costId = response.body.data.id;
    response = await request(app).post('/api/costs').send({
      project_id: null,
      category: 'server',
      vendor: 'AWS',
      amount: 8000,
      currency: 'KRW',
      period: '2026-08',
    });
    assert.equal(response.status, 201);
    response = await request(app).get('/api/costs?period=2026-09');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].project_name, '테스트');
    response = await request(app).get(`/api/costs?project_id=${projectId}&category=ai_tool`);
    assert.equal(response.body.data.length, 1);
    response = await request(app).post('/api/costs').send({
      vendor: '잘못된 금액',
      category: 'other',
      amount: -1,
      period: '2026-09',
    });
    assert.equal(response.status, 400);
    response = await request(app).post('/api/costs').send({
      vendor: '잘못된 기간',
      category: 'other',
      amount: 1,
      period: '2026/09',
    });
    assert.equal(response.status, 400);
    response = await request(app).post('/api/costs').send({
      project_id: 'missing-project',
      vendor: '없는 프로젝트',
      category: 'other',
      amount: 1,
      period: '2026-09',
    });
    assert.equal(response.status, 400);
    response = await request(app)
      .put(`/api/costs/${costId}`)
      .send({ memo: '수정된 메모', amount: 13 });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.amount, 13);
    assert.equal(response.body.data.memo, '수정된 메모');
    response = await request(app).get('/api/costs/summary?from=2026-08&to=2026-09');
    assert.equal(response.status, 200);
    assert.equal(response.body.data.total_by_currency.USD, 13);
    assert.equal(response.body.data.total_by_currency.KRW, 8000);
    assert.equal(
      response.body.data.by_category.find(
        (item) => item.category === 'ai_tool' && item.currency === 'USD',
      ).total,
      13,
    );
    assert.equal(
      response.body.data.by_project.find((item) => item.project_id === null).project_name,
      '공통',
    );
    response = await request(app).delete(`/api/costs/${costId}`);
    assert.equal(response.status, 200);
    response = await request(app).get(`/api/costs?project_id=${projectId}`);
    assert.equal(response.body.data.length, 0);
    assert.equal(otherProject.body.data.name, '비용 프로젝트');
  });
  it('searches indexed entities and updates the index', async () => {
    const searchProject = await request(app).post('/api/projects').send({
      name: '통합검색 프로젝트',
      purpose: '검색 전용 프로젝트',
    });
    const searchProjectId = searchProject.body.data.id;
    const task = await request(app)
      .post(`/api/projects/${searchProjectId}/tasks`)
      .send({ title: '고유한작업어 oldsearch' });
    await request(app)
      .post(`/api/projects/${searchProjectId}/prompts`)
      .send({ prompt_text: '고유한프롬프트어', tool: 'devin' });
    await request(app)
      .post(`/api/projects/${searchProjectId}/documents`)
      .send({ title: '고유한문서어', content: '문서 본문 검색어' });
    await request(app)
      .post(`/api/projects/${searchProjectId}/issues`)
      .send({ title: '고유한이슈어', description: '이슈 설명' });

    let response = await request(app).get('/api/search?q=고유한작업어');
    assert.equal(response.status, 200);
    assert.equal(response.body.data[0].entity_type, 'task');
    response = await request(app).get('/api/search?q=고유한프롬프트어');
    assert.equal(response.body.data[0].entity_type, 'prompt');
    response = await request(app).get('/api/search?q=고유한문서어');
    assert.equal(response.body.data[0].entity_type, 'document');
    response = await request(app).get('/api/search?q=고유한이슈어');
    assert.equal(response.body.data[0].entity_type, 'issue');
    response = await request(app).get(`/api/search?q=고유한&project=${searchProjectId}&type=task`);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].project_id, searchProjectId);
    response = await request(app).get('/api/search?q=   ');
    assert.equal(response.status, 400);

    response = await request(app)
      .put(`/api/tasks/${task.body.data.id}`)
      .send({ title: '고유한작업어 newsearch' });
    assert.equal(response.status, 200);
    response = await request(app).get('/api/search?q=oldsearch');
    assert.equal(response.body.data.length, 0);
    response = await request(app).get('/api/search?q=newsearch');
    assert.equal(response.body.data[0].entity_type, 'task');
    response = await request(app).delete(`/api/tasks/${task.body.data.id}`);
    assert.equal(response.status, 200);
    response = await request(app).get('/api/search?q=newsearch');
    assert.equal(response.body.data.length, 0);
  });
  it('validates and returns not found', async () => {
    let response = await request(app).post('/api/projects').send({ name: '' });
    assert.equal(response.status, 400);
    response = await request(app).get('/api/projects/missing');
    assert.equal(response.status, 404);
  });
  it('exports and imports JSON and Markdown backups', async () => {
    let response = await request(app).post('/api/costs').send({
      project_id: projectId,
      category: 'ai_tool',
      vendor: 'Backup cost',
      amount: 17.5,
      currency: 'USD',
      period: '2026-09',
      memo: '백업 테스트 비용',
    });
    assert.equal(response.status, 201);
    response = await request(app).get(`/api/projects/${projectId}/relations`);
    assert.ok(response.body.data.length > 0);

    const exportResponse = await request(app).get('/api/export');
    assert.equal(exportResponse.status, 200);
    assert.match(exportResponse.headers['content-disposition'], /attachment/);
    for (const table of [
      'projects',
      'tasks',
      'prompt_logs',
      'issues',
      'documents',
      'pause_resume_memos',
      'environment_configs',
      'git_infos',
      'deploy_infos',
      'test_records',
      'costs',
      'project_relations',
    ])
      assert.ok(Array.isArray(exportResponse.body[table]));
    assert.ok(exportResponse.body.projects.some((project) => project.id === projectId));
    const [{ count: projectCount }] = await db('projects').count('* as count');
    assert.equal(exportResponse.body.projects.length, Number(projectCount));

    const projectExport = await request(app).get(`/api/export/projects/${projectId}`);
    assert.equal(projectExport.status, 200);
    for (const table of [
      'tasks',
      'prompt_logs',
      'issues',
      'documents',
      'pause_resume_memos',
      'environment_configs',
      'git_infos',
      'deploy_infos',
      'test_records',
    ])
      assert.ok(projectExport.body[table].every((row) => row.project_id === projectId));
    assert.ok(projectExport.body.costs.every((row) => row.project_id === projectId));
    assert.ok(
      projectExport.body.project_relations.every(
        (row) => row.source_id === projectId || row.target_id === projectId,
      ),
    );

    const markdown = await request(app).get(`/api/export/projects/${projectId}/markdown`);
    assert.equal(markdown.status, 200);
    assert.match(markdown.text, /테스트/);
    assert.match(markdown.text, /첫 작업|마감 작업/);
    assert.match(markdown.text, /## 비용/);
    assert.match(markdown.text, /## 관계/);

    response = await request(app)
      .post('/api/import?mode=merge')
      .send({
        format: 'devtracker-export',
        version: 1,
        exported_at: new Date().toISOString(),
        projects: [],
        project_relations: [
          {
            id: 'missing-project-relation',
            source_id: projectId,
            target_id: 'missing-project',
            relation_type: 'depends_on',
            label: null,
            created_at: new Date().toISOString(),
          },
        ],
      });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.counts.project_relations, 0);

    response = await request(app).delete(`/api/projects/${projectId}`);
    assert.equal(response.status, 200);
    response = await request(app).get(`/api/costs?project_id=${projectId}`);
    assert.equal(response.body.data.length, 0);

    const importedProjectName = '가져온 프로젝트';
    const importedTaskId = 'imported-task-id';
    const mergePayload = {
      ...projectExport.body,
      projects: [{ ...projectExport.body.projects[0], name: importedProjectName }],
      tasks: [
        ...projectExport.body.tasks,
        {
          id: importedTaskId,
          project_id: projectId,
          title: '가져온 고유 작업',
          description: null,
          status: 'todo',
          assignee: 'self',
          sort_order: 99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          due_date: null,
        },
      ],
    };
    response = await request(app).post('/api/import?mode=merge').send(mergePayload);
    assert.equal(response.status, 200);
    assert.equal(response.body.data.counts.tasks, mergePayload.tasks.length);
    response = await request(app).get(`/api/projects/${projectId}`);
    assert.equal(response.body.data.name, importedProjectName);
    assert.ok(response.body.data.tasks.some((task) => task.id === importedTaskId));
    response = await request(app).get('/api/search?q=가져온');
    assert.ok(response.body.data.some((result) => result.entity_id === importedTaskId));
    response = await request(app).get(`/api/costs?project_id=${projectId}`);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].project_id, projectId);
    assert.equal(response.body.data[0].amount, 17.5);
    response = await request(app).get(`/api/projects/${projectId}/relations`);
    assert.ok(response.body.data.length > 0);

    const replaceProjectId = 'replace-project-id';
    const replacePayload = {
      format: 'devtracker-export',
      version: 1,
      exported_at: new Date().toISOString(),
      projects: [
        {
          id: replaceProjectId,
          name: '교체 프로젝트',
          purpose: null,
          status: 'planning',
          priority: 'medium',
          start_date: null,
          target_date: null,
          tags: '[]',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: 'replace-task-id',
          project_id: replaceProjectId,
          title: '교체 작업',
          description: null,
          status: 'todo',
          assignee: 'self',
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          due_date: null,
        },
      ],
    };
    response = await request(app).post('/api/import?mode=replace').send(replacePayload);
    assert.equal(response.status, 200);
    response = await request(app).get('/api/projects');
    assert.deepEqual(
      response.body.data.map((project) => project.id),
      [replaceProjectId],
    );
    response = await request(app).post('/api/import?mode=invalid').send(replacePayload);
    assert.equal(response.status, 400);
    response = await request(app).post('/api/import').send({ format: 'invalid' });
    assert.equal(response.status, 400);
    projectId = replaceProjectId;
  });
  it('cascades project deletion', async () => {
    const response = await request(app).delete(`/api/projects/${projectId}`);
    assert.equal(response.status, 200);
    assert.equal((await db('tasks').where({ project_id: projectId })).length, 0);
    assert.equal(
      await db('project_relations')
        .where({ source_id: projectId })
        .orWhere({ target_id: projectId })
        .count('* as count')
        .first()
        .then((row) => Number(row.count)),
      0,
    );
    const graph = await request(app).get('/api/relations/graph');
    assert.equal(
      graph.body.data.edges.some(
        (edge) => edge.source_id === projectId || edge.target_id === projectId,
      ),
      false,
    );
  });
  it('reports registered service ports as running or stopped', async () => {
    const runningProject = await request(app).post('/api/projects').send({ name: '실행 서비스' });
    const stoppedProject = await request(app).post('/api/projects').send({ name: '잘못된 포트' });
    const listener = createServer();
    await new Promise((resolve, reject) => {
      listener.once('error', reject);
      listener.listen(0, '127.0.0.1', resolve);
    });
    const port = listener.address().port;
    let response = await request(app)
      .put(`/api/projects/${runningProject.body.data.id}/env`)
      .send({ run_port: port });
    assert.equal(response.status, 200);
    response = await request(app)
      .put(`/api/projects/${stoppedProject.body.data.id}/env`)
      .send({ run_port: 'abc' });
    assert.equal(response.status, 200);
    response = await request(app).get('/api/services');
    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.data.find((service) => service.project_id === runningProject.body.data.id),
      {
        project_id: runningProject.body.data.id,
        project_name: '실행 서비스',
        project_status: 'planning',
        run_port: port,
        access_url: null,
        running: true,
        can_start: false,
        process: null,
      },
    );
    assert.equal(
      response.body.data.some((service) => service.project_id === stoppedProject.body.data.id),
      false,
    );
    await new Promise((resolve, reject) =>
      listener.close((error) => (error ? reject(error) : resolve())),
    );
    response = await request(app).get('/api/services');
    assert.equal(
      response.body.data.find((service) => service.project_id === runningProject.body.data.id)
        .running,
      false,
    );
  });
  it('starts and stops a project service process', async () => {
    const project = await request(app).post('/api/projects').send({ name: '실행 명령 프로젝트' });
    processProjectId = project.body.data.id;
    let response = await request(app)
      .put(`/api/projects/${processProjectId}/env`)
      .send({ run_command: 'node -e "setInterval(()=>{},1000)"', run_port: 65534 });
    assert.equal(response.status, 200);
    response = await request(app).post(`/api/services/${processProjectId}/start`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data.running, true);
    assert.equal(typeof response.body.data.pid, 'number');
    response = await request(app).post(`/api/services/${processProjectId}/start`);
    assert.equal(response.status, 400);
    response = await request(app).get('/api/services');
    const service = response.body.data.find((item) => item.project_id === processProjectId);
    assert.equal(service.process.running, true);
    assert.equal(service.can_start, true);
    response = await request(app).get(`/api/services/${processProjectId}/logs`);
    assert.deepEqual(response.body.data.lines, []);
    response = await request(app).post(`/api/services/${processProjectId}/stop`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data.running, false);
    const noCommandProject = await request(app)
      .post('/api/projects')
      .send({ name: '실행 명령 없음' });
    response = await request(app).post(`/api/services/${noCommandProject.body.data.id}/start`);
    assert.equal(response.status, 400);
    assert.equal(response.body.error, '실행 명령어가 설정되지 않았습니다.');
  });
  it('runs multiline service commands sequentially', async () => {
    const project = await request(app)
      .post('/api/projects')
      .send({ name: '여러 줄 실행 명령 프로젝트' });
    processProjectId = project.body.data.id;
    let response = await request(app)
      .put(`/api/projects/${processProjectId}/env`)
      .send({ run_command: 'echo first\necho second', run_port: 65533 });
    assert.equal(response.status, 200);
    response = await request(app).post(`/api/services/${processProjectId}/start`);
    assert.equal(response.status, 200);
    const deadline = Date.now() + 3000;
    let status;
    do {
      await new Promise((resolve) => setTimeout(resolve, 50));
      response = await request(app).get('/api/services');
      status = response.body.data.find((item) => item.project_id === processProjectId)?.process;
    } while (status?.running && Date.now() < deadline);
    assert.equal(status?.running, false);
    response = await request(app).get(`/api/services/${processProjectId}/logs`);
    assert.equal(response.status, 200);
    const lines = response.body.data.lines;
    assert.ok(lines.includes('first'));
    assert.ok(lines.includes('second'));
    assert.ok(lines.indexOf('first') < lines.indexOf('second'));
  });
});
