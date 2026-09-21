import {
  DOC_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  TEST_METHODS,
  TEST_RESULTS,
  TOOLS,
} from '../../src/models/enums.js';

export async function up(knex) {
  await knex.schema.createTable('projects', (table) => {
    table.text('id').primary();
    table.text('name').notNullable();
    table.text('purpose');
    table.text('status').notNullable().defaultTo('planning').checkIn(PROJECT_STATUSES);
    table.text('priority').notNullable().defaultTo('medium').checkIn(PRIORITIES);
    table.text('start_date');
    table.text('target_date');
    table.text('tags');
    table.text('created_at').notNullable();
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('tasks', (table) => {
    table.text('id').primary();
    table.text('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.text('title').notNullable();
    table.text('description');
    table.text('status').notNullable().defaultTo('todo').checkIn(TASK_STATUSES);
    table.text('assignee').defaultTo('self');
    table.integer('sort_order').defaultTo(0);
    table.text('created_at').notNullable();
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('prompt_logs', (table) => {
    table.text('id').primary();
    table.text('task_id').references('id').inTable('tasks').onDelete('SET NULL');
    table.text('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.text('tool').notNullable().checkIn(TOOLS);
    table.text('prompt_text').notNullable();
    table.text('result_summary');
    table.text('commit_hash');
    table.text('used_at').notNullable();
  });
  await knex.schema.createTable('issues', (table) => {
    table.text('id').primary();
    table.text('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.text('title').notNullable();
    table.text('description');
    table.text('type').notNullable().defaultTo('bug').checkIn(ISSUE_TYPES);
    table.text('status').notNullable().defaultTo('open').checkIn(ISSUE_STATUSES);
    table.text('priority').notNullable().defaultTo('normal').checkIn(ISSUE_PRIORITIES);
    table.text('assignee').defaultTo('self');
    table.text('linked_task_id').references('id').inTable('tasks').onDelete('SET NULL');
    table.text('created_at').notNullable();
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('documents', (table) => {
    table.text('id').primary();
    table.text('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.text('title').notNullable();
    table.text('doc_type').notNullable().defaultTo('note').checkIn(DOC_TYPES);
    table.text('content');
    table.text('source_location');
    table.integer('version').defaultTo(1);
    table.text('created_at').notNullable();
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('pause_resume_memos', (table) => {
    table.text('id').primary();
    table.text('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.text('last_work').notNullable();
    table.text('blocker');
    table.text('next_work');
    table.text('open_files');
    table.text('reference');
    table.text('recorded_at').notNullable();
  });
  await knex.schema.createTable('environment_configs', (table) => {
    table.text('id').primary();
    table
      .text('project_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.text('source_folder');
    table.text('run_command');
    table.text('run_port');
    table.text('access_url');
    table.text('runtime');
    table.text('install_command');
    table.text('env_vars_location');
    table.text('db_config_path');
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('git_infos', (table) => {
    table.text('id').primary();
    table
      .text('project_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.text('repo_url');
    table.text('branch');
    table.text('last_commit');
    table.text('last_pushed_at');
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('deploy_infos', (table) => {
    table.text('id').primary();
    table
      .text('project_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    table.text('service_url');
    table.text('infra');
    table.text('version');
    table.text('deployed_at');
    table.text('deploy_method');
    table.text('updated_at').notNullable();
  });
  await knex.schema.createTable('test_records', (table) => {
    table.text('id').primary();
    table.text('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.text('target').notNullable();
    table.text('method').checkIn(TEST_METHODS);
    table.text('result').notNullable().defaultTo('untested').checkIn(TEST_RESULTS);
    table.text('unresolved_issues');
    table.text('tested_at').notNullable();
  });
}

export async function down(knex) {
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
    await knex.schema.dropTableIfExists(table);
}
