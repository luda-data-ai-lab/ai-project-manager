import { makeId, nullable, now, pick } from './helpers.js';

const columns = [
  'project_id',
  'item_type',
  'name',
  'current_monthly_cost',
  'ai_build_cost',
  'ai_monthly_cost',
  'traditional_build_cost',
  'memo',
];
const round1 = (value) => Math.round(value * 10) / 10;

const normalize = (input) => {
  const values = pick(input, columns);
  for (const column of ['project_id', 'traditional_build_cost', 'memo'])
    if (Object.prototype.hasOwnProperty.call(values, column))
      values[column] = nullable(values[column]);
  return values;
};

const joinedItem = (db) =>
  db('roi_items')
    .leftJoin('projects', 'roi_items.project_id', 'projects.id')
    .select('roi_items.*', 'projects.name as project_name');

export const roiMetrics = (item, years) => {
  const monthly_saving = item.current_monthly_cost - item.ai_monthly_cost;
  const annual_saving = monthly_saving * 12;
  const current_total = item.current_monthly_cost * 12 * years;
  const ai_total = item.ai_build_cost + item.ai_monthly_cost * 12 * years;
  const net_benefit = current_total - ai_total;
  return {
    monthly_saving,
    annual_saving,
    current_total,
    ai_total,
    net_benefit,
    roi_percent: item.ai_build_cost > 0 ? round1((net_benefit / item.ai_build_cost) * 100) : null,
    payback_months:
      monthly_saving <= 0
        ? null
        : item.ai_build_cost === 0
          ? 0
          : round1(item.ai_build_cost / monthly_saving),
    build_saving:
      item.traditional_build_cost == null ? null : item.traditional_build_cost - item.ai_build_cost,
  };
};

export function roiService(db) {
  const list = () => joinedItem(db).orderBy('roi_items.created_at', 'desc');
  const get = (id) => joinedItem(db).where('roi_items.id', id).first();

  const create = async (input) => {
    const time = now();
    const item = {
      id: makeId(),
      created_at: time,
      updated_at: time,
      ...normalize(input),
      project_id: nullable(input.project_id || null),
      item_type: input.item_type || 'saas',
      name: input.name,
      current_monthly_cost: input.current_monthly_cost ?? 0,
      ai_build_cost: input.ai_build_cost ?? 0,
      ai_monthly_cost: input.ai_monthly_cost ?? 0,
      traditional_build_cost: nullable(input.traditional_build_cost ?? null),
      memo: nullable(input.memo || null),
    };
    await db('roi_items').insert(item);
    return get(item.id);
  };

  const update = async (id, input) => {
    const values = normalize(input);
    if (!Object.keys(values).length) return get(id);
    values.updated_at = now();
    const changed = await db('roi_items').where({ id }).update(values);
    return changed ? get(id) : null;
  };

  const remove = (id) => db('roi_items').where({ id }).del();

  const summary = async ({ years = 3 } = {}) => {
    const rows = await list();
    const items = rows.map((item) => ({ ...item, ...roiMetrics(item, years) }));
    const inputs = rows.reduce(
      (total, item) => ({
        current_monthly_cost: total.current_monthly_cost + item.current_monthly_cost,
        ai_build_cost: total.ai_build_cost + item.ai_build_cost,
        ai_monthly_cost: total.ai_monthly_cost + item.ai_monthly_cost,
        traditional_build_cost: total.traditional_build_cost + (item.traditional_build_cost ?? 0),
      }),
      {
        current_monthly_cost: 0,
        ai_build_cost: 0,
        ai_monthly_cost: 0,
        traditional_build_cost: 0,
      },
    );
    const hasTraditionalCost = rows.some((item) => item.traditional_build_cost != null);
    const totalInputs = {
      ...inputs,
      traditional_build_cost: hasTraditionalCost ? inputs.traditional_build_cost : null,
    };
    const totals = {
      ...totalInputs,
      ...roiMetrics(totalInputs, years),
      build_saving: hasTraditionalCost
        ? items.reduce((sum, item) => sum + (item.build_saving ?? 0), 0)
        : null,
    };
    const yearly = Array.from({ length: years }, (_, index) => {
      const year = index + 1;
      return {
        year,
        current_cumulative: inputs.current_monthly_cost * 12 * year,
        ai_cumulative: inputs.ai_build_cost + inputs.ai_monthly_cost * 12 * year,
      };
    });
    return { years, items, totals, yearly };
  };

  return { list, create, update, remove, summary };
}
