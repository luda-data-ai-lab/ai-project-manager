import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
export function useApi() {
  const [loading, setLoading] = useState(false);
  const call = useCallback(async (...args) => {
    setLoading(true);
    try {
      return await api(...args);
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  return { call, loading };
}
