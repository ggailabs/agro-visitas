import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Talhao, Fazenda, Cliente } from '../types/database';
import { ArrowLeft, Grid3x3, Layers, MapPin, User, Edit, Calendar } from 'lucide-react';
import TalhaoModal from '../components/modals/TalhaoModal';

export default function TalhaoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const [talhao, setTalhao] = useState<Talhao | null>(null);
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (id && organization) {
      loadTalhaoData();
    }
  }, [id, organization]);

  async function loadTalhaoData() {
    if (!organization || !id) return;

    try {
      setLoading(true);
      
      // Carregar dados do talhão
      const { data: talhaoData, error: talhaoError } = await supabase
        .from('talhoes')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .single();

      if (talhaoError) throw talhaoError;
      setTalhao(talhaoData);

      // Carregar fazenda asociada
      if (talhaoData.fazenda_id) {
        const { data: fazendaData, error: fazendaError } = await supabase
          .from('fazendas')
          .select('*')
          .eq('id', talhaoData.fazenda_id)
          .eq('is_active', true)
          .single();

        if (!fazendaError && fazendaData) {
          setFazenda(fazendaData);

          // Carregar cliente da fazenda
          if (fazendaData.cliente_id) {
            const { data: clienteData, error: clienteError } = await supabase
              .from('clientes')
              .select('*')
              .eq('id', fazendaData.cliente_id)
              .eq('is_active', true)
              .single();

            if (!clienteError && clienteData) {
              setCliente(clienteData);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do talhão:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!talhao) {
    return (
      <div className="text-center py-12">
        <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Talhão não encontrado</h3>
        <p className="text-gray-600 mb-4">O talhão solicitado não existe ou foi removido.</p>
        <Link
          to="/talhoes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Talhões
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/talhoes"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{talhao.nome}</h1>
            <p className="mt-1 text-gray-600">Detalhes do talhão</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar Talhão
        </button>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados do Talhão */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-green-600" />
              Informações do Talhão
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome do Talhão</label>
                <p className="text-lg font-medium text-gray-900">{talhao.nome}</p>
              </div>

              {talhao.area && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Área</label>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {talhao.area} {talhao.unidade_area || 'hectares'}
                  </p>
                </div>
              )}

              {talhao.cultura_atual && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Cultura Atual</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {talhao.cultura_atual}
                    </span>
                  </div>
                </div>
              )}

              {talhao.safra_atual && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Safra Atual</label>
                  <p className="text-lg font-medium text-gray-900">{talhao.safra_atual}</p>
                </div>
              )}

              {talhao.tipo_solo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Solo</label>
                  <p className="text-lg font-medium text-gray-900">{talhao.tipo_solo}</p>
                </div>
              )}

              {talhao.topografia && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Topografia</label>
                  <p className="text-lg font-medium text-gray-900">{talhao.topografia}</p>
                </div>
              )}

              {talhao.sistema_irrigacao && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Sistema de Irrigação</label>
                  <p className="text-gray-900">{talhao.sistema_irrigacao}</p>
                </div>
              )}
            </div>

            {talhao.observacoes && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-500">Observações</label>
                <p className="text-gray-900 mt-1">{talhao.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fazenda */}
          {fazenda && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Fazenda
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <Link
                    to={`/fazendas/${fazenda.id}`}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    {fazenda.nome}
                  </Link>
                </div>

                {fazenda.area_total && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Área Total</label>
                    <p className="text-gray-900">
                      {fazenda.area_total} {fazenda.unidade_area || 'hectares'}
                    </p>
                  </div>
                )}

                {(fazenda.cidade || fazenda.estado) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Localização</label>
                    <p className="text-gray-900">
                      {fazenda.cidade}{fazenda.estado && `, ${fazenda.estado}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cliente */}
          {cliente && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Cliente/Produtor
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <Link
                    to={`/clientes/${cliente.id}`}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    {cliente.nome}
                  </Link>
                </div>

                {cliente.telefone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-gray-900">{cliente.telefone}</p>
                  </div>
                )}

                {cliente.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{cliente.email}</p>
                  </div>
                )}

                {(cliente.cidade || cliente.estado) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Localização</label>
                    <p className="text-gray-900">
                      {cliente.cidade}{cliente.estado && `, ${cliente.estado}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            
            <div className="space-y-3">
              <Link
                to={`/fazendas/${talhao.fazenda_id}/timeline`}
                className="flex items-center gap-2 w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Timeline da Fazenda
              </Link>
              
              <Link
                to="/visitas/nova"
                className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Nova Visita
              </Link>

              <Link
                to="/talhoes"
                className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Grid3x3 className="w-4 h-4" />
                Ver Todos os Talhões
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <TalhaoModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadTalhaoData();
          setModalOpen(false);
        }}
        editingTalhao={talhao}
      />
    </div>
  );
}
