import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NovaInspeccaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Talhao {
  id: string;
  codigo: string;
  fazenda: {
    nome: string;
  };
}

interface Cultura {
  id: string;
  nome: string;
}

export default function NovaInspeccaoModal({ isOpen, onClose, onSuccess }: NovaInspeccaoModalProps) {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [culturas, setCulturas] = useState<Cultura[]>([]);
  
  const [formData, setFormData] = useState({
    talhao_id: '',
    cultura_id: '',
    data_inspecao: new Date().toISOString().split('T')[0],
    tipo_inspecao: 'fitossanidade',
    estagio_fenologico: '',
    observacoes: '',
    // Fenologia
    altura_plantas_cm: '',
    uniformidade: 'boa',
    // Fitossanidade
    pragas_detectadas: [] as string[],
    doencas_detectadas: [] as string[],
    severidade_geral: 'baixa',
    // Ações recomendadas
    acoes_recomendadas: ''
  });

  const [statusMessage, setStatusMessage] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen && organization) {
      loadTalhoes();
      loadCulturas();
    }
  }, [isOpen, organization]);

  async function loadTalhoes() {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('talhoes')
        .select(`
          id,
          codigo,
          fazendas!inner(nome)
        `)
        .eq('fazendas.org_id', organization)
        .order('codigo');

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        codigo: item.codigo,
        fazenda: item.fazendas
      }));
      
      setTalhoes(transformedData);
    } catch (error) {
      console.error('Erro ao carregar talhões:', error);
    }
  }

  async function loadCulturas() {
    try {
      const { data, error } = await supabase
        .from('culturas')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setCulturas(data || []);
    } catch (error) {
      console.error('Erro ao carregar culturas:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.talhao_id || !formData.cultura_id) {
      setStatusMessage({
        show: true,
        type: 'error',
        message: 'Por favor, preencha todos os campos obrigatórios'
      });
      return;
    }

    setLoading(true);

    try {
      if (!organization) throw new Error('Organização não encontrada');

      // Criar inspeção
      const { data: inspection, error: inspectionError } = await supabase
        .from('culture_inspections')
        .insert({
          org_id: organization,
          talhao_id: formData.talhao_id,
          cultura_id: formData.cultura_id,
          data_inspecao: formData.data_inspecao,
          tipo_inspecao: formData.tipo_inspecao,
          observacoes: formData.observacoes
        })
        .select()
        .single();

      if (inspectionError) throw inspectionError;

      // Criar observação fenológica (se aplicável)
      if (formData.tipo_inspecao === 'fenologia' || formData.estagio_fenologico) {
        await supabase.from('phenology_observations').insert({
          inspection_id: inspection.id,
          estagio_fenologico: formData.estagio_fenologico,
          altura_plantas_cm: formData.altura_plantas_cm ? parseFloat(formData.altura_plantas_cm) : null,
          uniformidade: formData.uniformidade,
          observacoes: formData.observacoes
        });
      }

      // Registrar pragas detectadas
      if (formData.pragas_detectadas.length > 0) {
        const pragasObservations = formData.pragas_detectadas.map(praga => ({
          inspection_id: inspection.id,
          praga_nome: praga,
          nivel_infestacao: formData.severidade_geral,
          observacoes: formData.observacoes
        }));

        await supabase.from('pest_observations').insert(pragasObservations);
      }

      // Registrar doenças detectadas
      if (formData.doencas_detectadas.length > 0) {
        const doencasObservations = formData.doencas_detectadas.map(doenca => ({
          inspection_id: inspection.id,
          doenca_nome: doenca,
          severidade: formData.severidade_geral,
          observacoes: formData.observacoes
        }));

        await supabase.from('disease_observations').insert(doencasObservations);
      }

      setStatusMessage({
        show: true,
        type: 'success',
        message: 'Inspeção criada com sucesso!'
      });

      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar inspeção:', error);
      setStatusMessage({
        show: true,
        type: 'error',
        message: error.message || 'Erro ao criar inspeção'
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      talhao_id: '',
      cultura_id: '',
      data_inspecao: new Date().toISOString().split('T')[0],
      tipo_inspecao: 'fitossanidade',
      estagio_fenologico: '',
      observacoes: '',
      altura_plantas_cm: '',
      uniformidade: 'boa',
      pragas_detectadas: [],
      doencas_detectadas: [],
      severidade_geral: 'baixa',
      acoes_recomendadas: ''
    });
    setStatusMessage({ show: false, type: 'success', message: '' });
  }

  function togglePraga(praga: string) {
    setFormData(prev => ({
      ...prev,
      pragas_detectadas: prev.pragas_detectadas.includes(praga)
        ? prev.pragas_detectadas.filter(p => p !== praga)
        : [...prev.pragas_detectadas, praga]
    }));
  }

  function toggleDoenca(doenca: string) {
    setFormData(prev => ({
      ...prev,
      doencas_detectadas: prev.doencas_detectadas.includes(doenca)
        ? prev.doencas_detectadas.filter(d => d !== doenca)
        : [...prev.doencas_detectadas, doenca]
    }));
  }

  if (!isOpen) return null;

  const pragasComuns = ['Lagarta', 'Percevejo', 'Mosca-branca', 'Pulgão', 'Ácaro'];
  const doencasComuns = ['Ferrugem', 'Mancha-angular', 'Oídio', 'Mofo-branco', 'Murcha'];
  const estagiosFenologicos = [
    'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6',
    'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Nova Inspeção de Cultura</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Talhão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talhão *
                </label>
                <select
                  required
                  value={formData.talhao_id}
                  onChange={(e) => setFormData({ ...formData, talhao_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  {talhoes.map((talhao) => (
                    <option key={talhao.id} value={talhao.id}>
                      {talhao.codigo} - {talhao.fazenda?.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cultura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cultura *
                </label>
                <select
                  required
                  value={formData.cultura_id}
                  onChange={(e) => setFormData({ ...formData, cultura_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  {culturas.map((cultura) => (
                    <option key={cultura.id} value={cultura.id}>
                      {cultura.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Inspeção *
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_inspecao}
                  onChange={(e) => setFormData({ ...formData, data_inspecao: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Inspeção
                </label>
                <select
                  value={formData.tipo_inspecao}
                  onChange={(e) => setFormData({ ...formData, tipo_inspecao: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="fitossanidade">Fitossanidade</option>
                  <option value="fenologia">Fenologia</option>
                  <option value="geral">Geral</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fenologia */}
          {(formData.tipo_inspecao === 'fenologia' || formData.tipo_inspecao === 'geral') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Dados Fenológicos</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estágio Fenológico
                  </label>
                  <select
                    value={formData.estagio_fenologico}
                    onChange={(e) => setFormData({ ...formData, estagio_fenologico: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    {estagiosFenologicos.map(estagio => (
                      <option key={estagio} value={estagio}>{estagio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura Média (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.altura_plantas_cm}
                    onChange={(e) => setFormData({ ...formData, altura_plantas_cm: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uniformidade
                  </label>
                  <select
                    value={formData.uniformidade}
                    onChange={(e) => setFormData({ ...formData, uniformidade: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="excelente">Excelente</option>
                    <option value="boa">Boa</option>
                    <option value="regular">Regular</option>
                    <option value="ruim">Ruim</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Fitossanidade */}
          {(formData.tipo_inspecao === 'fitossanidade' || formData.tipo_inspecao === 'geral') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Fitossanidade</h3>
              
              {/* Pragas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pragas Detectadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {pragasComuns.map(praga => (
                    <button
                      key={praga}
                      type="button"
                      onClick={() => togglePraga(praga)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.pragas_detectadas.includes(praga)
                          ? 'bg-orange-100 text-orange-800 border-2 border-orange-500'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      {praga}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doenças */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doenças Detectadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {doencasComuns.map(doenca => (
                    <button
                      key={doenca}
                      type="button"
                      onClick={() => toggleDoenca(doenca)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.doencas_detectadas.includes(doenca)
                          ? 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      {doenca}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severidade */}
              {(formData.pragas_detectadas.length > 0 || formData.doencas_detectadas.length > 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severidade Geral
                  </label>
                  <select
                    value={formData.severidade_geral}
                    onChange={(e) => setFormData({ ...formData, severidade_geral: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações e Recomendações
            </label>
            <textarea
              rows={4}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Descreva os detalhes da inspeção, ações recomendadas..."
            />
          </div>

          {/* Status Message */}
          {statusMessage.show && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm font-medium">{statusMessage.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Inspeção'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
