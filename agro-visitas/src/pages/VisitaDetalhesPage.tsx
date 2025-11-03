import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { VisitaTecnica, VisitaFoto, Cliente, Fazenda, Talhao } from '../types/database';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Thermometer, 
  Cloud, 
  FileText,
  Camera,
  Download,
  Eye
} from 'lucide-react';

export default function VisitaDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visita, setVisita] = useState<VisitaTecnica | null>(null);
  const [fotos, setFotos] = useState<VisitaFoto[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const [talhao, setTalhao] = useState<Talhao | null>(null);

  useEffect(() => {
    if (id && organization) {
      loadVisitaDetails();
    }
  }, [id, organization]);

  async function loadVisitaDetails() {
    if (!id || !organization) return;

    try {
      setLoading(true);
      setError('');

      // Carregar dados da visita
      const { data: visitaData, error: visitaError } = await supabase
        .from('visitas_tecnicas')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single();

      if (visitaError) {
        if (visitaError.code === 'PGRST116') {
          setError('Visita não encontrada');
          return;
        }
        throw visitaError;
      }

      setVisita(visitaData);

      // Carregar fotos da visita
      const { data: fotosData, error: fotosError } = await supabase
        .from('visita_fotos')
        .select('*')
        .eq('visita_id', id)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (fotosError) {
        console.error('Erro ao carregar fotos:', fotosError);
      } else {
        setFotos(fotosData || []);
      }

      // Carregar dados relacionados se existirem
      if (visitaData.cliente_id) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', visitaData.cliente_id)
          .single();
        setCliente(clienteData);
      }

      if (visitaData.fazenda_id) {
        const { data: fazendaData } = await supabase
          .from('fazendas')
          .select('*')
          .eq('id', visitaData.fazenda_id)
          .single();
        setFazenda(fazendaData);
      }

      if (visitaData.talhao_id) {
        const { data: talhaoData } = await supabase
          .from('talhoes')
          .select('*')
          .eq('id', visitaData.talhao_id)
          .single();
        setTalhao(talhaoData);
      }

    } catch (err: any) {
      console.error('Erro ao carregar detalhes da visita:', err);
      setError('Erro ao carregar detalhes da visita');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !visita) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {error || 'Visita não encontrada'}
          </h2>
          <p className="text-red-700 mb-4">
            Não foi possível carregar os detalhes desta visita técnica.
          </p>
          <Link
            to="/visitas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/visitas')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{visita.titulo}</h1>
            <p className="text-gray-600">Detalhes da visita técnica</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
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
      </div>

      {/* Informações Básicas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Data da Visita</p>
              <p className="font-medium">
                {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {cliente && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{cliente.nome}</p>
              </div>
            </div>
          )}

          {fazenda && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Fazenda</p>
                <p className="font-medium">{fazenda.nome}</p>
              </div>
            </div>
          )}

          {talhao && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Talhão</p>
                <p className="font-medium">{talhao.nome}</p>
              </div>
            </div>
          )}

          {visita.hora_inicio && (
            <div>
              <p className="text-sm text-gray-500">Horário</p>
              <p className="font-medium">
                {visita.hora_inicio}
                {visita.hora_fim && ` - ${visita.hora_fim}`}
              </p>
            </div>
          )}

          {visita.tipo_visita && (
            <div>
              <p className="text-sm text-gray-500">Tipo de Visita</p>
              <p className="font-medium">{visita.tipo_visita}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dados Agronômicos */}
      {(visita.cultura || visita.safra || visita.estagio_cultura || visita.clima || visita.temperatura) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dados Agronômicos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visita.cultura && (
              <div>
                <p className="text-sm text-gray-500">Cultura</p>
                <p className="font-medium">{visita.cultura}</p>
              </div>
            )}

            {visita.safra && (
              <div>
                <p className="text-sm text-gray-500">Safra</p>
                <p className="font-medium">{visita.safra}</p>
              </div>
            )}

            {visita.estagio_cultura && (
              <div>
                <p className="text-sm text-gray-500">Estágio da Cultura</p>
                <p className="font-medium">{visita.estagio_cultura}</p>
              </div>
            )}

            {visita.clima && (
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Clima</p>
                  <p className="font-medium">{visita.clima}</p>
                </div>
              </div>
            )}

            {visita.temperatura && (
              <div className="flex items-center gap-3">
                <Thermometer className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Temperatura</p>
                  <p className="font-medium">{visita.temperatura}°C</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observações */}
      {(visita.objetivo || visita.resumo || visita.recomendacoes || visita.proximos_passos) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Observações</h2>
          
          <div className="space-y-6">
            {visita.objetivo && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Objetivo</h3>
                <p className="text-gray-600">{visita.objetivo}</p>
              </div>
            )}

            {visita.resumo && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo da Visita</h3>
                <p className="text-gray-600">{visita.resumo}</p>
              </div>
            )}

            {visita.recomendacoes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recomendações Técnicas</h3>
                <p className="text-gray-600">{visita.recomendacoes}</p>
              </div>
            )}

            {visita.proximos_passos && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Próximos Passos</h3>
                <p className="text-gray-600">{visita.proximos_passos}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fotos */}
      {fotos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Fotos da Visita ({fotos.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="group relative">
                <img
                  src={foto.url}
                  alt={foto.titulo || 'Foto da visita'}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => window.open(foto.url, '_blank')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white text-gray-900 rounded-full"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                {foto.titulo && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{foto.titulo}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações</h2>
        
        <div className="flex gap-4">
          <Link
            to="/relatorios"
            state={{ visitaId: visita.id }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Gerar Relatório PDF
          </Link>
          
          {fotos.length > 0 && (
            <button
              onClick={() => {
                // TODO: Implementar visualização em galeria
                console.log('Abrir galeria de fotos');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Ver Galeria ({fotos.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}