import { COST_CATEGORIES } from '../../src/models/enums.js';

export async function up(knex) {
  await knex.raw(`
    CREATE TABLE costs (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      category TEXT NOT NULL CHECK (category IN (${COST_CATEGORIES.map((category) => `'${category}'`).join(', ')})),
      vendor TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL DEFAULT 'KRW',
      period TEXT NOT NULL,
      memo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await knex.raw('CREATE INDEX costs_period_index ON costs (period)');
  await knex.raw('CREATE INDEX costs_project_id_index ON costs (project_id)');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('costs');
}
