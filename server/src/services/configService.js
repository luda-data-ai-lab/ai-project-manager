import { makeId, now } from './helpers.js';
const upsert = (db, table) => async (project_id, input) => {
  const existing = await db(table).where({ project_id }).first();
  const values = { ...input, updated_at: now() };
  delete values.id;
  delete values.project_id;
  if (existing) {
    await db(table).where({ project_id }).update(values);
    return db(table).where({ project_id }).first();
  }
  const item = { id: makeId(), project_id, ...values };
  await db(table).insert(item);
  return item;
};
export function configService(db) {
  return {
    env: {
      get: (id) => db('environment_configs').where({ project_id: id }).first(),
      upsert: upsert(db, 'environment_configs'),
    },
    git: {
      get: (id) => db('git_infos').where({ project_id: id }).first(),
      upsert: upsert(db, 'git_infos'),
    },
  };
}
