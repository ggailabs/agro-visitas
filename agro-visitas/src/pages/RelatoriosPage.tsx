import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRelatoriosPDF } from '../hooks/useRelatoriosPDF';
import { VisitaTecnica } from '../types/database';

export default function RelatoriosPage() {
  const { organization } = useAuth();
  const { gerarRelatorioVisita, generating } = useRelatoriosPDF();
  const [visitas, setVisitas] = useState<VisitaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisita, setSelectedVisita] = useState('');

  useEffect(() => {
    if (organization) {
      loadVisitas();
    }
  }, [organization]);

  async function loadVisitas() {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visitas_tecnicas')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'realizada')
        .order('data_visita', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVisitas(data || []);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGerarRelatorio() {
    if (!selectedVisita || !organization) return;

    try {
      await gerarRelatorioVisita(selectedVisita, organization.id);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-1 text-gray-600">Gere relatórios profissionais de visitas técnicas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gerar Relatório em PDF</h3>
            <p className="text-gray-600">
              Selecione uma visita técnica para gerar um relatório profissional em PDF
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a Visita
              </label>
              <select
                value={selectedVisita}
                onChange={(e) => setSelectedVisita(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Escolha uma visita realizada...</option>
                {visitas.map(visita => (
                  <option key={visita.id} value={visita.id}>
                    {visita.titulo} - {new Date(visita.data_visita).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGerarRelatorio}
              disabled={!selectedVisita || generating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando Relatório...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Gerar Relatório PDF
                </>
              )}
            </button>
          </div>

          {visitas.length === 0 && !loading && (
            <div className="text-center py-6 text-gray-600">
              Nenhuma visita realizada disponível para gerar relatórios
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Relatório Individual</h3>
          <p className="text-sm text-gray-600">Relatório detalhado de uma visita específica com todas as informações coletadas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Informações Incluídas</h3>
          <p className="text-sm text-gray-600">Dados do cliente, fazenda, observações técnicas, recomendações e estatísticas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Formato Profissional</h3>
          <p className="text-sm text-gray-600">PDF estruturado com cabeçalho, rodapé e organização clara das informações</p>
        </div>
      </div>
    </div>
  );
}

