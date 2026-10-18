import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { errorMessage } from '../utils/format';

export default function useRun() {
  const qc = useQueryClient();
  return async (fn, success) => {
    try {
      const result = await fn();
      if (success) toast.success(success);
      qc.invalidateQueries();
      return result ?? true;
    } catch (e) {
      toast.error(errorMessage(e));
      return null;
    }
  };
}
