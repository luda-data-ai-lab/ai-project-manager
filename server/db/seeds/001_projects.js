import { makeId, now } from '../../src/services/helpers.js';

export async function seed(knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  for (const table of [
    'test_records',
    'deploy_infos',
    'git_infos',
    'environment_configs',
    'pause_resume_memos',
    'documents',
    'issues',
    'prompt_logs',
    'tasks',
    'projects',
  ])
    await knex(table).del();
  await knex.raw('PRAGMA foreign_keys = ON');
  const time = now();
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const projects = [
    {
      id: makeId(),
      name: 'ExMigrate',
      purpose: '페인트 제조 MES 엑셀 → DB 이관 시스템',
      status: 'development',
      priority: 'high',
      start_date: '2026-09-01',
      target_date: '2026-10-15',
      tags: JSON.stringify(['excel', 'database', 'migration']),
    },
    {
      id: makeId(),
      name: 'MakeBook',
      purpose: '사용자 글감·사진으로 장르별 책 제작 서비스',
      status: 'planning',
      priority: 'medium',
      target_date: soon,
      tags: JSON.stringify(['ai', 'content', 'book']),
    },
    {
      id: makeId(),
      name: 'I/F 관리 시스템',
      purpose: '인터페이스 리스트·대시보드·시스템 연결 현황 관리',
      status: 'planning',
      priority: 'medium',
      tags: JSON.stringify(['interface', 'dashboard']),
    },
  ].map((project) => ({ ...project, created_at: time, updated_at: time }));
  await knex('projects').insert(projects);
  const ex = projects[0];
  const tasks = [
    ['엑셀 데이터 구조 분석', 'done'],
    ['ERD 생성 로직 구현', 'in_progress'],
    ['이관 테스트 작성', 'todo'],
    ['복합키 테이블 매핑', 'blocked'],
  ].map(([title, status], index) => ({
    id: makeId(),
    project_id: ex.id,
    title,
    status,
    description: null,
    assignee: 'self',
    sort_order: index,
    created_at: time,
    updated_at: time,
  }));
  await knex('tasks').insert(tasks);
  await knex('pause_resume_memos').insert({
    id: makeId(),
    project_id: ex.id,
    last_work: 'ERD 생성 로직 구현',
    blocker: '복합키 테이블 매핑',
    next_work: '매핑 로직 수정 → 이관 테스트',
    open_files: JSON.stringify(['src/erd/generator.ts', 'tests/mapping.test.ts']),
    reference: null,
    recorded_at: time,
  });
  await knex('environment_configs').insert({
    id: makeId(),
    project_id: ex.id,
    source_folder: '~/projects/exmigrate',
    run_command: 'npm run dev',
    run_port: '3000',
    access_url: 'http://localhost:3000',
    runtime: 'Ubuntu 24, Node 20, Python 3.12',
    install_command: 'npm install',
    env_vars_location: '.env.example 참조',
    db_config_path: null,
    updated_at: time,
  });
  await knex('git_infos').insert({
    id: makeId(),
    project_id: ex.id,
    repo_url: 'https://github.com/luda-data-ai-lab/exmigrate',
    branch: 'main',
    last_commit: null,
    last_pushed_at: null,
    updated_at: time,
  });
}
