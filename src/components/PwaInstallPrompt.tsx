'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900 border border-cyan-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Instalar RebajaYA</h4>
          <p className="text-xs text-slate-400">Acceso rápido desde tu pantalla de inicio</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:from-cyan-400 hover:to-blue-400 transition-all flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar</span>
        </button>

        <button
          onClick={() => setShowPrompt(false)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
