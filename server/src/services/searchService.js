const entities = [
  ['projects', 'project', 'id', 'name', 'purpose'],
  ['tasks', 'task', 'id', 'title', 'description'],
  ['prompt_logs', 'prompt', 'id', 'prompt_text', 'result_summary'],
  ['documents', 'document', 'id', 'title', 'content'],
  ['issues', 'issue', 'id', 'title', 'description'],
];

const indexColumns = ['entity_type', 'entity_id', 'project_id', 'title', 'body'];

const text = (value) => value || '';
const rowValues = (entity_type, row) => {
  const config = entities.find((item) => item[1] === entity_type);
  if (!config) return null;
  const [, , idColumn, titleColumn, bodyColumn] = config;
  return {
    entity_type,
    entity_id: row[idColumn],
    project_id: entity_type === 'project' ? row.id : row.project_id,
    title: text(row[titleColumn]),
    body: text(row[bodyColumn]),
  };
};

export function searchService(db) {
  const remove = async (entity_type, entity_id) => {
    await db('search_index').where({ entity_type, entity_id }).del();
  };
  const removeProject = (project_id) => db('search_index').where({ project_id }).del();
  const index = async (entity_type, row) => {
    const values = rowValues(entity_type, row);
    if (!values) return;
    await remove(entity_type, values.entity_id);
    await db('search_index').insert(
      Object.fromEntries(indexColumns.map((column) => [column, values[column]])),
    );
  };
  const reindex = async () => {
    await db('search_index').del();
    for (const [table, entity_type] of entities) {
      const rows = await db(table).select('*');
      for (const row of rows) await index(entity_type, row);
    }
  };
  const search = async ({ q, type, project }) => {
    const match = q
      .trim()
      .replace(/"/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => `"${token}"*`)
      .join(' ');
    if (!match) return [];
    const query = db('search_index')
      .join('projects', 'search_index.project_id', 'projects.id')
      .select(
        'search_index.entity_type',
        'search_index.entity_id',
        'search_index.project_id',
        'projects.name as project_name',
        'search_index.title',
      )
      .select(db.raw("snippet(search_index, -1, '[[', ']]', '…', 20) as snippet"))
      .whereRaw('search_index MATCH ?', [match])
      .orderByRaw('bm25(search_index)')
      .limit(50);
    if (type) query.where('search_index.entity_type', type);
    if (project) query.where('search_index.project_id', project);
    return query;
  };
  return { reindex, index, remove, removeProject, search };
}
