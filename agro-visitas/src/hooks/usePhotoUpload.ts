import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadOptions {
  visitaId: string;
  atividadeId?: string;
  titulo?: string;
  descricao?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  organizationId: string;
}

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function uploadPhoto(file: File, options: UploadOptions) {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Converter arquivo para base64
      const base64Data = await fileToBase64(file);

      // Chamar edge function
      const { data, error: uploadError } = await supabase.functions.invoke('upload-foto-visita', {
        body: {
          imageData: base64Data,
          fileName: file.name,
          visitaId: options.visitaId,
          atividadeId: options.atividadeId,
          titulo: options.titulo,
          descricao: options.descricao,
          latitude: options.latitude,
          longitude: options.longitude,
          tags: options.tags,
          organizationId: options.organizationId,
        },
      });

      if (uploadError) throw uploadError;

      setUploadProgress(100);
      return data.data;
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da foto');
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function uploadMultiplePhotos(files: File[], options: Omit<UploadOptions, 'titulo' | 'descricao'>) {
    setUploading(true);
    setError(null);
    
    const results = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        const file = files[i];
        const result = await uploadPhoto(file, {
          ...options,
          titulo: file.name,
        });
        results.push(result);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      } catch (err) {
        console.error(`Erro ao fazer upload de ${files[i].name}:`, err);
      }
    }

    setUploading(false);
    return results;
  }

  return {
    uploadPhoto,
    uploadMultiplePhotos,
    uploading,
    uploadProgress,
    error,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
