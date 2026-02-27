'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type WorkflowStatus =
  | 'idle'
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'error';

interface UseWorkflowPollerReturn {
  status: WorkflowStatus;
  elapsedSeconds: number;
  startPolling: (runId: number) => void;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 150; // 10 minutes
const MAX_CONSECUTIVE_ERRORS = 5;

export function useWorkflowPoller(onComplete: () => void): UseWorkflowPollerReturn {
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pollCountRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (runId: number) => {
      stopPolling();
      pollCountRef.current = 0;
      consecutiveErrorsRef.current = 0;
      startTimeRef.current = Date.now();
      setStatus('queued');
      setElapsedSeconds(0);

      intervalRef.current = setInterval(async () => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
        pollCountRef.current++;

        if (pollCountRef.current > MAX_POLLS) {
          stopPolling();
          setStatus('timeout');
          return;
        }

        try {
          const res = await fetch(`/api/status/${runId}`);
          if (!res.ok) throw new Error(`Status check failed: ${res.status}`);

          const data = (await res.json()) as {
            status: string;
            conclusion: string | null;
          };

          consecutiveErrorsRef.current = 0;

          if (data.status === 'queued') {
            setStatus('queued');
          } else if (data.status === 'in_progress') {
            setStatus('in_progress');
          } else if (data.status === 'completed') {
            stopPolling();
            if (data.conclusion === 'success') {
              setStatus('completed');
              // Wait a beat then fetch fresh reports directly — bypasses CDN cache
              setTimeout(() => onCompleteRef.current(), 1500);
            } else {
              setStatus('failed');
            }
          }
        } catch {
          consecutiveErrorsRef.current++;
          if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
            stopPolling();
            setStatus('error');
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { status, elapsedSeconds, startPolling };
}
