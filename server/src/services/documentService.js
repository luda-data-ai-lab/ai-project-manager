import { makeId, nullable, now, pick } from './helpers.js';

const columns = ['title', 'doc_type', 'content', 'source_location'];
const listColumns = [
  'id',
  'title',
  'doc_type',
  'source_location',
  'version',
  'created_at',
  'updated_at',
];

const normalize = (input) => {
  const values = pick(input, columns);
  for (const column of ['content', 'source_location'])
    if (Object.prototype.hasOwnProperty.call(values, column))
      values[column] = nullable(values[column]);
  return values;
};

export function documentService(db) {
  const list = (project_id) =>
    db('documents').where({ project_id }).select(listColumns).orderBy('updated_at', 'desc');
  const get = (id) => db('documents').where({ id }).first();
  const create = async (project_id, input) => {
    const time = now();
    const document = {
      id: makeId(),
      project_id,
      created_at: time,
      updated_at: time,
      version: 1,
      ...normalize(input),
      title: input.title,
      doc_type: input.doc_type || 'note',
    };
    await db('documents').insert(document);
    return document;
  };
  const update = async (id, input) => {
    const current = await get(id);
    if (!current) return null;
    const values = normalize(input);
    if (
      Object.prototype.hasOwnProperty.call(values, 'content') &&
      values.content !== current.content
    )
      values.version = (current.version || 1) + 1;
    values.updated_at = now();
    await db('documents').where({ id }).update(values);
    return get(id);
  };
  const remove = (id) => db('documents').where({ id }).del();
  return { list, get, create, update, remove };
}
