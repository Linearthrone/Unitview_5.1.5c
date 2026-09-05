import { useEffect, useRef } from 'react';

export const HIPAA_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const HIPAA_IDLE_WARNING_MS = 13 * 60 * 1000;

export function useSessionTimeout(
  enabled: boolean,
  onWarn: () => void,
  onTimeout: () => void,
  idleMs = HIPAA_IDLE_TIMEOUT_MS,
  warningMs = HIPAA_IDLE_WARNING_MS
): void {
  const warnRef = useRef(onWarn);
  const timeoutRef = useRef(onTimeout);
  warnRef.current = onWarn;
  timeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return undefined;

    let warningTimer: number | undefined;
    let logoutTimer: number | undefined;
    let warned = false;

    const clearTimers = () => {
      if (warningTimer) window.clearTimeout(warningTimer);
      if (logoutTimer) window.clearTimeout(logoutTimer);
    };

    const arm = () => {
      clearTimers();
      warned = false;
      warningTimer = window.setTimeout(() => {
        warned = true;
        warnRef.current();
      }, warningMs);
      logoutTimer = window.setTimeout(() => {
        timeoutRef.current();
      }, idleMs);
    };

    const onActivity = () => {
      if (warned) return;
      arm();
    };

    arm();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('scroll', onActivity, true);

    return () => {
      clearTimers();
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('scroll', onActivity, true);
    };
  }, [enabled, idleMs, warningMs]);
}
