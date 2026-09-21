import toast from 'react-hot-toast';

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

export async function mutate(path, options, successMessage) {
  try {
    const data = await api(path, options);
    if (successMessage) toast.success(successMessage);
    return data;
  } catch (error) {
    toast.error(error.message);
    return null;
  }
}
