export async function up(knex) {
  await knex.raw('ALTER TABLE tasks ADD COLUMN due_date TEXT');
}

export async function down(knex) {
  await knex.schema.alterTable('tasks', (table) => {
    table.dropColumn('due_date');
  });
}
