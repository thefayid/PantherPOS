import { useEffect, useState } from 'react';

type LicenseStatus =
  | { ok: true; payload?: any }
  | { ok: false; reason?: string; details?: string };

export default function LicensePage(props: { status: LicenseStatus; onRecheck: () => void }) {
  const [fp, setFp] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    window.electronAPI
      .getDeviceFingerprint()
      .then((x: any) => alive && setFp(x))
      .catch(() => alive && setFp(null));
    return () => {
      alive = false;
    };
  }, []);

  const importLicense = async () => {
    setBusy(true);
    try {
      const res = await window.electronAPI.selectAndImportLicense();
      setLastResult(res);
      props.onRecheck();
    } finally {
      setBusy(false);
    }
  };

  const status = props.status;
  const isOk = status?.ok === true;

  return (
    <div className="h-screen w-screen bg-[#0a0f1c] text-white p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-black/40 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60 font-black">Offline Licensing</div>
            <h1 className="text-2xl font-black mt-1">Device Activation Required</h1>
            <p className="text-white/70 mt-2">
              This POS is offline-only. To activate, send the device fingerprint to your vendor and import the signed
              <code className="px-2">.lic</code> file.
            </p>
          </div>
          <button
            className="mac-button-primary px-5 py-3 font-black disabled:opacity-50"
            onClick={importLicense}
            disabled={busy}
          >
            {busy ? 'Importing…' : 'Select & Import .lic'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-white/60 font-black">Device Fingerprint (SHA-256)</div>
            <div className="mt-2 font-mono text-sm break-all select-all">
              {fp?.device_hash ? fp.device_hash : 'Loading…'}
            </div>
            <div className="mt-3 text-xs text-white/50">
              Uses CPU ID + Volume Serial + MAC Address (hashed). Hardware changes can invalidate the license.
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-white/60 font-black">License Status</div>
            <div className="mt-2 text-sm">
              {isOk ? (
                <div className="text-green-300 font-black">Valid</div>
              ) : (
                <div className="text-red-300 font-black">
                  Invalid{status?.reason ? `: ${status.reason}` : ''}
                </div>
              )}
              {status?.details ? <div className="mt-2 text-xs text-white/60 break-all">{status.details}</div> : null}
            </div>
            {lastResult ? (
              <div className="mt-3 text-xs text-white/60">
                Last import result: <span className="font-mono break-all">{JSON.stringify(lastResult)}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 text-xs text-white/50">
          If you believe this is an error, verify the system clock is correct and re-import the license.
        </div>
      </div>
    </div>
  );
}

