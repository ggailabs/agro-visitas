import React from 'react';
import { Wifi, WifiOff, Download } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function NetworkStatus() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Não mostrar nada se estiver online e nunca ficou offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top duration-300">
      {isOnline ? (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          <span className="font-medium">Conectado</span>
          <Download className="w-4 h-4 animate-bounce" />
        </div>
      ) : (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-medium">Modo Offline</span>
            <span className="text-xs opacity-90">Dados serão sincronizados quando voltar online</span>
          </div>
        </div>
      )}
    </div>
  );
}
