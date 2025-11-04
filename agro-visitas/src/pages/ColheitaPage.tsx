import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Package, Calendar, TrendingUp, AlertCircle, Clock, CheckCircle2, Loader } from 'lucide-react';

interface HarvestPlan {
  id: string;
  talhao_codigo: string;
  fazenda_nome: string;
  cultura_nome: string;
  variedade_nome?: string;
  inicio_previsto?: string;
  fim_previsto?: string;
  status: string;
  producao_total?: number;
  observacoes?: string;
}

interface ProductionBatch {
  id: string;
  codigo: string;
  produto_descricao?: string;
  data_producao: string;
  volume_total?: number;
  unidade_symbol?: string;
}

export default function ColheitaPage() {
  const { organization } = useAuth();
  const [harvestPlans, setHarvestPlans] = useState<HarvestPlan[]>([]);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'planejamento' | 'producao'>('planejamento');

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization, activeTab]);

  async function loadData() {
    if (!organization) return;

    try {
      setLoading(true);

      if (activeTab === 'planejamento') {
        await loadHarvestPlans();
      } else {
        await loadProductionBatches();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHarvestPlans() {
    const { data, error } = await supabase
      .from('harvest_plans')
      .select(`
        id,
        inicio_previsto,
        fim_previsto,
        status,
        observacoes,
        talhao:talhoes!talhao_id(
          codigo,
          fazenda:fazendas!fazenda_id(nome)
        ),
        cultura:culturas!cultura_id(nome),
        variedade:variedades!variedade_id(nome)
      `)
      .eq('organization_id', organization)
      .order('inicio_previsto', { ascending: false });

    if (error) {
      console.error('Erro ao carregar planos de colheita:', error);
      setHarvestPlans([]);
      return;
    }

    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      talhao_codigo: item.talhao?.codigo || 'N/A',
      fazenda_nome: item.talhao?.fazenda?.nome || 'N/A',
      cultura_nome: item.cultura?.nome || 'N/A',
      variedade_nome: item.variedade?.nome,
      inicio_previsto: item.inicio_previsto,
      fim_previsto: item.fim_previsto,
      status: item.status || 'planejado',
      observacoes: item.observacoes
    }));

    setHarvestPlans(transformed);
  }

  async function loadProductionBatches() {
    const { data, error } = await supabase
      .from('production_batches')
      .select(`
        id,
        codigo,
        produto_descricao,
        data_producao,
        volume_total,
        unit:units!unidade_id(symbol)
      `)
      .eq('organization_id', organization)
      .order('data_producao', { ascending: false });

    if (error) {
      console.error('Erro ao carregar lotes de produção:', error);
      setProductionBatches([]);
      return;
    }

    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      produto_descricao: item.produto_descricao,
      data_producao: item.data_producao,
      volume_total: item.volume_total,
      unidade_symbol: item.unit?.symbol
    }));

    setProductionBatches(transformed);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejado': return 'bg-blue-100 text-blue-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planejado': return <Clock className="w-4 h-4" />;
      case 'em_andamento': return <Loader className="w-4 h-4 animate-spin" />;
      case 'concluido': return <CheckCircle2 className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredPlans = harvestPlans.filter((plan) =>
    plan.talhao_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.fazenda_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.cultura_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBatches = productionBatches.filter((batch) =>
    batch.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.produto_descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Colheita & Produção</h1>
                <p className="text-gray-600">Planejamento e acompanhamento de colheitas</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Plano
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('planejamento')}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'planejamento'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Planejamento
            </button>
            <button
              onClick={() => setActiveTab('producao')}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'producao'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lotes de Produção
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por talhão, fazenda, cultura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Loader className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'planejamento' ? (
              filteredPlans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum plano encontrado</h3>
                  <p className="text-gray-500">Crie um novo plano de colheita para começar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{plan.cultura_nome}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(plan.status)}`}>
                              {getStatusIcon(plan.status)}
                              {plan.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {plan.talhao_codigo}
                            </span>
                            <span>•</span>
                            <span>{plan.fazenda_nome}</span>
                            {plan.variedade_nome && (
                              <>
                                <span>•</span>
                                <span>{plan.variedade_nome}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                      </div>

                      {(plan.inicio_previsto || plan.fim_previsto) && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4" />
                          {plan.inicio_previsto && (
                            <span>Início: {new Date(plan.inicio_previsto).toLocaleDateString('pt-BR')}</span>
                          )}
                          {plan.inicio_previsto && plan.fim_previsto && <span>→</span>}
                          {plan.fim_previsto && (
                            <span>Fim: {new Date(plan.fim_previsto).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      )}

                      {plan.observacoes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{plan.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredBatches.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum lote encontrado</h3>
                  <p className="text-gray-500">Registre lotes de produção para acompanhamento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBatches.map((batch) => (
                    <div key={batch.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-amber-600">#{batch.codigo}</span>
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      
                      {batch.produto_descricao && (
                        <p className="text-gray-900 font-medium mb-3">{batch.produto_descricao}</p>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(batch.data_producao).toLocaleDateString('pt-BR')}
                        </div>
                        {batch.volume_total && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            {batch.volume_total.toLocaleString('pt-BR')} {batch.unidade_symbol || 'un'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
