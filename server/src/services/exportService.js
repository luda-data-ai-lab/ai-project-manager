import { now } from './helpers.js';

const tables = [
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
];

const projectScopedTables = tables.filter((table) => table !== 'projects');
const deleteOrder = [...projectScopedTables].reverse();

const exportError = () => {
  const error = new Error('올바른 내보내기 파일이 아닙니다.');
  error.status = 400;
  return error;
};

const markdownValue = (value) => (value === null || value === undefined ? '' : String(value));
const markdownCell = (value) => markdownValue(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');

const keyValueList = (title, item, fields) => {
  if (!item) return '';
  const rows = fields
    .filter(([key]) => item[key] !== null && item[key] !== undefined && item[key] !== '')
    .map(([key, label]) => `- ${label}: ${markdownValue(item[key])}`);
  return rows.length ? `### ${title}\n${rows.join('\n')}\n` : '';
};

export function exportService(db, search) {
  const exportAll = async () => {
    const result = { format: 'devtracker-export', version: 1, exported_at: now() };
    for (const table of tables) result[table] = await db(table).select('*');
    return result;
  };

  const exportProject = async (project_id) => {
    const project = await db('projects').where({ id: project_id }).first();
    if (!project) return null;
    const result = { format: 'devtracker-export', version: 1, exported_at: now() };
    result.projects = [project];
    for (const table of projectScopedTables) {
      if (table === 'project_relations') {
        result[table] = await db(table)
          .where('source_id', project_id)
          .orWhere('target_id', project_id)
          .select('*');
      } else {
        result[table] = await db(table).where({ project_id }).select('*');
      }
    }
    return result;
  };

  const importData = async (payload, { mode = 'merge' } = {}) => {
    if (
      !payload ||
      payload.format !== 'devtracker-export' ||
      !Array.isArray(payload.projects) ||
      !['merge', 'replace'].includes(mode)
    )
      throw exportError();

    const columns = {};
    for (const table of tables) columns[table] = Object.keys(await db(table).columnInfo());
    const counts = Object.fromEntries(tables.map((table) => [table, 0]));
    await db.transaction(async (trx) => {
      if (mode === 'replace') {
        for (const table of deleteOrder) await trx(table).del();
        await trx('projects').del();
      }
      for (const table of tables) {
        const rows = Array.isArray(payload[table]) ? payload[table] : [];
        for (const row of rows) {
          const values = Object.fromEntries(
            columns[table]
              .filter((column) => Object.prototype.hasOwnProperty.call(row, column))
              .map((column) => [column, row[column]]),
          );
          if (!values.id) continue;
          if (table === 'costs' && values.project_id !== null && values.project_id !== undefined) {
            const project = await trx('projects').where({ id: values.project_id }).first();
            if (!project) continue;
          }
          if (table === 'project_relations') {
            const [source, target] = await Promise.all([
              trx('projects').where({ id: values.source_id }).first(),
              trx('projects').where({ id: values.target_id }).first(),
            ]);
            if (!source || !target) continue;
          }
          const existing = await trx(table).where({ id: values.id }).first();
          if (existing) await trx(table).where({ id: values.id }).update(values);
          else await trx(table).insert(values);
          counts[table] += 1;
        }
      }
    });
    await search?.reindex();
    return counts;
  };

  const exportMarkdown = async (project_id) => {
    const project = await db('projects').where({ id: project_id }).first();
    if (!project) return null;
    const [tasks, memos, issues, prompts, documents, env, git, deploy, tests, costs, relations] =
      await Promise.all([
        db('tasks').where({ project_id }).orderBy('sort_order').orderBy('created_at'),
        db('pause_resume_memos').where({ project_id }).orderBy('recorded_at', 'desc'),
        db('issues').where({ project_id }).orderBy('updated_at', 'desc'),
        db('prompt_logs').where({ project_id }).orderBy('used_at', 'desc'),
        db('documents').where({ project_id }).orderBy('updated_at', 'desc'),
        db('environment_configs').where({ project_id }).first(),
        db('git_infos').where({ project_id }).first(),
        db('deploy_infos').where({ project_id }).first(),
        db('test_records').where({ project_id }).orderBy('tested_at', 'desc'),
        db('costs').where({ project_id }).orderBy('period', 'desc').orderBy('created_at', 'desc'),
        db('project_relations')
          .join('projects as source_projects', 'project_relations.source_id', 'source_projects.id')
          .join('projects as target_projects', 'project_relations.target_id', 'target_projects.id')
          .where((query) =>
            query
              .where('project_relations.source_id', project_id)
              .orWhere('project_relations.target_id', project_id),
          )
          .select(
            'project_relations.*',
            'source_projects.name as source_name',
            'target_projects.name as target_name',
          )
          .orderBy('project_relations.created_at', 'desc'),
      ]);

    const sections = [`# ${project.name}\n`];
    const projectInfo = [
      project.purpose && `- 목적: ${project.purpose}`,
      project.status && `- 상태: ${project.status}`,
      (project.start_date || project.target_date) &&
        `- 기간: ${project.start_date || '?'} ~ ${project.target_date || '?'}`,
    ].filter(Boolean);
    if (projectInfo.length) sections.push(`${projectInfo.join('\n')}\n`);

    if (tasks.length) {
      sections.push(
        `## 작업\n${tasks
          .map(
            (task) =>
              `- [${task.status === 'done' ? 'x' : ' '}] ${task.title}${task.due_date ? ` (마감: ${task.due_date})` : ''}`,
          )
          .join('\n')}\n`,
      );
    }

    const memo = memos[0];
    if (memo) {
      const memoRows = [
        ['마지막 작업', memo.last_work],
        ['막힌 부분', memo.blocker],
        ['다음 작업', memo.next_work],
        ['열어둘 파일', memo.open_files],
        ['참고 자료', memo.reference],
        ['기록일', memo.recorded_at],
      ].filter(([, value]) => value !== null && value !== undefined && value !== '');
      sections.push(
        `## 중단/재개 메모\n${memoRows.map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n`,
      );
    }

    if (issues.length) {
      sections.push(
        `## 이슈\n| 제목 | 유형 | 상태 | 우선순위 |\n| --- | --- | --- | --- |\n${issues
          .map(
            (issue) =>
              `| ${markdownCell(issue.title)} | ${markdownCell(issue.type)} | ${markdownCell(issue.status)} | ${markdownCell(issue.priority)} |`,
          )
          .join('\n')}\n`,
      );
    }

    if (prompts.length) {
      sections.push(
        `## 프롬프트 로그\n${prompts
          .map(
            (prompt) =>
              `### ${prompt.used_at} · ${prompt.tool}\n> ${markdownValue(prompt.prompt_text).replace(/\n/g, '\n> ')}\n\n${prompt.result_summary ? `결과: ${prompt.result_summary}\n` : ''}`,
          )
          .join('\n')}`,
      );
    }

    if (documents.length) {
      sections.push(
        `## 문서\n${documents
          .map(
            (document) =>
              `### ${document.title} (v${document.version})\n\n${document.content || ''}\n`,
          )
          .join('\n')}`,
      );
    }

    const configurationSections = [
      keyValueList('실행 환경', env, [
        ['source_folder', '소스 폴더'],
        ['run_command', '실행 명령어'],
        ['run_port', '실행 포트'],
        ['access_url', '접속 URL'],
        ['runtime', '런타임'],
        ['install_command', '설치 명령어'],
        ['env_vars_location', '환경 변수 위치'],
        ['db_config_path', 'DB 설정 경로'],
      ]),
      keyValueList('Git', git, [
        ['repo_url', '저장소 URL'],
        ['branch', '브랜치'],
        ['last_commit', '마지막 커밋'],
        ['last_pushed_at', '마지막 푸시'],
      ]),
      keyValueList('배포', deploy, [
        ['service_url', '서비스 URL'],
        ['infra', '인프라'],
        ['version', '버전'],
        ['deployed_at', '배포일'],
        ['deploy_method', '배포 방법'],
      ]),
    ].filter(Boolean);
    if (configurationSections.length)
      sections.push(`## 실행 환경 / Git / 배포\n${configurationSections.join('\n')}`);

    if (tests.length) {
      sections.push(
        `## 테스트 기록\n| 테스트일 | 대상 | 방법 | 결과 | 미해결 이슈 |\n| --- | --- | --- | --- | --- |\n${tests
          .map(
            (test) =>
              `| ${markdownCell(test.tested_at)} | ${markdownCell(test.target)} | ${markdownCell(test.method)} | ${markdownCell(test.result)} | ${markdownCell(test.unresolved_issues)} |`,
          )
          .join('\n')}\n`,
      );
    }

    if (costs.length) {
      sections.push(
        `## 비용\n| 기간 | 분류 | 업체 | 금액 통화 | 메모 |\n| --- | --- | --- | --- | --- |\n${costs
          .map(
            (cost) =>
              `| ${markdownCell(cost.period)} | ${markdownCell(cost.category)} | ${markdownCell(cost.vendor)} | ${markdownCell(cost.amount)} ${markdownCell(cost.currency)} | ${markdownCell(cost.memo)} |`,
          )
          .join('\n')}\n`,
      );
    }

    if (relations.length) {
      sections.push(
        `## 관계\n${relations
          .map(
            (relation) =>
              `- ${markdownValue(relation.source_name)} —${markdownValue(relation.relation_type)}→ ${markdownValue(relation.target_name)}${relation.label ? ` (${markdownValue(relation.label)})` : ''}`,
          )
          .join('\n')}\n`,
      );
    }

    return `${sections.join('\n').trim()}\n`;
  };

  return { exportAll, exportProject, importData, exportMarkdown };
}
