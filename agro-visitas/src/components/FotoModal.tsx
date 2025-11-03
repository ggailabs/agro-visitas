import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { VisitaFoto } from '../types/database';

interface FotoModalProps {
  fotos: VisitaFoto[];
  fotoAtual: number;
  isOpen: boolean;
  onClose: () => void;
  onFotoChange: (index: number) => void;
}

export default function FotoModal({ fotos, fotoAtual, isOpen, onClose, onFotoChange }: FotoModalProps) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setLoading(true);
    }
  }, [isOpen, fotoAtual]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (fotoAtual > 0) {
            onFotoChange(fotoAtual - 1);
          }
          break;
        case 'ArrowRight':
          if (fotoAtual < fotos.length - 1) {
            onFotoChange(fotoAtual + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, fotoAtual, fotos.length, onClose, onFotoChange]);

  if (!isOpen || fotos.length === 0) return null;

  const foto = fotos[fotoAtual];

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = foto.url;
    link.download = foto.file_name || 'foto-visita.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-medium">
              {foto.titulo || foto.file_name || 'Foto da visita'}
            </h3>
            <p className="text-sm text-gray-300">
              {fotoAtual + 1} de {fotos.length}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm px-2">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
              title="Baixar foto"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      {fotos.length > 1 && (
        <>
          <button
            onClick={() => fotoAtual > 0 && onFotoChange(fotoAtual - 1)}
            disabled={fotoAtual === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => fotoAtual < fotos.length - 1 && onFotoChange(fotoAtual + 1)}
            disabled={fotoAtual === fotos.length - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Próxima foto"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div className="flex items-center justify-center w-full h-full p-16">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        <img
          src={foto.url}
          alt={foto.titulo || 'Foto da visita'}
          className="max-w-full max-h-full object-contain transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Thumbnails */}
      {fotos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex justify-center gap-2 overflow-x-auto">
            {fotos.map((f, index) => (
              <button
                key={f.id}
                onClick={() => onFotoChange(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === fotoAtual
                    ? 'border-white'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={f.url}
                  alt={f.titulo || 'Thumbnail'}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Background Click to Close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}