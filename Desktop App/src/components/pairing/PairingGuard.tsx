import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useMobileStore } from "@/store/mobile.store";

export function PairingGuard() {
  const checkPairing = useMobileStore((s) => s.checkPairing);
  const testConnection = useMobileStore((s) => s.testConnection);
  const isPaired = useMobileStore((s) => s.isPaired());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await checkPairing();
      } catch {
        /* store already stored the error */
      }
      if (!cancelled) setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [checkPairing]);

  useEffect(() => {
    if (checked && isPaired) {
      void testConnection();
    }
  }, [checked, isPaired, testConnection]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="led led-active led-pulse" aria-hidden />
          <span className="label-eq">Verificando pareo</span>
        </div>
      </div>
    );
  }

  if (!isPaired) {
    return <Navigate to="/pareo" replace />;
  }

  return <Outlet />;
}
