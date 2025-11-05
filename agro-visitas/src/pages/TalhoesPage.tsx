import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Talhao, Fazenda } from '../types/database';
import { Plus, Search, Grid3x3, Layers, MapPin, Edit } from 'lucide-react';
import TalhaoModal from '../components/modals/TalhaoModal';

export default function TalhoesPage() {
  const { organization } = useAuth();
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTalhao, setEditingTalhao] = useState<Talhao | null>(null);

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization]);

  async function loadData() {
    if (!organization) return;

    try {
      setLoading(true);
      
      // Carregar talhões
      const { data: talhoesData, error: talhoesError } = await supabase
        .from('talhoes')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('nome', { ascending: true });

      if (talhoesError) throw talhoesError;

      // Carregar fazendas para exibir o nome
      const { data: fazendasData, error: fazendasError } = await supabase
        .from('fazendas')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (fazendasError) throw fazendasError;

      setTalhoes(talhoesData || []);
      setFazendas(fazendasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const getFazendaNome = (fazendaId: string) => {
    const fazenda = fazendas.find(f => f.id === fazendaId);
    return fazenda?.nome || 'Fazenda não encontrada';
  };

  const filteredTalhoes = talhoes.filter((talhao) =>
    talhao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getFazendaNome(talhao.fazenda_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    talhao.cultura_atual?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Talhões</h1>
          <p className="mt-1 text-gray-600">Gestão de talhões e divisões das fazendas</p>
        </div>
        <button 
          onClick={() => {
            setEditingTalhao(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Talhão
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar talhões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredTalhoes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Nenhum talhão encontrado' : 'Nenhum talhão cadastrado ainda'}
          </p>
          {!searchTerm && fazendas.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Você precisa cadastrar pelo menos uma fazenda antes de criar talhões.
            </p>
          )}
          <button 
            onClick={() => setModalOpen(true)}
            disabled={fazendas.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Cadastrar primeiro talhão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalhoes.map((talhao) => (
            <div
              key={talhao.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Grid3x3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{talhao.nome}</h3>
                  
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {getFazendaNome(talhao.fazenda_id)}
                  </p>

                  {talhao.area && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      {talhao.area} {talhao.unidade_area || 'hectares'}
                    </p>
                  )}

                  {talhao.cultura_atual && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {talhao.cultura_atual}
                      </span>
                    </div>
                  )}

                  {talhao.safra_atual && (
                    <p className="text-xs text-gray-500 mt-1">
                      Safra: {talhao.safra_atual}
                    </p>
                  )}

                  {talhao.tipo_solo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Solo: {talhao.tipo_solo}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingTalhao(talhao);
                    setModalOpen(true);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar talhão"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TalhaoModal 
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTalhao(null);
        }}
        onSuccess={() => {
          loadData();
          setModalOpen(false);
          setEditingTalhao(null);
        }}
        editingTalhao={editingTalhao}
      />
    </div>
  );
}