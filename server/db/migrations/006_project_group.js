export async function up(knex) {
  await knex.raw('ALTER TABLE projects ADD COLUMN group_name TEXT');
}

export async function down(knex) {
  await knex.schema.alterTable('projects', (table) => {
    table.dropColumn('group_name');
  });
}
