import { ROI_ITEM_TYPES } from '../../src/models/enums.js';

export async function up(knex) {
  await knex.raw(`
    CREATE TABLE roi_items (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      item_type TEXT NOT NULL CHECK (item_type IN (${ROI_ITEM_TYPES.map((type) => `'${type}'`).join(', ')})),
      name TEXT NOT NULL,
      current_monthly_cost REAL NOT NULL DEFAULT 0 CHECK (current_monthly_cost >= 0),
      ai_build_cost REAL NOT NULL DEFAULT 0 CHECK (ai_build_cost >= 0),
      ai_monthly_cost REAL NOT NULL DEFAULT 0 CHECK (ai_monthly_cost >= 0),
      traditional_build_cost REAL CHECK (traditional_build_cost IS NULL OR traditional_build_cost >= 0),
      memo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await knex.raw('CREATE INDEX roi_items_project_id_index ON roi_items (project_id)');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('roi_items');
}
