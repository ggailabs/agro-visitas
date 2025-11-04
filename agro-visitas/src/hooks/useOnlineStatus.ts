import { useState, useEffect } from 'react';

interface UseOnlineStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Status: ONLINE');
      setIsOnline(true);
      // Se estava offline antes, marcar para trigger de sincronização
      if (!isOnline) {
        setWasOffline(true);
        setTimeout(() => setWasOffline(false), 5000); // Reset após 5s
      }
    };

    const handleOffline = () => {
      console.log('[Network] Status: OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}
