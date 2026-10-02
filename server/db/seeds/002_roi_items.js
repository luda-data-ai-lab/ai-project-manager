import { makeId, now } from '../../src/services/helpers.js';

export async function seed(knex) {
  const projects = await knex('projects').select('id', 'name');
  const projectIds = new Map(projects.map((project) => [project.name, project.id]));
  const samples = [
    [
      'saas',
      'Notion 팀 플랜 (30명)',
      null,
      450000,
      3000000,
      50000,
      20000000,
      '사내 위키·문서 → AI로 자체 문서 시스템 개발',
    ],
    [
      'saas',
      'Jira + Confluence',
      null,
      1200000,
      8000000,
      150000,
      40000000,
      '이슈·작업 관리 → AI DevTracker 같은 자체 도구로 대체',
    ],
    [
      'saas',
      'Slack Pro',
      null,
      600000,
      10000000,
      200000,
      50000000,
      '메신저 자체 개발 — 회수까지 2년 이상 걸리는 예시',
    ],
    [
      'saas',
      'Google Workspace',
      null,
      300000,
      20000000,
      400000,
      null,
      '자체 개발 시 운영비가 더 커서 회수 불가인 예시',
    ],
    [
      'system',
      '레거시 MES 엑셀 이관 외주 유지보수',
      'ExMigrate',
      3500000,
      15000000,
      500000,
      80000000,
      '외주 유지보수 → ExMigrate로 자동화',
    ],
    [
      'system',
      'I/F 관리 시스템 외주 유지보수',
      'I/F 관리 시스템',
      2000000,
      12000000,
      300000,
      60000000,
      '연동 인터페이스 관리 내재화',
    ],
  ];

  for (const [
    item_type,
    name,
    project_name,
    current_monthly_cost,
    ai_build_cost,
    ai_monthly_cost,
    traditional_build_cost,
    memo,
  ] of samples) {
    const existing = await knex('roi_items').where({ name }).first('id');
    if (existing) continue;
    const time = now();
    await knex('roi_items').insert({
      id: makeId(),
      project_id: project_name ? (projectIds.get(project_name) ?? null) : null,
      item_type,
      name,
      current_monthly_cost,
      ai_build_cost,
      ai_monthly_cost,
      traditional_build_cost,
      memo,
      created_at: time,
      updated_at: time,
    });
  }
}
