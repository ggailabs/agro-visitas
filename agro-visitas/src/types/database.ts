export interface Organization {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  logo_url?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'admin' | 'manager' | 'representative' | 'technician' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  organization_id: string;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  foto_url?: string;
  tags?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Fazenda {
  id: string;
  organization_id: string;
  cliente_id: string;
  nome: string;
  area_total?: number;
  unidade_area?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  tipo_propriedade?: string;
  observacoes?: string;
  foto_url?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Talhao {
  id: string;
  organization_id: string;
  fazenda_id: string;
  nome: string;
  area?: number;
  unidade_area?: string;
  cultura_atual?: string;
  safra_atual?: string;
  coordenadas_poligono?: any;
  tipo_solo?: string;
  topografia?: string;
  sistema_irrigacao?: string;
  observacoes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Cultura {
  id: string;
  organization_id: string;
  nome: string;
  nome_cientifico?: string;
  tipo?: string;
  ciclo_dias?: number;
  epoca_plantio?: string;
  epoca_colheita?: string;
  descricao?: string;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Safra {
  id: string;
  organization_id: string;
  nome: string;
  ano_inicio: number;
  ano_fim?: number;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  observacoes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisitaTecnica {
  id: string;
  organization_id: string;
  cliente_id: string;
  fazenda_id?: string;
  talhao_id?: string;
  titulo: string;
  data_visita: string;
  hora_inicio?: string;
  hora_fim?: string;
  tipo_visita?: string;
  status?: string;
  objetivo?: string;
  resumo?: string;
  recomendacoes?: string;
  proximos_passos?: string;
  clima?: string;
  temperatura?: number;
  cultura?: string;
  safra?: string;
  estagio_cultura?: string;
  tags?: string[];
  is_public: boolean;
  tecnico_responsavel_id?: string;
  participantes?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VisitaAtividade {
  id: string;
  organization_id: string;
  visita_id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  observacoes?: string;
  hora_atividade?: string;
  ordem: number;
  dados_json?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VisitaFoto {
  id: string;
  organization_id: string;
  visita_id: string;
  atividade_id?: string;
  titulo?: string;
  descricao?: string;
  url: string;
  thumbnail_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  largura?: number;
  altura?: number;
  latitude?: number;
  longitude?: number;
  ordem: number;
  tags?: string[];
  is_destaque: boolean;
  uploaded_by?: string;
  created_at: string;
}

export interface VisitaLevantamento {
  id: string;
  organization_id: string;
  visita_id: string;
  atividade_id?: string;
  tipo: string;
  titulo: string;
  categoria?: string;
  dados: any;
  unidade?: string;
  valor_numerico?: number;
  valor_texto?: string;
  metodologia?: string;
  observacoes?: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VisitaGeolocalizacao {
  id: string;
  organization_id: string;
  visita_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  precisao?: number;
  tipo_ponto?: string;
  descricao?: string;
  timestamp: string;
  created_at: string;
}

export interface VisitaDocumento {
  id: string;
  organization_id: string;
  visita_id: string;
  titulo: string;
  descricao?: string;
  url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  tipo_documento?: string;
  uploaded_by?: string;
  created_at: string;
}
