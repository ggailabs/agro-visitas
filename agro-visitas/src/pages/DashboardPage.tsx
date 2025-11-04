import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, TrendingUp, Plus, ArrowUpRight, Activity } from 'lucide-react';
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
    { 
      name: 'Clientes', 
      value: stats.totalClientes, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600', 
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/clientes',
      trend: '+12%'
    },
    { 
      name: 'Fazendas', 
      value: stats.totalFazendas, 
      icon: MapPin, 
      color: 'from-green-500 to-green-600', 
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/fazendas',
      trend: '+8%'
    },
    { 
      name: 'Total de Visitas', 
      value: stats.totalVisitas, 
      icon: Calendar, 
      color: 'from-purple-500 to-purple-600', 
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/visitas',
      trend: '+23%'
    },
    { 
      name: 'Visitas Realizadas', 
      value: stats.visitasRealizadas, 
      icon: TrendingUp, 
      color: 'from-emerald-500 to-emerald-600', 
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      link: '/visitas',
      trend: '+18%'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="spinner w-12 h-12"></div>
          <Activity className="w-6 h-6 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-base text-gray-600">
            Visão geral das suas atividades agrícolas
          </p>
        </div>
        <Link
          to="/visitas/nova"
          className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-elevated-lg transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Visita</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Stats Grid - Modernized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="group relative bg-white rounded-2xl shadow-soft hover:shadow-elevated-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Gradient background accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="relative p-6">
              {/* Icon */}
              <div className={`inline-flex p-3 ${stat.bgColor} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>

              {/* Stats */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-gray-900 tracking-tight">
                    {stat.value}
                  </p>
                  {/* Trend indicator */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </span>
                </div>
              </div>

              {/* Hover arrow */}
              <ArrowUpRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
            </div>
          </Link>
        ))}
      </div>

      {/* Visitas Recentes - Modernized */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Visitas Recentes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Últimas atividades registradas
            </p>
          </div>
          <Link 
            to="/visitas" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm group transition-colors"
          >
            <span>Ver todas</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="p-6">
          {recentVisitas.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-4">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma visita registrada
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Comece criando sua primeira visita técnica para acompanhar suas atividades
              </p>
              <Link
                to="/visitas/nova"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-elevated-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Criar primeira visita</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVisitas.map((visita, index) => (
                <Link
                  key={visita.id}
                  to={`/visitas/${visita.id}`}
                  className="group block p-5 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-soft transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                            {visita.titulo}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          {visita.cultura && (
                            <p className="text-sm text-gray-500 mt-1">
                              Cultura: <span className="font-medium">{visita.cultura}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                          visita.status === 'realizada'
                            ? 'bg-success-100 text-success-700'
                            : visita.status === 'planejada'
                            ? 'bg-info-100 text-info-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {visita.status}
                      </span>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
