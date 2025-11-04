// Hook para sincronização de dados offline
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOnlineStatus } from './useOnlineStatus';
import { supabase } from '../lib/supabase';
import {
  getPendingVisitas,
  updateVisitaSyncStatus,
  deleteVisitaOffline,
  getOfflineStats,
} from '../lib/offline-db';

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  error: string | null;
}

export function useOfflineSync() {
  const { user, organization } = useAuth();
  const { isOnline, wasOffline } = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    error: null,
  });

  // Atualizar contador de pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const stats = await getOfflineStats();
      setSyncStatus(prev => ({ ...prev, pendingCount: stats.pendingVisitas }));
    } catch (error) {
      console.error('[Sync] Erro ao atualizar contador:', error);
    }
  }, []);

  // Sincronizar visitas pendentes
  const syncPendingVisitas = useCallback(async () => {
    if (!isOnline || !user || !organization) {
      console.log('[Sync] Não é possível sincronizar agora');
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
      console.log('[Sync] Iniciando sincronização...');

      const pendingVisitas = await getPendingVisitas();
      console.log(`[Sync] ${pendingVisitas.length} visitas pendentes`);

      if (pendingVisitas.length === 0) {
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: new Date(),
        }));
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const visitaOffline of pendingVisitas) {
        try {
          // Marcar como "syncing"
          await updateVisitaSyncStatus(visitaOffline.id, 'syncing');

          // Preparar dados da visita para o Supabase
          const visitaData = {
            cliente_id: visitaOffline.cliente_id,
            fazenda_id: visitaOffline.fazenda_id,
            talhao_id: visitaOffline.talhao_id || null,
            titulo: visitaOffline.titulo,
            data_visita: visitaOffline.data_visita,
            hora_inicio: visitaOffline.hora_inicio || null,
            hora_fim: visitaOffline.hora_fim || null,
            tipo_visita: visitaOffline.tipo_visita || null,
            status: visitaOffline.status,
            objetivo: visitaOffline.objetivo || null,
            resumo: visitaOffline.resumo || null,
            recomendacoes: visitaOffline.recomendacoes || null,
            proximos_passos: visitaOffline.proximos_passos || null,
            clima: visitaOffline.clima || null,
            temperatura: visitaOffline.temperatura || null,
            cultura: visitaOffline.cultura || null,
            safra: visitaOffline.safra || null,
            estagio_cultura: visitaOffline.estagio_cultura || null,
            organization_id: organization.id,
            tecnico_responsavel_id: user.id,
            created_by: user.id,
            is_public: false,
          };

          // Criar visita no Supabase
          const { data: visitaCreated, error: visitaError } = await supabase
            .from('visitas_tecnicas')
            .insert(visitaData)
            .select()
            .single();

          if (visitaError) throw visitaError;
          if (!visitaCreated) throw new Error('Visita criada mas sem retorno');

          console.log(`[Sync] Visita ${visitaOffline.id} criada no servidor:`, visitaCreated.id);

          // Salvar GPS se houver
          if (visitaOffline.gpsCoords) {
            await supabase.from('visita_geolocalizacao').insert({
              organization_id: organization.id,
              visita_id: visitaCreated.id,
              latitude: visitaOffline.gpsCoords.latitude,
              longitude: visitaOffline.gpsCoords.longitude,
              tipo_ponto: 'inicio_visita',
              created_by: user.id,
            });
          }

          // Upload de fotos se houver
          if (visitaOffline.photos && visitaOffline.photos.length > 0) {
            console.log(`[Sync] Uploading ${visitaOffline.photos.length} fotos...`);
            // Aqui você pode adicionar lógica para upload de fotos
            // Por enquanto, vamos apenas registrar
          }

          // Marcar como sincronizada
          await updateVisitaSyncStatus(visitaOffline.id, 'synced');
          
          // Deletar após 24h ou imediatamente
          await deleteVisitaOffline(visitaOffline.id);
          
          successCount++;
        } catch (error: any) {
          console.error(`[Sync] Erro ao sincronizar visita ${visitaOffline.id}:`, error);
          await updateVisitaSyncStatus(visitaOffline.id, 'error', error.message);
          errorCount++;
        }
      }

      console.log(`[Sync] Concluído: ${successCount} sucesso, ${errorCount} erros`);

      setSyncStatus({
        isSyncing: false,
        pendingCount: errorCount,
        lastSyncTime: new Date(),
        error: errorCount > 0 ? `${errorCount} visitas falharam` : null,
      });

      await updatePendingCount();
    } catch (error: any) {
      console.error('[Sync] Erro na sincronização:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error.message || 'Erro desconhecido',
      }));
    }
  }, [isOnline, user, organization, updatePendingCount]);

  // Auto-sincronizar quando voltar online
  useEffect(() => {
    if (wasOffline && isOnline) {
      console.log('[Sync] Voltou online, iniciando auto-sync...');
      setTimeout(() => {
        syncPendingVisitas();
      }, 2000); // Aguardar 2s para estabilizar conexão
    }
  }, [wasOffline, isOnline, syncPendingVisitas]);

  // Atualizar contador ao montar
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    ...syncStatus,
    syncNow: syncPendingVisitas,
    updatePendingCount,
  };
}
