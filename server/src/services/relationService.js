import { makeId, nullable, now } from './helpers.js';

const withProjectNames = (query) =>
  query
    .join('projects as source_projects', 'project_relations.source_id', 'source_projects.id')
    .join('projects as target_projects', 'project_relations.target_id', 'target_projects.id')
    .select(
      'project_relations.*',
      'source_projects.name as source_name',
      'target_projects.name as target_name',
    );

export function relationService(db) {
  const listAll = () =>
    withProjectNames(db('project_relations')).orderBy('project_relations.created_at', 'desc');

  const listForProject = (projectId) =>
    withProjectNames(
      db('project_relations').where((query) =>
        query
          .where('project_relations.source_id', projectId)
          .orWhere('project_relations.target_id', projectId),
      ),
    ).orderBy('project_relations.created_at', 'desc');

  const create = async ({ source_id, target_id, relation_type, label }) => {
    const relation = {
      id: makeId(),
      source_id,
      target_id,
      relation_type,
      label: nullable(label || null),
      created_at: now(),
    };
    await db('project_relations').insert(relation);
    return withProjectNames(
      db('project_relations').where('project_relations.id', relation.id),
    ).first();
  };

  const remove = (id) => db('project_relations').where({ id }).del();

  const graph = async () => {
    const [nodes, relations] = await Promise.all([
      db('projects').select('id', 'name', 'status').orderBy('name'),
      listAll(),
    ]);
    return {
      nodes,
      edges: relations.map(({ id, source_id, target_id, relation_type, label }) => ({
        id,
        source_id,
        target_id,
        relation_type,
        label,
      })),
    };
  };

  return { listForProject, listAll, create, remove, graph };
}
