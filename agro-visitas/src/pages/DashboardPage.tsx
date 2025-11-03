import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { organization } = useAuth();
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalFazendas: 0,
    totalVisitas: 0,
    visitasRealizadas: 0,
    visitasPlanejadas: 0,
  });
  const [recentVisitas, setRecentVisitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      loadDashboardData();
    }
  }, [organization]);

  async function loadDashboardData() {
    if (!organization) return;

    try {
      setLoading(true);

      // Carregar estatísticas
      const [clientesRes, fazendasRes, visitasRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('is_active', true),
        supabase
          .from('fazendas')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('is_active', true),
        supabase
          .from('visitas_tecnicas')
          .select('id, status', { count: 'exact' })
          .eq('organization_id', organization.id),
      ]);

      const visitas = visitasRes.data || [];
      
      setStats({
        totalClientes: clientesRes.count || 0,
        totalFazendas: fazendasRes.count || 0,
        totalVisitas: visitasRes.count || 0,
        visitasRealizadas: visitas.filter(v => v.status === 'realizada').length,
        visitasPlanejadas: visitas.filter(v => v.status === 'planejada').length,
      });

      // Carregar visitas recentes
      const { data: visitasData } = await supabase
        .from('visitas_tecnicas')
        .select('*')
        .eq('organization_id', organization.id)
        .order('data_visita', { ascending: false })
        .limit(5);

      setRecentVisitas(visitasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { name: 'Clientes', value: stats.totalClientes, icon: Users, color: 'bg-blue-500', link: '/clientes' },
    { name: 'Fazendas', value: stats.totalFazendas, icon: MapPin, color: 'bg-green-500', link: '/fazendas' },
    { name: 'Total de Visitas', value: stats.totalVisitas, icon: Calendar, color: 'bg-purple-500', link: '/visitas' },
    { name: 'Visitas Realizadas', value: stats.visitasRealizadas, icon: TrendingUp, color: 'bg-emerald-500', link: '/visitas' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Visão geral das suas atividades</p>
        </div>
        <Link
          to="/visitas/nova"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Visita
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Visitas Recentes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Visitas Recentes</h2>
          <Link to="/visitas" className="text-green-600 hover:text-green-700 font-medium text-sm">
            Ver todas
          </Link>
        </div>

        {recentVisitas.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma visita registrada ainda</p>
            <Link
              to="/visitas/nova"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Criar primeira visita
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentVisitas.map((visita) => (
              <Link
                key={visita.id}
                to={`/visitas/${visita.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{visita.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {visita.cultura && (
                      <p className="text-sm text-gray-500 mt-1">Cultura: {visita.cultura}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      visita.status === 'realizada'
                        ? 'bg-green-100 text-green-700'
                        : visita.status === 'planejada'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {visita.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
