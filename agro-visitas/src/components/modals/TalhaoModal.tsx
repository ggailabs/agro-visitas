import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Fazenda, Talhao } from '../../types/database';

interface TalhaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTalhao?: Talhao;
}

export default function TalhaoModal({ isOpen, onClose, onSuccess, editingTalhao }: TalhaoModalProps) {
  const { organization, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);

  const [formData, setFormData] = useState({
    fazenda_id: editingTalhao?.fazenda_id || '',
    nome: editingTalhao?.nome || '',
    area: editingTalhao?.area || '',
    unidade_area: editingTalhao?.unidade_area || 'hectares',
    cultura_atual: editingTalhao?.cultura_atual || '',
    safra_atual: editingTalhao?.safra_atual || '',
    tipo_solo: editingTalhao?.tipo_solo || '',
    topografia: editingTalhao?.topografia || '',
    sistema_irrigacao: editingTalhao?.sistema_irrigacao || '',
    observacoes: editingTalhao?.observacoes || '',
  });

  useEffect(() => {
    if (isOpen && organization) {
      loadFazendas();
    }
  }, [isOpen, organization]);

  // Atualizar formData quando editingTalhao muda
  useEffect(() => {
    setFormData({
      fazenda_id: editingTalhao?.fazenda_id || '',
      nome: editingTalhao?.nome || '',
      area: editingTalhao?.area?.toString() || '',
      unidade_area: editingTalhao?.unidade_area || 'hectares',
      cultura_atual: editingTalhao?.cultura_atual || '',
      safra_atual: editingTalhao?.safra_atual || '',
      tipo_solo: editingTalhao?.tipo_solo || '',
      topografia: editingTalhao?.topografia || '',
      sistema_irrigacao: editingTalhao?.sistema_irrigacao || '',
      observacoes: editingTalhao?.observacoes || '',
    });
  }, [editingTalhao]);

  async function loadFazendas() {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setFazendas(data || []);
    } catch (err) {
      console.error('Erro ao carregar fazendas:', err);
    }
  }

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organization || !user) return;

    setLoading(true);
    setError('');

    try {
      const talhaoData = {
        ...formData,
        area: formData.area ? parseFloat(formData.area.toString()) : null,
        organization_id: organization.id,
        created_by: user.id,
        is_active: true,
      };

      if (editingTalhao) {
        const { error: updateError } = await supabase
          .from('talhoes')
          .update(talhaoData)
          .eq('id', editingTalhao.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('talhoes')
          .insert(talhaoData);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar talhão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingTalhao ? 'Editar Talhão' : 'Novo Talhão'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fazenda *
              </label>
              <select
                name="fazenda_id"
                required
                value={formData.fazenda_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione uma fazenda...</option>
                {fazendas.map(fazenda => (
                  <option key={fazenda.id} value={fazenda.id}>
                    {fazenda.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Talhão *
              </label>
              <input
                type="text"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Talhão 1, Gleba A, Campo Norte"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <input
                type="number"
                step="0.01"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade de Área
              </label>
              <select
                name="unidade_area"
                value={formData.unidade_area}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="hectares">Hectares (ha)</option>
                <option value="alqueires">Alqueires</option>
                <option value="acres">Acres</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultura Atual
              </label>
              <input
                type="text"
                name="cultura_atual"
                value={formData.cultura_atual}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Soja, Milho, Café"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safra Atual
              </label>
              <input
                type="text"
                name="safra_atual"
                value={formData.safra_atual}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: 2024/2025, Verão 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Solo
              </label>
              <select
                name="tipo_solo"
                value={formData.tipo_solo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Latossolo">Latossolo</option>
                <option value="Argissolo">Argissolo</option>
                <option value="Neossolo">Neossolo</option>
                <option value="Nitossolo">Nitossolo</option>
                <option value="Cambissolo">Cambissolo</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topografia
              </label>
              <select
                name="topografia"
                value={formData.topografia}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Plano">Plano (0-3%)</option>
                <option value="Suave ondulado">Suave ondulado (3-8%)</option>
                <option value="Ondulado">Ondulado (8-20%)</option>
                <option value="Forte ondulado">Forte ondulado (20-45%)</option>
                <option value="Montanhoso">Montanhoso (&gt;45%)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sistema de Irrigação
              </label>
              <select
                name="sistema_irrigacao"
                value={formData.sistema_irrigacao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Sequeiro">Sequeiro (sem irrigação)</option>
                <option value="Aspersão">Aspersão</option>
                <option value="Gotejamento">Gotejamento</option>
                <option value="Microaspersão">Microaspersão</option>
                <option value="Pivô central">Pivô central</option>
                <option value="Inundação">Inundação</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Informações adicionais sobre o talhão"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : editingTalhao ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}