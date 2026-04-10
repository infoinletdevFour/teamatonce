import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToJobProgress, JobProgressData } from '@/lib/sse-client';

export interface UseJobProgressReturn {
  startJob: (jobId: string) => void;
  progress: JobProgressData | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  result: any;
  error: string | null;
  isRunning: boolean;
  reset: () => void;
}

export function useJobProgress(): UseJobProgressReturn {
  const [progress, setProgress] = useState<JobProgressData | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startJob = useCallback((jobId: string) => {
    cleanup();
    setProgress(null);
    setResult(null);
    setError(null);
    setStatus('running');

    const abort = subscribeToJobProgress(jobId, {
      onProgress: (data) => setProgress(data),
      onComplete: (res) => {
        setResult(res);
        setStatus('completed');
      },
      onError: (err) => {
        setError(err);
        setStatus('failed');
      },
    });

    abortRef.current = abort;
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setProgress(null);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, [cleanup]);

  return {
    startJob,
    progress,
    status,
    result,
    error,
    isRunning: status === 'running',
    reset,
  };
}
