export async function up(knex) {
  const [result] = await knex.raw("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled");
  if (!result?.enabled) throw new Error('SQLite FTS5 is required to create the search index');
  await knex.raw(`
    CREATE VIRTUAL TABLE search_index USING fts5(
      entity_type UNINDEXED,
      entity_id UNINDEXED,
      project_id UNINDEXED,
      title,
      body,
      tokenize='unicode61'
    )
  `);
}

export async function down(knex) {
  await knex.raw('DROP TABLE IF EXISTS search_index');
}
