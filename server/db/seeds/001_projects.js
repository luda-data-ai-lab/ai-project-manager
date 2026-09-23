import { makeId, now } from '../../src/services/helpers.js';

export async function seed(knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  for (const table of [
    'project_relations',
    'costs',
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
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const dueDate = (day) =>
    new Date(monthStart.getFullYear(), monthStart.getMonth(), day).toISOString().slice(0, 10);
  const month = (offset) =>
    new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth() + offset, 1))
      .toISOString()
      .slice(0, 7);
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
      group_name: 'LUDA',
    },
    {
      id: makeId(),
      name: 'MakeBook',
      purpose: '사용자 글감·사진으로 장르별 책 제작 서비스',
      status: 'planning',
      priority: 'medium',
      target_date: soon,
      tags: JSON.stringify(['ai', 'content', 'book']),
      group_name: '개인',
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
    ['이관 테스트 작성', 'todo', dueDate(2)],
    ['복합키 테이블 매핑', 'blocked', dueDate(3)],
  ].map(([title, status, due_date], index) => ({
    id: makeId(),
    project_id: ex.id,
    title,
    status,
    description: null,
    assignee: 'self',
    sort_order: index,
    created_at: time,
    updated_at: time,
    due_date: due_date || null,
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
  await knex('prompt_logs').insert([
    {
      id: makeId(),
      project_id: ex.id,
      task_id: tasks[1].id,
      tool: 'devin',
      prompt_text: 'ERD 생성 로직에서 복합키 테이블을 안정적으로 매핑하는 방법을 제안해줘.',
      result_summary: '복합키 메타데이터를 먼저 정규화하는 접근을 검토했다.',
      commit_hash: null,
      used_at: time,
    },
    {
      id: makeId(),
      project_id: ex.id,
      task_id: null,
      tool: 'claude',
      prompt_text: '이관 테스트 케이스의 누락된 경계 조건을 찾아줘.',
      result_summary: '빈 셀과 중복 키 처리 케이스를 추가하기로 했다.',
      commit_hash: null,
      used_at: time,
    },
  ]);
  await knex('issues').insert([
    {
      id: makeId(),
      project_id: ex.id,
      title: '복합키 매핑 실패',
      description: '일부 복합키 테이블에서 대상 컬럼을 찾지 못한다.',
      type: 'bug',
      status: 'open',
      priority: 'urgent',
      assignee: 'self',
      linked_task_id: tasks[3].id,
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: ex.id,
      title: '이관 결과 요약 개선',
      description: '배치별 처리 결과를 한눈에 볼 수 있도록 요약을 추가한다.',
      type: 'improvement',
      status: 'done',
      priority: 'normal',
      assignee: 'self',
      linked_task_id: tasks[2].id,
      created_at: time,
      updated_at: time,
    },
  ]);
  await knex('documents').insert([
    {
      id: makeId(),
      project_id: ex.id,
      title: 'ExMigrate 명세',
      doc_type: 'spec',
      content:
        '# ExMigrate 명세\n\n## 목표\n\n- 엑셀 데이터를 DB로 이관합니다.\n- 이관 결과를 검증합니다.\n\n```ts\nawait migrateWorkbook(input);\n```',
      source_location: 'docs/exmigrate-spec.md',
      version: 1,
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: ex.id,
      title: '개발일지',
      doc_type: 'devlog',
      content: '## 오늘 한 일\n\n복합키 매핑 로직을 점검했습니다.',
      source_location: null,
      version: 1,
      created_at: time,
      updated_at: time,
    },
  ]);
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
  await knex('deploy_infos').insert({
    id: makeId(),
    project_id: ex.id,
    service_url: 'http://localhost:3000',
    infra: 'local',
    version: '0.1.0',
    deployed_at: time.slice(0, 10),
    deploy_method: 'manual',
    updated_at: time,
  });
  await knex('test_records').insert([
    {
      id: makeId(),
      project_id: ex.id,
      target: 'npm test',
      method: 'auto',
      result: 'pass',
      unresolved_issues: null,
      tested_at: time,
    },
    {
      id: makeId(),
      project_id: ex.id,
      target: '브라우저 프로젝트 상세',
      method: 'manual',
      result: 'fail',
      unresolved_issues: '모바일 레이아웃 확인 필요',
      tested_at: time,
    },
  ]);
  await knex('costs').insert([
    {
      id: makeId(),
      project_id: ex.id,
      category: 'ai_tool',
      vendor: 'Devin',
      amount: 20,
      currency: 'USD',
      period: month(0),
      memo: '개발 에이전트 사용료',
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: ex.id,
      category: 'ai_tool',
      vendor: 'Claude API',
      amount: 15,
      currency: 'USD',
      period: month(-1),
      memo: '프롬프트 API 사용료',
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: null,
      category: 'ai_tool',
      vendor: 'Cursor',
      amount: 20,
      currency: 'USD',
      period: month(-2),
      memo: 'IDE 구독',
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: ex.id,
      category: 'server',
      vendor: 'AWS EC2',
      amount: 8.5,
      currency: 'USD',
      period: month(0),
      memo: '개발 서버',
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: projects[1].id,
      category: 'other',
      vendor: '도메인',
      amount: 15000,
      currency: 'KRW',
      period: month(-1),
      memo: '도메인 갱신',
      created_at: time,
      updated_at: time,
    },
    {
      id: makeId(),
      project_id: projects[1].id,
      category: 'server',
      vendor: 'Vercel',
      amount: 5,
      currency: 'USD',
      period: month(-2),
      memo: '프리뷰 배포',
      created_at: time,
      updated_at: time,
    },
  ]);
  await knex('project_relations').insert([
    {
      id: makeId(),
      source_id: projects[0].id,
      target_id: projects[2].id,
      relation_type: 'precedes',
      label: null,
      created_at: time,
    },
    {
      id: makeId(),
      source_id: projects[1].id,
      target_id: projects[0].id,
      relation_type: 'shares_module',
      label: '공통 인증 모듈',
      created_at: time,
    },
    {
      id: makeId(),
      source_id: projects[2].id,
      target_id: projects[0].id,
      relation_type: 'uses_api',
      label: 'ERD export API',
      created_at: time,
    },
  ]);
}
