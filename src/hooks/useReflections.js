import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createReflection,
  fetchReflections,
  fetchTodayReflections
} from '../lib/api/reflections.js';

export function useReflections() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [today, setToday] = useState({ morning: null, evening: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const [history, todayRows] = await Promise.all([
        fetchReflections(user.id),
        fetchTodayReflections(user.id)
      ]);

      setItems(history);
      setToday({
        morning: todayRows.find((r) => r.type === 'morning') ?? null,
        evening: todayRows.find((r) => r.type === 'evening') ?? null
      });
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar reflexões.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (input) => {
      if (!user) return;
      setSaving(true);
      setError('');

      try {
        await createReflection(user.id, input);
        await reload();
      } catch (err) {
        setError(err.message ?? 'Erro ao salvar reflexão.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user, reload]
  );

  return {
    items,
    today,
    loading,
    error,
    saving,
    save,
    reload
  };
}
