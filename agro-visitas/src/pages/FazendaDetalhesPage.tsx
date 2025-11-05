import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Fazenda, Talhao, Cliente } from '../types/database';
import { ArrowLeft, MapPin, Layers, Calendar, User, Grid3x3, Edit } from 'lucide-react';
import FazendaModal from '../components/modals/FazendaModal';

export default function FazendaDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (id && organization) {
      loadFazendaData();
    }
  }, [id, organization]);

  async function loadFazendaData() {
    if (!organization || !id) return;

    try {
      setLoading(true);
      
      // Carregar dados da fazenda
      const { data: fazendaData, error: fazendaError } = await supabase
        .from('fazendas')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .single();

      if (fazendaError) throw fazendaError;
      setFazenda(fazendaData);

      // Carregar cliente associado
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

      // Carregar talhões da fazenda
      const { data: talhoesData, error: talhoesError } = await supabase
        .from('talhoes')
        .select('*')
        .eq('fazenda_id', id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('nome', { ascending: true });

      if (talhoesError) throw talhoesError;
      setTalhoes(talhoesData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados da fazenda:', error);
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

  if (!fazenda) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fazenda não encontrada</h3>
        <p className="text-gray-600 mb-4">A fazenda solicitada não existe ou foi removida.</p>
        <Link
          to="/fazendas"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar às Fazendas
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
            to="/fazendas"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{fazenda.nome}</h1>
            <p className="mt-1 text-gray-600">Detalhes da propriedade rural</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar Fazenda
        </button>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados da Fazenda */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Informações da Propriedade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome da Fazenda</label>
                <p className="text-lg font-medium text-gray-900">{fazenda.nome}</p>
              </div>

              {fazenda.area_total && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Área Total</label>
                  <p className="text-lg font-medium text-gray-900">
                    {fazenda.area_total} {fazenda.unidade_area || 'hectares'}
                  </p>
                </div>
              )}

              {fazenda.tipo_propriedade && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Propriedade</label>
                  <p className="text-lg font-medium text-gray-900">{fazenda.tipo_propriedade}</p>
                </div>
              )}

              {(fazenda.cidade || fazenda.estado) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Localização</label>
                  <p className="text-lg font-medium text-gray-900">
                    {fazenda.cidade}{fazenda.estado && `, ${fazenda.estado}`}
                  </p>
                </div>
              )}

              {fazenda.endereco && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Endereço</label>
                  <p className="text-gray-900">{fazenda.endereco}</p>
                </div>
              )}

              {(fazenda.latitude && fazenda.longitude) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Coordenadas GPS</label>
                  <p className="text-gray-900">
                    {fazenda.latitude.toFixed(6)}, {fazenda.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {fazenda.observacoes && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-500">Observações</label>
                <p className="text-gray-900 mt-1">{fazenda.observacoes}</p>
              </div>
            )}
          </div>

          {/* Lista de Talhões */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-green-600" />
                Talhões ({talhoes.length})
              </h2>
              <Link
                to="/talhoes"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Ver todos
              </Link>
            </div>

            {talhoes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Grid3x3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>Nenhum talhão cadastrado para esta fazenda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {talhoes.map((talhao) => (
                  <div
                    key={talhao.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{talhao.nome}</h3>
                    {talhao.area && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {talhao.area} {talhao.unidade_area || 'hectares'}
                      </p>
                    )}
                    {talhao.cultura_atual && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {talhao.cultura_atual}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Informações do Cliente */}
        <div className="space-y-6">
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
                to={`/fazendas/${fazenda.id}/timeline`}
                className="flex items-center gap-2 w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Timeline de Visitas
              </Link>
              
              <Link
                to="/visitas/nova"
                className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Nova Visita
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <FazendaModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadFazendaData();
          setModalOpen(false);
        }}
        editingFazenda={fazenda}
      />
    </div>
  );
}
