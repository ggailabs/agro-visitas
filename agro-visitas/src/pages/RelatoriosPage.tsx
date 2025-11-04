import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, FileText, Download, Eye, Calendar, Clock, CheckCircle2, XCircle, Loader, Filter } from 'lucide-react';

interface ReportVersion {
  id: string;
  numero: string;
  status: string;
  gerado_em: string;
  finalizado_em?: string;
  model_nome: string;
  model_escopo: string;
  gerado_por_nome?: string;
  observacoes?: string;
}

interface ReportModel {
  id: string;
  nome: string;
  versao: string;
  escopo: string;
  descricao?: string;
}

const STATUS_CONFIG: {[key: string]: {label: string; color: string; icon: any}} = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: Clock },
  em_revisao: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  publicado: { label: 'Publicado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  arquivado: { label: 'Arquivado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const ESCOPO_LABELS: {[key: string]: string} = {
  solo: 'Análise de Solo',
  cultura: 'Monitoramento de Cultura',
  clima: 'Eventos Climáticos',
  colheita: 'Colheita e Produção',
  geral: 'Relatório Geral',
};

export default function RelatoriosPage() {
  const { organization } = useAuth();
  const [reports, setReports] = useState<ReportVersion[]>([]);
  const [models, setModels] = useState<ReportModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterEscopo, setFilterEscopo] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'relatorios' | 'modelos'>('relatorios');

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization, activeTab]);

  async function loadData() {
    if (!organization) return;

    try {
      setLoading(true);

      if (activeTab === 'relatorios') {
        await loadReports();
      } else {
        await loadModels();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    const { data, error } = await supabase
      .from('report_versions')
      .select(`
        id,
        numero,
        status,
        gerado_em,
        finalizado_em,
        observacoes,
        model:report_models!model_id(
          nome,
          escopo
        ),
        gerado_por_profile:profiles!gerado_por(
          nome
        )
      `)
      .order('gerado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar relatórios:', error);
      setReports([]);
      return;
    }

    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      numero: item.numero,
      status: item.status,
      gerado_em: item.gerado_em,
      finalizado_em: item.finalizado_em,
      model_nome: item.model?.nome || 'N/A',
      model_escopo: item.model?.escopo || 'geral',
      gerado_por_nome: item.gerado_por_profile?.nome,
      observacoes: item.observacoes
    }));

    setReports(transformed);
  }

  async function loadModels() {
    const { data, error } = await supabase
      .from('report_models')
      .select('id, nome, versao, escopo, descricao')
      .eq('organization_id', organization)
      .order('nome');

    if (error) {
      console.error('Erro ao carregar modelos:', error);
      setModels([]);
      return;
    }

    setModels(data || []);
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.model_nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'todos' || report.status === filterStatus;
    const matchesEscopo = filterEscopo === 'todos' || report.model_escopo === filterEscopo;

    return matchesSearch && matchesStatus && matchesEscopo;
  });

  const filteredModels = models.filter((model) =>
    model.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatórios Técnicos</h1>
                <p className="text-gray-600">Geração e gerenciamento de relatórios</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Gerar Relatório
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'relatorios'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Relatórios Gerados
            </button>
            <button
              onClick={() => setActiveTab('modelos')}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'modelos'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Modelos
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {activeTab === 'relatorios' && (
              <>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="todos">Todos os Status</option>
                  {Object.keys(STATUS_CONFIG).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterEscopo}
                  onChange={(e) => setFilterEscopo(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="todos">Todos os Escopos</option>
                  {Object.keys(ESCOPO_LABELS).map((escopo) => (
                    <option key={escopo} value={escopo}>
                      {ESCOPO_LABELS[escopo]}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'relatorios' ? (
              filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum relatório encontrado</h3>
                  <p className="text-gray-500">Gere seu primeiro relatório para começar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredReports.map((report) => {
                    const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.rascunho;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div key={report.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{report.model_nome}</h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusConfig.label}
                              </span>
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {ESCOPO_LABELS[report.model_escopo] || report.model_escopo}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                #{report.numero}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(report.gerado_em).toLocaleDateString('pt-BR')}
                              </span>
                              {report.gerado_por_nome && (
                                <>
                                  <span>•</span>
                                  <span>Por: {report.gerado_por_nome}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {report.observacoes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{report.observacoes}</p>
                        )}

                        {report.finalizado_em && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
                            Finalizado em: {new Date(report.finalizado_em).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              filteredModels.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum modelo encontrado</h3>
                  <p className="text-gray-500">Crie modelos de relatórios personalizados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModels.map((model) => (
                    <div key={model.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <FileText className="w-8 h-8 text-purple-500" />
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          v{model.versao}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{model.nome}</h3>
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 mb-3">
                        {ESCOPO_LABELS[model.escopo] || model.escopo}
                      </span>

                      {model.descricao && (
                        <p className="text-sm text-gray-600 line-clamp-3">{model.descricao}</p>
                      )}

                      <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-md transition-all duration-200">
                        Usar Modelo
                      </button>
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
