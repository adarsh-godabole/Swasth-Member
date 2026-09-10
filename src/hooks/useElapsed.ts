import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Seconds between two instants, ticking once a second while the session is
 * open.
 *
 * The start is always the server's `checkedInAt` rather than a locally stored
 * "started now", so closing the app or rebooting the phone mid-session does not
 * reset the clock. Each tick recomputes from `Date.now()` instead of
 * incrementing, so a throttled background timer catches up rather than drifting
 * — and a foreground event forces that recompute immediately.
 */
export function useElapsedSeconds(startIso: string | null, endIso?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  const running = !!startIso && !endIso;

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running]);

  if (!startIso) return null;
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return null;

  const end = endIso ? new Date(endIso).getTime() : now;
  if (Number.isNaN(end)) return null;

  return Math.max(0, Math.floor((end - start) / 1000));
}
