import React from 'react';
import { Link } from 'react-router-dom';
import { VisitaTecnica, VisitaFoto, Cliente } from '../types/database';
import { 
  Calendar, 
  User, 
  Camera, 
  FileText, 
  MapPin,
  Clock,
  Badge,
  Eye
} from 'lucide-react';

interface VisitCardProps {
  visita: VisitaTecnica;
  fotos: VisitaFoto[];
  cliente?: Cliente;
  isRecent?: boolean;
}

export default function VisitCard({ visita, fotos, cliente, isRecent }: VisitCardProps) {
  const previewFotos = fotos.slice(0, 4);
  const totalFotos = fotos.length;
  
  // Verificar se a visita é recente (últimas 72 horas)
  const visitaDate = new Date(visita.data_visita);
  const agora = new Date();
  const diferencaHoras = (agora.getTime() - visitaDate.getTime()) / (1000 * 3600);
  const isNovaVisita = diferencaHoras <= 72;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'planejada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelada':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTipoVisitaColor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'inspeção':
        return 'bg-orange-100 text-orange-700';
      case 'consultoria':
        return 'bg-purple-100 text-purple-700';
      case 'monitoramento':
        return 'bg-teal-100 text-teal-700';
      case 'treinamento':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-green-200">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors">
                <Link to={`/visitas/${visita.id}`}>
                  {visita.titulo}
                </Link>
              </h3>
              {isNovaVisita && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                  Nova
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              
              {visita.hora_inicio && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{visita.hora_inicio}</span>
                  {visita.hora_fim && <span> - {visita.hora_fim}</span>}
                </div>
              )}

              {cliente && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{cliente.nome}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(visita.status || '')}`}>
                {visita.status}
              </span>
              
              {visita.tipo_visita && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTipoVisitaColor(visita.tipo_visita)}`}>
                  {visita.tipo_visita}
                </span>
              )}

              {visita.cultura && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <MapPin className="w-3 h-3 mr-1" />
                  {visita.cultura}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Resumo */}
        {visita.resumo && (
          <div className="mb-4">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {visita.resumo}
            </p>
          </div>
        )}

        {/* Dados Técnicos */}
        {(visita.objetivo || visita.recomendacoes) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            {visita.objetivo && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Objetivo:</span>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">{visita.objetivo}</p>
              </div>
            )}
            {visita.recomendacoes && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recomendações:</span>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">{visita.recomendacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview de Fotos */}
      {previewFotos.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Camera className="w-4 h-4" />
              Fotos da Visita
            </span>
            {totalFotos > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {totalFotos} foto{totalFotos > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {previewFotos.map((foto, index) => (
              <div key={foto.id} className="relative group">
                <img
                  src={foto.url}
                  alt={foto.titulo || `Foto ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  loading="lazy"
                />
                {index === 3 && totalFotos > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      +{totalFotos - 4}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {visita.clima && (
              <span>Clima: {visita.clima}</span>
            )}
            {visita.temperatura && (
              <span>Temp: {visita.temperatura}°C</span>
            )}
            {visita.safra && (
              <span>Safra: {visita.safra}</span>
            )}
          </div>
          
          <Link
            to={`/visitas/${visita.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}