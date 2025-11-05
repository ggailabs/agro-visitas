import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Fazenda } from '../types/database';
import { Plus, Search, MapPin, Layers, Calendar, Edit } from 'lucide-react';
import FazendaModal from '../components/modals/FazendaModal';
import { Link } from 'react-router-dom';

export default function FazendasPage() {
  const { organization } = useAuth();
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFazenda, setEditingFazenda] = useState<Fazenda | null>(null);

  useEffect(() => {
    if (organization) {
      loadFazendas();
    }
  }, [organization]);

  async function loadFazendas() {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setFazendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar fazendas:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredFazendas = fazendas.filter((fazenda) =>
    fazenda.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fazenda.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fazendas</h1>
          <p className="mt-1 text-gray-600">Gestão de propriedades rurais</p>
        </div>
        <button 
          onClick={() => {
            setEditingFazenda(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Fazenda
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar fazendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredFazendas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Nenhuma fazenda encontrada' : 'Nenhuma fazenda cadastrada ainda'}
          </p>
          <button 
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Cadastrar primeira fazenda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFazendas.map((fazenda) => (
            <div
              key={fazenda.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{fazenda.nome}</h3>
                  {fazenda.area_total && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      {fazenda.area_total} {fazenda.unidade_area || 'hectares'}
                    </p>
                  )}
                  {(fazenda.cidade || fazenda.estado) && (
                    <p className="text-sm text-gray-500 mt-2">
                      {fazenda.cidade}{fazenda.estado && `, ${fazenda.estado}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingFazenda(fazenda);
                    setModalOpen(true);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar fazenda"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              {/* Botão Timeline */}
              <div className="pt-4 border-t border-gray-100">
                <Link
                  to={`/fazendas/${fazenda.id}/timeline`}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Ver Timeline de Visitas
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <FazendaModal 
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingFazenda(null);
        }}
        onSuccess={() => {
          loadFazendas();
          setModalOpen(false);
          setEditingFazenda(null);
        }}
        editingFazenda={editingFazenda}
      />
    </div>
  );
}
