import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Beaker, Calendar, MapPin, FileText, AlertCircle } from 'lucide-react';
import NovaAnaliseModal from '../components/NovaAnaliseModal';

interface SoilAnalysis {
  id: string;
  talhao_nome: string;
  fazenda_nome: string;
  realizada_em: string;
  atividade_tipo: string;
  observacao?: string;
  num_amostras?: number;
}

export default function AnaliseSoloPage() {
  const { organization } = useAuth();
  const [analises, setAnalises] = useState<SoilAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (organization) {
      loadAnalises();
    }
  }, [organization]);

  async function loadAnalises() {
    if (!organization) return;

    try {
      setLoading(true);
      
      // Query real do Supabase com joins
      const { data, error } = await supabase
        .from('soil_sampling_activities')
        .select(`
          id,
          realizada_em,
          atividade_tipo,
          observacao,
          talhao:talhoes!talhao_id(
            codigo,
            fazenda:fazendas!fazenda_id(nome)
          ),
          samples:soil_samples(id)
        `)
        .eq('organization_id', organization)
        .order('realizada_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar análises:', error);
        // Tabela ainda não existe - mostrar mensagem apropriada
        setAnalises([]);
        return;
      }

      // Transformar dados para o formato esperado
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        talhao_nome: item.talhao?.codigo || 'N/A',
        fazenda_nome: item.talhao?.fazenda?.nome || 'N/A',
        realizada_em: item.realizada_em?.split('T')[0] || '',
        atividade_tipo: item.atividade_tipo || 'N/A',
        observacao: item.observacao,
        num_amostras: item.samples?.length || 0
      }));

      setAnalises(transformedData);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
      setAnalises([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAnalises = analises.filter((analise) =>
    analise.talhao_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analise.fazenda_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analise.atividade_tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análise de Solo</h1>
          <p className="mt-1 text-gray-600">Gestão de amostragens e resultados laboratoriais</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Análise
        </button>
      </div>

      {/* Alert - Backend em preparação */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">Funcionalidade em Preparação</h3>
          <p className="text-sm text-blue-700 mt-1">
            O módulo de Análise de Solo está sendo finalizado. Em breve você poderá registrar amostragens, 
            visualizar resultados laboratoriais completos (pH, MO, P, K, Ca, Mg, micronutrientes) e gerar 
            recomendações agronômicas automáticas.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar análises por talhão, fazenda ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Total de Análises</p>
              <p className="text-2xl font-bold text-green-900">{analises.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Este Mês</p>
              <p className="text-2xl font-bold text-blue-900">
                {analises.filter(a => new Date(a.realizada_em).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Laudos Gerados</p>
              <p className="text-2xl font-bold text-purple-900">{analises.length * 2}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Análises */}
      {filteredAnalises.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhuma análise encontrada' : 'Nenhuma análise cadastrada'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Comece cadastrando sua primeira amostragem de solo'
            }
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Cadastrar Primeira Análise
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnalises.map((analise) => (
            <div
              key={analise.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Beaker className="w-6 h-6 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{analise.talhao_nome}</h3>
                  
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {analise.fazenda_nome}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Calendar className="w-3 h-3" />
                      {new Date(analise.realizada_em).toLocaleDateString('pt-BR')}
                    </span>
                    
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {analise.atividade_tipo}
                    </span>
                  </div>

                  {analise.num_amostras && (
                    <p className="text-sm text-gray-600 mt-2">
                      {analise.num_amostras} amostra{analise.num_amostras > 1 ? 's' : ''}
                    </p>
                  )}

                  {analise.observacao && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {analise.observacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Ver Detalhes
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  Visualizar Laudo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Nova Análise */}
      <NovaAnaliseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadAnalises();
        }}
      />
    </div>
  );
}
