import { useEffect, useState } from 'react';

import { onSlowRequest } from '../api/client';

/**
 * True while a request has been in flight for more than 5 seconds — the free
 * tier's 30-60s cold start. Screens use it to say "waking up the gym's
 * server…" instead of showing a spinner that reads as broken.
 */
export function useServerWaking() {
  const [waking, setWaking] = useState(false);
  useEffect(() => {
    const unsubscribe = onSlowRequest(setWaking);
    return () => {
      unsubscribe();
    };
  }, []);
  return waking;
}
