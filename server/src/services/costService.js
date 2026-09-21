import { makeId, nullable, now, pick } from './helpers.js';

const columns = ['project_id', 'category', 'vendor', 'amount', 'currency', 'period', 'memo'];
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const shiftMonth = (month, offset) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
};

const range = ({ from, to } = {}) => {
  const end = to || currentMonth();
  return { from: from || shiftMonth(end, -5), to: end };
};

const normalize = (input) => {
  const values = pick(input, columns);
  for (const column of ['project_id', 'memo'])
    if (Object.prototype.hasOwnProperty.call(values, column))
      values[column] = nullable(values[column]);
  return values;
};

export function costService(db) {
  const list = ({ period, project_id, category } = {}) => {
    const query = db('costs')
      .leftJoin('projects', 'costs.project_id', 'projects.id')
      .select('costs.*', 'projects.name as project_name')
      .orderBy('costs.period', 'desc')
      .orderBy('costs.created_at', 'desc');
    if (period) query.where('costs.period', period);
    if (project_id === 'common') query.whereNull('costs.project_id');
    else if (project_id) query.where('costs.project_id', project_id);
    if (category) query.where('costs.category', category);
    return query;
  };

  const create = async (input) => {
    const time = now();
    const cost = {
      id: makeId(),
      created_at: time,
      updated_at: time,
      ...normalize(input),
      project_id: nullable(input.project_id || null),
      category: input.category || 'other',
      vendor: input.vendor,
      amount: input.amount,
      currency: input.currency || 'KRW',
      period: input.period,
      memo: nullable(input.memo || null),
    };
    await db('costs').insert(cost);
    return db('costs')
      .leftJoin('projects', 'costs.project_id', 'projects.id')
      .select('costs.*', 'projects.name as project_name')
      .where('costs.id', cost.id)
      .first();
  };

  const update = async (id, input) => {
    const values = normalize(input);
    if (!Object.keys(values).length) return db('costs').where({ id }).first();
    values.updated_at = now();
    const changed = await db('costs').where({ id }).update(values);
    if (!changed) return null;
    return db('costs')
      .leftJoin('projects', 'costs.project_id', 'projects.id')
      .select('costs.*', 'projects.name as project_name')
      .where('costs.id', id)
      .first();
  };

  const remove = (id) => db('costs').where({ id }).del();

  const summary = async (filters = {}) => {
    const { from, to } = range(filters);
    const rows = await db('costs')
      .leftJoin('projects', 'costs.project_id', 'projects.id')
      .whereBetween('costs.period', [from, to])
      .select('costs.*', 'projects.name as project_name');
    const total_by_currency = { KRW: 0, USD: 0 };
    const byCategory = new Map();
    const byProject = new Map();
    const byPeriod = new Map();
    for (const row of rows) {
      total_by_currency[row.currency] = (total_by_currency[row.currency] || 0) + row.amount;
      const categoryKey = `${row.category}:${row.currency}`;
      byCategory.set(categoryKey, {
        category: row.category,
        currency: row.currency,
        total: (byCategory.get(categoryKey)?.total || 0) + row.amount,
      });
      const projectKey = `${row.project_id || 'common'}:${row.currency}`;
      byProject.set(projectKey, {
        project_id: row.project_id,
        project_name: row.project_name || '공통',
        currency: row.currency,
        total: (byProject.get(projectKey)?.total || 0) + row.amount,
      });
      const periodKey = `${row.period}:${row.currency}`;
      byPeriod.set(periodKey, {
        period: row.period,
        currency: row.currency,
        total: (byPeriod.get(periodKey)?.total || 0) + row.amount,
      });
    }
    return {
      total_by_currency,
      by_category: [...byCategory.values()],
      by_project: [...byProject.values()],
      by_period: [...byPeriod.values()],
    };
  };

  return { list, create, update, remove, summary, monthPattern };
}
