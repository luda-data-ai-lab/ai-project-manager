const base = import.meta.env.VITE_API_BASE || '';
export async function api(path, options = {}) {
  const response = await fetch(`${base}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error || '요청에 실패했습니다.');
  return payload.data;
}
