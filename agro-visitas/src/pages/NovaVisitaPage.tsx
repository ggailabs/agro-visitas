import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useGeolocation, formatCoordinates } from '../hooks/useGeolocation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { saveVisitaOffline } from '../lib/offline-db';
import { Cliente, Fazenda, Talhao } from '../types/database';
import { Camera, Upload, X, MapPin, Calendar, Loader2, WifiOff, Cloud, CloudOff } from 'lucide-react';

export default function NovaVisitaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization, user } = useAuth();
  const { uploadMultiplePhotos, uploading, uploadProgress } = usePhotoUpload();
  const { location: gpsLocation, error: gpsError, loading: gpsLoading, getCurrentLocation } = useGeolocation();
  const { isOnline } = useOnlineStatus();
  const { pendingCount, isSyncing, syncNow } = useOfflineSync();

  // Parâmetros vindos da timeline (via state)
  const { fazendaId, clienteId } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    cliente_id: clienteId || '',
    fazenda_id: fazendaId || '',
    talhao_id: '',
    titulo: '',
    data_visita: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fim: '',
    tipo_visita: '',
    status: 'realizada',
    objetivo: '',
    resumo: '',
    recomendacoes: '',
    proximos_passos: '',
    clima: '',
    temperatura: '',
    cultura: '',
    safra: '',
    estagio_cultura: '',
  });

  // Estado para coordenadas GPS capturadas
  const [gpsCoords, setGpsCoords] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    if (organization) {
      loadClientes();
      // Se clienteId foi passado via state, carregar fazendas automaticamente
      if (clienteId) {
        loadFazendas(clienteId);
      }
    }
  }, [organization, clienteId]);

  useEffect(() => {
    if (formData.cliente_id) {
      loadFazendas(formData.cliente_id);
    } else {
      setFazendas([]);
      setTalhoes([]);
    }
  }, [formData.cliente_id]);

  useEffect(() => {
    if (formData.fazenda_id) {
      loadTalhoes(formData.fazenda_id);
    } else {
      setTalhoes([]);
    }
  }, [formData.fazenda_id]);

  async function loadClientes() {
    if (!organization) return;
    try {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('nome', { ascending: true });
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  }

  async function loadFazendas(clienteId: string) {
    if (!organization) return;
    try {
      const { data } = await supabase
        .from('fazendas')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('cliente_id', clienteId)
        .eq('is_active', true)
        .order('nome', { ascending: true});
      setFazendas(data || []);
    } catch (err) {
      console.error('Erro ao carregar fazendas:', err);
    }
  }

  async function loadTalhoes(fazendaId: string) {
    if (!organization) return;
    try {
      const { data } = await supabase
        .from('talhoes')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('fazenda_id', fazendaId)
        .eq('is_active', true)
        .order('nome', { ascending: true });
      setTalhoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar talhões:', err);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);

    // Gerar previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  // Capturar GPS
  async function handleCapturarGPS() {
    const coords = await getCurrentLocation();
    if (coords) {
      setGpsCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
  }

  // Converter fotos para base64 (para armazenamento offline)
  async function convertPhotosToBase64(files: File[]): Promise<Array<{file: string; fileName: string; fileSize: number}>> {
    const promises = files.map(file => {
      return new Promise<{file: string; fileName: string; fileSize: number}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file: reader.result as string,
            fileName: file.name,
            fileSize: file.size,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organization || !user) {
      setError('Erro de autenticação. Tente fazer login novamente.');
      return;
    }

    // Validações básicas
    if (!formData.cliente_id) {
      setError('Por favor, selecione um cliente.');
      return;
    }

    if (!formData.titulo.trim()) {
      setError('Por favor, informe o título da visita.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ===== MODO OFFLINE: Salvar localmente =====
      if (!isOnline) {
        console.log('[Offline] Salvando visita localmente...');
        
        // Gerar ID temporário
        const tempId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Converter fotos para base64
        const photosBase64 = selectedPhotos.length > 0 
          ? await convertPhotosToBase64(selectedPhotos)
          : [];
        
        // Salvar no IndexedDB
        await saveVisitaOffline({
          id: tempId,
          cliente_id: formData.cliente_id,
          fazenda_id: formData.fazenda_id,
          talhao_id: formData.talhao_id || undefined,
          titulo: formData.titulo,
          data_visita: formData.data_visita,
          hora_inicio: formData.hora_inicio || undefined,
          hora_fim: formData.hora_fim || undefined,
          tipo_visita: formData.tipo_visita || undefined,
          status: formData.status,
          objetivo: formData.objetivo || undefined,
          resumo: formData.resumo || undefined,
          recomendacoes: formData.recomendacoes || undefined,
          proximos_passos: formData.proximos_passos || undefined,
          clima: formData.clima || undefined,
          temperatura: formData.temperatura ? parseFloat(formData.temperatura.toString()) : undefined,
          cultura: formData.cultura || undefined,
          safra: formData.safra || undefined,
          estagio_cultura: formData.estagio_cultura || undefined,
          gpsCoords: gpsCoords || undefined,
          photos: photosBase64,
        });
        
        console.log('[Offline] Visita salva com sucesso:', tempId);
        
        // Redirecionar com mensagem específica de offline
        navigate('/visitas', { 
          state: { 
            message: '✅ Visita salva offline! Será sincronizada quando a conexão retornar.',
            offlineMode: true
          } 
        });
        
        setLoading(false);
        return;
      }
      
      // ===== MODO ONLINE: Salvar no Supabase diretamente =====
      // Criar visita
      const visitaData = {
        ...formData,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura.toString()) : null,
        organization_id: organization.id,
        tecnico_responsavel_id: user.id,
        created_by: user.id,
        is_public: false,
      };

      console.log('Criando visita com dados:', visitaData);

      const { data: visitaCreated, error: visitaError } = await supabase
        .from('visitas_tecnicas')
        .insert(visitaData)
        .select()
        .single();

      if (visitaError) {
        console.error('Erro ao criar visita:', visitaError);
        throw new Error(`Erro ao salvar visita: ${visitaError.message}`);
      }

      if (!visitaCreated) {
        throw new Error('Visita criada mas dados não retornados');
      }

      console.log('Visita criada com sucesso:', visitaCreated);

      // Salvar coordenadas GPS se houver
      if (gpsCoords) {
        try {
          console.log('Salvando coordenadas GPS:', gpsCoords);
          const { error: geoError } = await supabase
            .from('visita_geolocalizacao')
            .insert({
              organization_id: organization.id,
              visita_id: visitaCreated.id,
              latitude: gpsCoords.latitude,
              longitude: gpsCoords.longitude,
              tipo_ponto: 'inicio_visita',
              created_by: user.id,
            });

          if (geoError) {
            console.error('Erro ao salvar GPS:', geoError);
          } else {
            console.log('GPS salvo com sucesso');
          }
        } catch (geoErr) {
          console.error('Exceção ao salvar GPS:', geoErr);
        }
      }

      // Upload de fotos se houver
      if (selectedPhotos.length > 0) {
        try {
          console.log(`Iniciando upload de ${selectedPhotos.length} foto(s)...`);
          await uploadMultiplePhotos(selectedPhotos, {
            visitaId: visitaCreated.id,
            organizationId: organization.id,
          });
          console.log('Upload de fotos concluído');
        } catch (uploadError) {
          console.error('Erro no upload de fotos:', uploadError);
          // Não impedir o sucesso da visita por erro no upload
          setError(`Visita criada, mas houve problema no upload de fotos: ${uploadError.message}`);
        }
      }

      // Redirecionar para a lista de visitas com mensagem de sucesso
      console.log('Redirecionando para lista de visitas...');
      navigate('/visitas', { 
        state: { 
          message: '✅ Visita técnica criada com sucesso!',
          visitaId: visitaCreated.id 
        } 
      });
    } catch (err: any) {
      console.error('Erro completo no handleSubmit:', err);
      setError(err.message || 'Erro inesperado ao criar visita. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Visita Técnica</h1>
          <p className="mt-1 text-gray-600">Registre uma nova visita técnica em propriedade rural</p>
        </div>
        
        {/* Indicadores de Status */}
        <div className="flex items-center gap-3">
          {/* Status Online/Offline */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {isOnline ? (
              <>
                <Cloud className="w-4 h-4" />
                <span>Online</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Contador de Visitas Pendentes */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <WifiOff className="w-5 h-5 text-orange-600" />
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {pendingCount === 1 ? '1 visita pendente' : `${pendingCount} visitas pendentes`}
              </span>
              {/* Botão de Sincronização Manual */}
              {isOnline && !isSyncing && (
                <button
                  type="button"
                  onClick={syncNow}
                  className="ml-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sincronizar
                </button>
              )}
              {isSyncing && (
                <div className="ml-2 flex items-center gap-2 text-sm text-green-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta de modo offline */}
        {!isOnline && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <CloudOff className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-900">Modo Offline Ativo</h3>
              <p className="text-sm text-orange-700 mt-1">
                Você está sem conexão. A visita será salva localmente e sincronizada automaticamente quando a conexão retornar.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Informações Básicas */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Informações Básicas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente/Produtor *
              </label>
              <select
                name="cliente_id"
                required
                value={formData.cliente_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fazenda
              </label>
              <select
                name="fazenda_id"
                value={formData.fazenda_id}
                onChange={handleChange}
                disabled={!formData.cliente_id}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Selecione uma fazenda...</option>
                {fazendas.map(fazenda => (
                  <option key={fazenda.id} value={fazenda.id}>{fazenda.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Talhão
              </label>
              <select
                name="talhao_id"
                value={formData.talhao_id}
                onChange={handleChange}
                disabled={!formData.fazenda_id}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Selecione um talhão...</option>
                {talhoes.map(talhao => (
                  <option key={talhao.id} value={talhao.id}>{talhao.nome}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Visita *
              </label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Inspeção de Pragas - Soja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Visita *
              </label>
              <input
                type="date"
                name="data_visita"
                required
                value={formData.data_visita}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Visita
              </label>
              <select
                name="tipo_visita"
                value={formData.tipo_visita}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Inspeção">Inspeção</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Monitoramento">Monitoramento</option>
                <option value="Coleta de Dados">Coleta de Dados</option>
                <option value="Treinamento">Treinamento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Início
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Fim
              </label>
              <input
                type="time"
                name="hora_fim"
                value={formData.hora_fim}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Seção de GPS */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Localização GPS da Visita
                </label>
              </div>
              <button
                type="button"
                onClick={handleCapturarGPS}
                disabled={gpsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Capturando...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Capturar GPS Atual
                  </>
                )}
              </button>
            </div>

            {gpsError && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                {gpsError}
              </div>
            )}

            {gpsCoords && (
              <div className="p-3 bg-white border border-green-300 rounded text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    <strong>GPS capturado:</strong> {formatCoordinates(gpsCoords.latitude, gpsCoords.longitude)}
                  </span>
                </div>
                {gpsLocation?.accuracy && (
                  <p className="text-xs text-green-600 mt-1">
                    Precisão: ±{Math.round(gpsLocation.accuracy)}m
                  </p>
                )}
              </div>
            )}

            {!gpsCoords && (
              <p className="text-xs text-gray-500">
                💡 Dica: Capture a localização GPS para registrar onde a visita foi realizada.
              </p>
            )}
          </div>
        </div>

        {/* Dados Agronômicos */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Dados Agronômicos</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultura
              </label>
              <input
                type="text"
                name="cultura"
                value={formData.cultura}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Soja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safra
              </label>
              <input
                type="text"
                name="safra"
                value={formData.safra}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: 2024/2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estágio da Cultura
              </label>
              <input
                type="text"
                name="estagio_cultura"
                value={formData.estagio_cultura}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: V6 - Vegetativo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clima
              </label>
              <select
                name="clima"
                value={formData.clima}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Ensolarado">Ensolarado</option>
                <option value="Parcialmente Nublado">Parcialmente Nublado</option>
                <option value="Nublado">Nublado</option>
                <option value="Chuvoso">Chuvoso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperatura (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="temperatura"
                value={formData.temperatura}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="25.5"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Observações e Recomendações</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo da Visita
              </label>
              <textarea
                name="objetivo"
                value={formData.objetivo}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descreva o objetivo principal da visita..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resumo da Visita
              </label>
              <textarea
                name="resumo"
                value={formData.resumo}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descreva o que foi observado e realizado durante a visita..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recomendações Técnicas
              </label>
              <textarea
                name="recomendacoes"
                value={formData.recomendacoes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Liste as recomendações técnicas para o produtor..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próximos Passos
              </label>
              <textarea
                name="proximos_passos"
                value={formData.proximos_passos}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Defina os próximos passos e ações necessárias..."
              />
            </div>
          </div>
        </div>

        {/* Upload de Fotos */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Fotos da Visita</h2>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
              <Camera className="w-5 h-5" />
              Adicionar Fotos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          </div>

          {selectedPhotos.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma foto adicionada</p>
              <p className="text-sm text-gray-500 mt-1">Clique no botão acima para adicionar fotos</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">{selectedPhotos.length} foto(s) selecionada(s)</p>
            </>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Fazendo upload das fotos...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/visitas')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading || uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Criar Visita
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
