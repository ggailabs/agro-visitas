import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NovaAnaliseModalProps {
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

export default function NovaAnaliseModal({ isOpen, onClose, onSuccess }: NovaAnaliseModalProps) {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [formData, setFormData] = useState({
    talhao_id: '',
    data_coleta: new Date().toISOString().split('T')[0],
    metodo_amostragem: 'grid',
    profundidade_cm: 20,
    num_amostras: 1,
    observacoes: ''
  });

  const [uploadStatus, setUploadStatus] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  useEffect(() => {
    if (isOpen && organization) {
      loadTalhoes();
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.talhao_id) {
      setUploadStatus({
        show: true,
        type: 'error',
        message: 'Por favor, selecione um talhão'
      });
      return;
    }

    setLoading(true);

    try {
      if (selectedFile && previewUrl) {
        // Processar via OCR Edge Function
        await processWithOCR();
      } else {
        // Criar análise manual
        await createManualAnalysis();
      }

      setUploadStatus({
        show: true,
        type: 'success',
        message: 'Análise criada com sucesso!'
      });

      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar análise:', error);
      setUploadStatus({
        show: true,
        type: 'error',
        message: error.message || 'Erro ao criar análise'
      });
    } finally {
      setLoading(false);
    }
  }

  async function processWithOCR() {
    setUploading(true);

    try {
      const selectedTalhao = talhoes.find(t => t.id === formData.talhao_id);
      
      const { data, error } = await supabase.functions.invoke('process-soil-report', {
        body: {
          imageData: previewUrl,
          fileName: selectedFile?.name,
          talhaoId: formData.talhao_id,
          fazendaNome: selectedTalhao?.fazenda?.nome || ''
        }
      });

      if (error) throw error;

      console.log('OCR processado:', data);
    } catch (error: any) {
      throw new Error('Erro ao processar laudo: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function createManualAnalysis() {
    if (!organization) throw new Error('Organização não encontrada');

    // Criar atividade de amostragem
    const { data: activity, error: activityError } = await supabase
      .from('soil_sampling_activities')
      .insert({
        org_id: organization,
        talhao_id: formData.talhao_id,
        data_coleta: formData.data_coleta,
        metodo_amostragem: formData.metodo_amostragem,
        observacoes: formData.observacoes
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Criar amostras
    const samples = [];
    for (let i = 0; i < formData.num_amostras; i++) {
      samples.push({
        activity_id: activity.id,
        identificador: `AMOSTRA-${String(i + 1).padStart(3, '0')}`,
        profundidade_cm: formData.profundidade_cm
      });
    }

    const { error: samplesError } = await supabase
      .from('soil_samples')
      .insert(samples);

    if (samplesError) throw samplesError;
  }

  function resetForm() {
    setFormData({
      talhao_id: '',
      data_coleta: new Date().toISOString().split('T')[0],
      metodo_amostragem: 'grid',
      profundidade_cm: 20,
      num_amostras: 1,
      observacoes: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadStatus({ show: false, type: 'success', message: '' });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Nova Análise de Solo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Upload de Laudo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Laudo de Análise (Opcional - OCR)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <label className="cursor-pointer">
                    <span className="text-green-600 hover:text-green-700 font-medium">
                      Clique para fazer upload
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG ou PDF (máx. 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

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
              <option value="">Selecione um talhão</option>
              {talhoes.map((talhao) => (
                <option key={talhao.id} value={talhao.id}>
                  {talhao.codigo} - {talhao.fazenda?.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data de Coleta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Coleta *
            </label>
            <input
              type="date"
              required
              value={formData.data_coleta}
              onChange={(e) => setFormData({ ...formData, data_coleta: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Método de Amostragem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Amostragem
            </label>
            <select
              value={formData.metodo_amostragem}
              onChange={(e) => setFormData({ ...formData, metodo_amostragem: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="grid">Grid</option>
              <option value="zigue-zague">Zigue-Zague</option>
              <option value="aleatorio">Aleatório</option>
              <option value="representativo">Representativo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Profundidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profundidade (cm)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.profundidade_cm}
                onChange={(e) => setFormData({ ...formData, profundidade_cm: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Número de Amostras */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Amostras
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.num_amostras}
                onChange={(e) => setFormData({ ...formData, num_amostras: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Informações adicionais sobre a coleta..."
            />
          </div>

          {/* Status Message */}
          {uploadStatus.show && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                uploadStatus.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="text-sm font-medium">{uploadStatus.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              disabled={loading || uploading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? 'Processando OCR...' : 'Criando...'}
                </>
              ) : (
                'Criar Análise'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
