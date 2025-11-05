import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Cliente, Fazenda } from '../types/database';
import { ArrowLeft, User, Phone, Mail, MapPin, Edit, Layers } from 'lucide-react';
import ClienteModal from '../components/modals/ClienteModal';

export default function ClienteDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (id && organization) {
      loadClienteData();
    }
  }, [id, organization]);

  async function loadClienteData() {
    if (!organization || !id) return;

    try {
      setLoading(true);
      
      // Carregar dados do cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .single();

      if (clienteError) throw clienteError;
      setCliente(clienteData);

      // Carregar fazendas do cliente
      const { data: fazendasData, error: fazendasError } = await supabase
        .from('fazendas')
        .select('*')
        .eq('cliente_id', id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('nome', { ascending: true });

      if (fazendasError) throw fazendasError;
      setFazendas(fazendasData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
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

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cliente não encontrado</h3>
        <p className="text-gray-600 mb-4">O cliente solicitado não existe ou foi removido.</p>
        <Link
          to="/clientes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Clientes
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
            to="/clientes"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.nome}</h1>
            <p className="mt-1 text-gray-600">Detalhes do produtor rural</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar Cliente
        </button>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados do Cliente */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Informações Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                <p className="text-lg font-medium text-gray-900">{cliente.nome}</p>
              </div>

              {cliente.cpf_cnpj && (
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF/CNPJ</label>
                  <p className="text-lg font-medium text-gray-900">{cliente.cpf_cnpj}</p>
                </div>
              )}

              {cliente.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {cliente.email}
                  </p>
                </div>
              )}

              {cliente.telefone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {cliente.telefone}
                  </p>
                </div>
              )}

              {cliente.whatsapp && (
                <div>
                  <label className="text-sm font-medium text-gray-500">WhatsApp</label>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {cliente.whatsapp}
                  </p>
                </div>
              )}

              {(cliente.cidade || cliente.estado) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Localização</label>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {cliente.cidade}{cliente.estado && `, ${cliente.estado}`}
                  </p>
                </div>
              )}

              {cliente.cep && (
                <div>
                  <label className="text-sm font-medium text-gray-500">CEP</label>
                  <p className="text-lg font-medium text-gray-900">{cliente.cep}</p>
                </div>
              )}

              {cliente.endereco && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Endereço</label>
                  <p className="text-gray-900">{cliente.endereco}</p>
                </div>
              )}
            </div>

            {cliente.observacoes && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-500">Observações</label>
                <p className="text-gray-900 mt-1">{cliente.observacoes}</p>
              </div>
            )}
          </div>

          {/* Lista de Fazendas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-green-600" />
                Fazendas ({fazendas.length})
              </h2>
              <Link
                to="/fazendas"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Ver todas
              </Link>
            </div>

            {fazendas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>Nenhuma fazenda cadastrada para este cliente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fazendas.map((fazenda) => (
                  <Link
                    key={fazenda.id}
                    to={`/fazendas/${fazenda.id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors hover:bg-green-50"
                  >
                    <h3 className="font-medium text-gray-900">{fazenda.nome}</h3>
                    {fazenda.area_total && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {fazenda.area_total} {fazenda.unidade_area || 'hectares'}
                      </p>
                    )}
                    {(fazenda.cidade || fazenda.estado) && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {fazenda.cidade}{fazenda.estado && `, ${fazenda.estado}`}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Ações Rápidas */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            
            <div className="space-y-3">
              <Link
                to="/visitas/nova"
                className="flex items-center gap-2 w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <User className="w-4 h-4" />
                Nova Visita
              </Link>
              
              <Link
                to="/fazendas"
                className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Layers className="w-4 h-4" />
                Ver Fazendas
              </Link>

              <Link
                to="/talhoes"
                className="flex items-center gap-2 w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Layers className="w-4 h-4" />
                Ver Talhões
              </Link>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fazendas</span>
                <span className="text-lg font-semibold text-gray-900">{fazendas.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Área Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  {fazendas.reduce((total, fazenda) => total + (fazenda.area_total || 0), 0).toFixed(1)} ha
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <ClienteModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadClienteData();
          setModalOpen(false);
        }}
        editingCliente={cliente}
      />
    </div>
  );
}
