import { appConfig } from '@/config/app-config';

export interface JobProgressData {
  status: string;
  percent: number;
  processed: number;
  total: number;
  result?: any;
  error?: string | null;
}

export interface JobProgressCallbacks {
  onProgress: (data: JobProgressData) => void;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

/**
 * Subscribe to SSE progress for a BullMQ job.
 * Uses fetch() + ReadableStream so we can pass Authorization header
 * (EventSource doesn't support custom headers).
 */
export function subscribeToJobProgress(
  jobId: string,
  callbacks: JobProgressCallbacks,
): () => void {
  const controller = new AbortController();
  const url = `${appConfig.api.baseUrl}/admin/data-engine/operations/${jobId}/progress`;
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  (async () => {
    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        callbacks.onError(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const data: JobProgressData = JSON.parse(jsonStr);
              callbacks.onProgress(data);

              if (data.status === 'completed') {
                callbacks.onComplete(data.result);
                return;
              }
              if (data.status === 'failed') {
                callbacks.onError(data.error || 'Job failed');
                return;
              }
              if (data.status === 'not_found') {
                callbacks.onError('Job not found');
                return;
              }
            } catch {
              // Ignore unparseable SSE data
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Intentional cleanup
      callbacks.onError(err.message || 'SSE connection failed');
    }
  })();

  return () => controller.abort();
}
