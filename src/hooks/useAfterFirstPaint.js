import { useState, useEffect } from 'react';

/**
 * Hook that returns true after the first paint is complete.
 * Use this to defer heavy operations (network, websockets, polling) until after initial render.
 *
 * Uses double requestAnimationFrame to ensure we're past the first paint.
 */
export function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Double RAF ensures we're past the first paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReady(true);
      });
    });
  }, []);

  return ready;
}

/**
 * Hook that returns true after a specified delay post first paint.
 * Use for staggering expensive operations.
 *
 * @param {number} delayMs - Delay in milliseconds after first paint
 */
export function useAfterFirstPaintDelayed(delayMs = 100) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => setReady(true), delayMs);
      });
    });
  }, [delayMs]);

  return ready;
}
