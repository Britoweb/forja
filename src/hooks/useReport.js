import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchFlags, resolveFlag } from '../lib/api/flags.js';
import { buildExportableReport, downloadReportJson } from '../lib/api/report.js';
import { runDetection } from '../lib/detection/runDetection.js';

export function useReport() {
  const { user } = useAuth();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const rows = await fetchFlags(user.id);
      setFlags(rows);
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const runAnalysis = useCallback(async () => {
    if (!user) return;
    setDetecting(true);
    setError('');

    try {
      const result = await runDetection(user.id);
      setLastDetection(result);
      await reload();
    } catch (err) {
      setError(err.message ?? 'Erro ao executar análise.');
    } finally {
      setDetecting(false);
    }
  }, [user, reload]);

  const resolve = useCallback(
    async (flagId, explanation) => {
      setError('');
      try {
        await resolveFlag(flagId, explanation);
        await reload();
      } catch (err) {
        setError(err.message ?? 'Erro ao resolver flag.');
        throw err;
      }
    },
    [reload]
  );

  const exportReport = useCallback(
    async (days = 30) => {
      if (!user) return;
      setExporting(true);
      setError('');

      try {
        const report = await buildExportableReport(user.id, { days });
        downloadReportJson(report);
        return report;
      } catch (err) {
        setError(err.message ?? 'Erro ao exportar relatório.');
        throw err;
      } finally {
        setExporting(false);
      }
    },
    [user]
  );

  const copyReport = useCallback(
    async (days = 30) => {
      if (!user) return;
      setExporting(true);
      setError('');

      try {
        const report = await buildExportableReport(user.id, { days });
        await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        return report;
      } catch (err) {
        setError(err.message ?? 'Erro ao copiar relatório.');
        throw err;
      } finally {
        setExporting(false);
      }
    },
    [user]
  );

  const unresolvedCount = flags.filter((f) => !f.resolved).length;

  return {
    flags,
    unresolvedCount,
    loading,
    error,
    detecting,
    exporting,
    lastDetection,
    runAnalysis,
    resolve,
    exportReport,
    copyReport,
    reload
  };
}
