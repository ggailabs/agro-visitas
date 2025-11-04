import React from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  // Se não é instalável ou foi dismissed, não mostrar
  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5" />
              <h3 className="font-semibold">Instalar AgroVisitas</h3>
            </div>
            <p className="text-sm text-green-50 mb-3">
              Instale o app no seu celular para acesso rápido e uso offline!
            </p>
            <div className="flex gap-2">
              <button
                onClick={promptInstall}
                className="bg-white text-green-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-50 transition-colors"
              >
                Instalar Agora
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/90 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Mais tarde
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
