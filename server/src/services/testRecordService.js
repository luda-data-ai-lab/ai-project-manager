import { makeId, nullable, now, pick } from './helpers.js';

const columns = ['target', 'method', 'result', 'unresolved_issues', 'tested_at'];

export function testRecordService(db) {
  const list = (project_id) =>
    db('test_records').where({ project_id }).orderBy('tested_at', 'desc');
  const create = async (project_id, input) => {
    const values = pick(input, columns);
    const record = {
      id: makeId(),
      project_id,
      target: input.target,
      method: values.method || null,
      result: values.result || 'untested',
      unresolved_issues: nullable(values.unresolved_issues || null),
      tested_at: values.tested_at || now(),
    };
    await db('test_records').insert(record);
    return record;
  };
  const remove = (id) => db('test_records').where({ id }).del();
  return { list, create, remove };
}
