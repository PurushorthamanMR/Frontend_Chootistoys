import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

// Debounced "does this value already exist" check against a check-availability endpoint.
// Returns one of: 'idle' | 'checking' | 'available' | 'duplicate'.
export function useDuplicateCheck(url, value, { paramName = 'value', extraParams = {}, skip = false, debounceMs = 500 } = {}) {
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);
  const extraParamsKey = JSON.stringify(extraParams);

  useEffect(() => {
    clearTimeout(timerRef.current);
    const trimmed = (value ?? '').toString().trim();
    if (skip || !trimmed) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    const myRequestId = ++requestIdRef.current;
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(url, { params: { ...extraParams, [paramName]: trimmed } });
        if (requestIdRef.current === myRequestId) setStatus(data.available ? 'available' : 'duplicate');
      } catch {
        if (requestIdRef.current === myRequestId) setStatus('idle');
      }
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, value, skip, paramName, extraParamsKey, debounceMs]);

  return status;
}
