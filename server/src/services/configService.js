import { makeId, nullable, now, pick } from './helpers.js';
const columns = {
  environment_configs: [
    'source_folder',
    'run_command',
    'run_port',
    'access_url',
    'runtime',
    'install_command',
    'env_vars_location',
    'db_config_path',
  ],
  git_infos: ['repo_url', 'branch', 'last_commit', 'last_pushed_at'],
  deploy_infos: ['service_url', 'infra', 'version', 'deployed_at', 'deploy_method'],
};
const upsert = (db, table) => async (project_id, input) => {
  const existing = await db(table).where({ project_id }).first();
  const values = pick(input, columns[table]);
  for (const column of columns[table])
    if (Object.prototype.hasOwnProperty.call(values, column))
      values[column] = nullable(values[column]);
  values.updated_at = now();
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
    deploy: {
      get: (id) => db('deploy_infos').where({ project_id: id }).first(),
      upsert: upsert(db, 'deploy_infos'),
    },
  };
}
