import { createConnection } from 'node:net';

export const isPortOpen = (port, host = '127.0.0.1', timeout = 800) =>
  new Promise((resolve) => {
    const socket = createConnection({ host, port });
    let settled = false;
    const finish = (running) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(running);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
    socket.setTimeout(timeout);
  });

export async function serviceStatusService(db) {
  const rows = await db('environment_configs')
    .join('projects', 'environment_configs.project_id', 'projects.id')
    .whereNotNull('environment_configs.run_port')
    .where('environment_configs.run_port', '!=', '')
    .select(
      'environment_configs.project_id',
      'projects.name as project_name',
      'projects.status as project_status',
      'environment_configs.run_port',
      'environment_configs.access_url',
    )
    .orderBy('projects.name');
  const services = rows
    .map((row) => ({ ...row, run_port: Number(row.run_port) }))
    .filter(({ run_port }) => Number.isInteger(run_port) && run_port >= 1 && run_port <= 65535);
  return Promise.all(
    services.map(async (service) => ({
      ...service,
      running: (await isPortOpen(service.run_port)) || (await isPortOpen(service.run_port, '::1')),
    })),
  );
}
