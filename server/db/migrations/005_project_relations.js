import { RELATION_TYPES } from '../../src/models/enums.js';

export async function up(knex) {
  await knex.raw(`
    CREATE TABLE project_relations (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL CHECK (relation_type IN (${RELATION_TYPES.map((type) => `'${type}'`).join(', ')})),
      label TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (source_id, target_id, relation_type),
      CHECK (source_id != target_id)
    )
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('project_relations');
}
