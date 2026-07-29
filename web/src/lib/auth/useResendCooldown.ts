import { useEffect, useRef, useState } from "react";

// Ticking countdown for the verify-email resend button. Signup already sends
// one email immediately, so an instant resend would just burn the shared
// project-wide send-rate limit — lock the button for `seconds` first.
export function useResendCooldown() {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function start(seconds: number) {
    setRemaining(seconds);
    const tick = (n: number) => {
      if (n <= 0) {
        setRemaining(0);
        return;
      }
      setRemaining(n);
      timerRef.current = setTimeout(() => tick(n - 1), 1000);
    };
    tick(seconds);
  }

  return { remaining, start };
}
