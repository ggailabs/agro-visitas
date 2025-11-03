import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TrendingUp, Users, Calendar, Target, BarChart3 } from 'lucide-react';

export default function InsightsPage() {
  const { organization } = useAuth();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      loadInsights();
    }
  }, [organization]);

  async function loadInsights() {
    if (!organization) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('analise-dados-visitas', {
        body: {
          organizationId: organization.id,
          periodo: 'todos',
          tipoAnalise: 'completa',
        },
      });

      if (error) throw error;
      
      if (data?.data?.insights) {
        setInsights(data.data.insights);
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
          <p className="mt-1 text-gray-600">Análise inteligente dos seus dados</p>
        </div>
        <button
          onClick={loadInsights}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <TrendingUp className="w-5 h-5" />
          Atualizar Análise
        </button>
      </div>

      {insights && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total de Visitas</span>
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{insights.resumo.totalVisitas}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Visitas Realizadas</span>
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{insights.resumo.visitasRealizadas}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Clientes Ativos</span>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{insights.resumo.totalClientes}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Levantamentos</span>
                <BarChart3 className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{insights.resumo.totalLevantamentos}</p>
            </div>
          </div>

          {/* Top Clientes */}
          {insights.topClientes && insights.topClientes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Clientes</h2>
              <div className="space-y-3">
                {insights.topClientes.map((cliente: any, index: number) => (
                  <div key={cliente.clienteId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{cliente.nomeCliente}</p>
                        <p className="text-sm text-gray-600">{cliente.totalVisitas} visitas</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-semibold">
                      {cliente.visitasRealizadas} realizadas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações */}
          {insights.recomendacoes && insights.recomendacoes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recomendações</h2>
              <div className="space-y-3">
                {insights.recomendacoes.map((rec: any, index: number) => (
                  <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-1">{rec.titulo}</h3>
                    <p className="text-sm text-blue-700">{rec.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alertas */}
          {insights.alertas && insights.alertas.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Alertas</h2>
              <div className="space-y-3">
                {insights.alertas.map((alerta: any, index: number) => (
                  <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-1">{alerta.titulo}</h3>
                    <p className="text-sm text-yellow-700">{alerta.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!insights && !loading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado disponível para análise</p>
        </div>
      )}
    </div>
  );
}
