import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { VisitaTecnica } from '../types/database';
import { Plus, Search, Calendar, MapPin, User, CheckCircle, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function VisitasPage() {
  const { organization } = useAuth();
  const location = useLocation();
  const [visitas, setVisitas] = useState<VisitaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (organization) {
      loadVisitas();
    }
  }, [organization]);

  useEffect(() => {
    // Verificar se há mensagem de sucesso no state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Limpar o state para evitar mostrar a mensagem novamente
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
        .order('data_visita', { ascending: false });

      if (error) throw error;
      setVisitas(data || []);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredVisitas = visitas.filter((visita) => {
    const matchesSearch = visita.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visita.cultura?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todas' || visita.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de Sucesso */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitas Técnicas</h1>
          <p className="mt-1 text-gray-600">Gestão e acompanhamento de visitas</p>
        </div>
        <Link
          to="/visitas/nova"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Visita
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar visitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['todas', 'planejada', 'realizada', 'cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Visitas List */}
      {filteredVisitas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'todas'
              ? 'Nenhuma visita encontrada com os filtros selecionados'
              : 'Nenhuma visita registrada ainda'}
          </p>
          <Link
            to="/visitas/nova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Criar primeira visita
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVisitas.map((visita) => (
            <div
              key={visita.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                // TODO: Implementar navegação para página de detalhes da visita
                console.log('Detalhes da visita:', visita.id);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">{visita.titulo}</h3>
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

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>

                {visita.cultura && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Cultura: {visita.cultura}
                  </div>
                )}

                {visita.tipo_visita && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Tipo: {visita.tipo_visita}
                  </div>
                )}
              </div>

              {visita.resumo && (
                <p className="mt-4 text-sm text-gray-600 line-clamp-2">{visita.resumo}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
