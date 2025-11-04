# 🔧 DOCUMENTAÇÃO TÉCNICA - Desenvolvimento

## 📐 Arquitetura do Sistema

### Visão Geral
```
┌─────────────────────────────────────────────┐
│          FRONTEND (React + Vite)            │
│  ┌──────────────────────────────────────┐  │
│  │   Páginas (Lazy Loaded)              │  │
│  │   - Dashboard, Análise Solo, etc.    │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Context API (Auth, State)          │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Supabase Client                    │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↕ HTTPS
┌─────────────────────────────────────────────┐
│        SUPABASE BACKEND                     │
│  ┌──────────────────────────────────────┐  │
│  │   PostgreSQL + PostGIS               │  │
│  │   (32+ tabelas, RLS, Triggers)       │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Edge Functions (Deno)              │  │
│  │   - process-soil-report (OCR)        │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Storage Buckets                    │  │
│  │   - soil-analysis-files              │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Auth (JWT + RLS)                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↕ API
┌─────────────────────────────────────────────┐
│        EXTERNAL APIs                        │
│  - Google Cloud Vision (OCR)                │
│  - Google Maps (preparado)                  │
└─────────────────────────────────────────────┘
```

---

## 🏗️ Estrutura de Diretórios

```
/workspace/agro-visitas/
├── public/                    # Assets estáticos
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── ui/              # Componentes UI (Radix)
│   │   └── ...              # Componentes custom
│   ├── contexts/            # React Contexts
│   │   └── AuthContext.tsx  # Autenticação
│   ├── lib/                 # Bibliotecas e utilitários
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── utils.ts        # Funções auxiliares
│   ├── pages/              # Páginas da aplicação
│   │   ├── LoginPage.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AnaliseSoloPage.tsx
│   │   ├── MonitoramentoPage.tsx
│   │   ├── ColheitaPage.tsx
│   │   ├── ClimaPage.tsx
│   │   ├── RelatoriosPage.tsx
│   │   ├── InsightsPage.tsx
│   │   └── ...
│   ├── App.tsx             # Componente raiz + rotas
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globais
├── supabase/
│   ├── functions/
│   │   └── process-soil-report/
│   │       └── index.ts    # Edge Function OCR
│   └── migrations/         # SQL migrations (7 arquivos)
├── docs/                   # Documentação
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 💾 Database Schema

### Hierarquia de Dados
```
organizations (multi-tenant)
└── profiles (usuários)
└── clientes
    └── fazendas
        └── talhoes
            ├── soil_sampling_activities
            │   └── soil_samples
            │       └── soil_analysis_results
            ├── culture_inspections
            │   ├── pest_observations
            │   ├── disease_observations
            │   └── phenology_observations
            ├── harvest_plans
            │   └── harvest_operations
            │       ├── production_batches
            │       └── harvest_production_records
            └── culturas
```

### Row Level Security (RLS)

**Todas as tabelas principais têm policies:**

```sql
-- Exemplo: soil_sampling_activities
CREATE POLICY "Users can view own org activities"
ON soil_sampling_activities
FOR SELECT
USING (
  fazenda_id IN (
    SELECT id FROM fazendas 
    WHERE organization_id = auth.uid()::uuid
  )
);

CREATE POLICY "Users can insert own org activities"
ON soil_sampling_activities
FOR INSERT
WITH CHECK (
  fazenda_id IN (
    SELECT id FROM fazendas 
    WHERE organization_id = auth.uid()::uuid
  )
);
```

**Princípios:**
- Isolamento por `organization_id`
- Verificação em cada operação (SELECT, INSERT, UPDATE, DELETE)
- Joins com `fazendas` ou `profiles` para validar acesso
- Sem bypass administrativo (segurança máxima)

### Triggers Automáticos

**1. Updated At:**
```sql
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicado em todas as tabelas principais
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON soil_sampling_activities
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();
```

**2. Audit Trail:**
```sql
-- Trigger automático após INSERT/UPDATE/DELETE
CREATE TRIGGER audit_trigger_soil_sampling_activities
AFTER INSERT OR UPDATE OR DELETE ON soil_sampling_activities
FOR EACH ROW
EXECUTE FUNCTION log_audit_event();
```

### Índices Otimizados

```sql
-- Índices de FK para joins rápidos
CREATE INDEX idx_soil_samples_activity 
ON soil_samples(soil_sampling_activity_id);

CREATE INDEX idx_soil_results_sample 
ON soil_analysis_results(soil_sample_id);

CREATE INDEX idx_soil_results_parameter 
ON soil_analysis_results(parameter_id);

-- Índices de organização para RLS
CREATE INDEX idx_fazendas_org 
ON fazendas(organization_id);

CREATE INDEX idx_talhoes_fazenda 
ON talhoes(fazenda_id);

-- Índices de datas para filtros
CREATE INDEX idx_soil_activities_date 
ON soil_sampling_activities(data_coleta);

CREATE INDEX idx_inspections_date 
ON culture_inspections(inspection_date);

-- Índices espaciais (PostGIS)
CREATE INDEX idx_climate_events_location 
ON climate_events USING GIST(event_location);
```

---

## 🔌 API Integration

### Supabase Client

**Configuração (`src/lib/supabase.ts`):**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Variáveis de Ambiente (`.env`):**
```
VITE_SUPABASE_URL=https://tzysklyyduyxbbgyjxda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Queries Padrão

**SELECT com Joins:**
```typescript
const { data, error } = await supabase
  .from('soil_sampling_activities')
  .select(`
    id,
    data_coleta,
    fazenda_id,
    talhao_id,
    fazendas(nome),
    talhoes(nome, area_hectares),
    soil_samples(
      id,
      sample_number,
      soil_analysis_results(
        parameter_id,
        value,
        interpretation,
        soil_parameters(name, unit_id)
      )
    )
  `)
  .eq('fazenda_id', fazendaId)
  .order('data_coleta', { ascending: false })
  .limit(20)
```

**INSERT:**
```typescript
const { data, error } = await supabase
  .from('soil_sampling_activities')
  .insert({
    fazenda_id: fazendaId,
    talhao_id: talhaoId,
    data_coleta: new Date().toISOString(),
    responsavel_coleta: userName,
    observacoes: notes
  })
  .select()
  .single()
```

**UPDATE:**
```typescript
const { data, error } = await supabase
  .from('soil_sampling_activities')
  .update({ observacoes: newNotes })
  .eq('id', activityId)
  .select()
  .single()
```

**DELETE:**
```typescript
const { error } = await supabase
  .from('soil_sampling_activities')
  .delete()
  .eq('id', activityId)
```

### Edge Functions

**Deployment:**
```bash
# Deploy da Edge Function OCR
supabase functions deploy process-soil-report \
  --project-ref tzysklyyduyxbbgyjxda
```

**Invocação do Frontend:**
```typescript
const { data, error } = await supabase.functions.invoke('process-soil-report', {
  body: {
    fileUrl: uploadedFileUrl,
    sampleId: sampleId,
    activityId: activityId
  }
})
```

**Estrutura da Edge Function:**
```typescript
// supabase/functions/process-soil-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Extrair dados do request
    const { fileUrl, sampleId } = await req.json()
    
    // 2. OCR com Google Vision API (ou regex fallback)
    const extractedData = await performOCR(fileUrl)
    
    // 3. Salvar resultados no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    await supabase.from('soil_analysis_results').insert(extractedData)
    
    // 4. Retornar sucesso
    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## ⚛️ React Architecture

### Context API

**AuthContext (`src/contexts/AuthContext.tsx`):**
```typescript
interface AuthContextType {
  user: User | null
  organization: Organization | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserOrganization(session.user.id)
      }
      setLoading(false)
    })

    // Listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadUserOrganization(session.user.id)
        } else {
          setOrganization(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, organization, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Lazy Loading Pattern

**App.tsx:**
```typescript
import { lazy, Suspense } from 'react'

// Páginas críticas (carregadas imediatamente)
import DashboardPage from './pages/DashboardPage'

// Páginas lazy (carregadas sob demanda)
const InsightsPage = lazy(() => import('./pages/InsightsPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
    </div>
  )
}

// Uso nas rotas
<Route 
  path="insights" 
  element={
    <Suspense fallback={<PageLoader />}>
      <InsightsPage />
    </Suspense>
  } 
/>
```

### Component Pattern

**Estrutura Padrão:**
```typescript
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Loader, Icon1, Icon2 } from 'lucide-react'

export default function ExamplePage() {
  const { organization } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (organization) {
      loadData()
    }
  }, [organization])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('organization_id', organization.id)
      
      if (error) throw error
      setData(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Página Exemplo</h1>
        <button onClick={loadData} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          Atualizar
        </button>
      </div>

      {/* Content */}
      {data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
              {/* Card content */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🎨 Styling Guidelines

### TailwindCSS Conventions

**Cores Principais:**
```css
/* Primário (Verde) */
bg-green-600    /* Botões, highlights */
text-green-600  /* Textos importantes */
border-green-600 /* Bordas ativas */

/* Secundário (Azul) */
bg-blue-600     /* Informativo */
text-blue-600

/* Alertas */
bg-red-600      /* Erro/perigo */
bg-yellow-600   /* Aviso */
bg-orange-600   /* Atenção */

/* Neutros */
bg-gray-50      /* Backgrounds */
bg-gray-100     /* Cards */
text-gray-900   /* Texto principal */
text-gray-600   /* Texto secundário */
```

**Spacing System:**
```css
/* Espaçamento (múltiplos de 4px) */
space-y-4  /* 16px entre elementos verticais */
space-y-6  /* 24px - espaçamento médio */
space-y-8  /* 32px - espaçamento grande */
gap-4      /* 16px em grids/flex */
p-6        /* 24px padding */
```

**Responsive Breakpoints:**
```css
/* Mobile first */
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
/* 1 col mobile, 2 cols tablet, 4 cols desktop */

/* Breakpoints */
sm:  640px   /* Tablet portrait */
md:  768px   /* Tablet landscape */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

---

## 🔨 Build & Deploy

### Development

**Iniciar servidor de desenvolvimento:**
```bash
cd /workspace/agro-visitas
pnpm install
pnpm run dev
```

**URL local:** http://localhost:5173

### Production Build

**Build otimizado:**
```bash
pnpm run build
```

**Resultado:**
- `/dist` - Arquivos compilados
- Lazy loading ativo
- Code splitting aplicado
- Minificação com esbuild
- Source maps removidos

**Análise do bundle:**
```bash
# Verificar tamanhos
ls -lh dist/assets/

# Chunks principais:
# - main-[hash].js: Core da aplicação
# - react-vendor-[hash].js: React libs
# - charts-[hash].js: Recharts (lazy)
# - supabase-[hash].js: Database client
# - [PageName]-[hash].js: Páginas individuais (lazy)
```

### Deploy

**Processo automatizado:**
1. Build da aplicação: `pnpm run build`
2. Upload do `/dist` para CDN
3. URL gerada automaticamente
4. HTTPS ativado por padrão

**URL atual:** https://mdt8z51r06c1.space.minimax.io

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Autenticação:**
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (erro apropriado)
- [ ] Logout funciona
- [ ] Redirect após login
- [ ] Sessão persiste após refresh

**Análise de Solo:**
- [ ] Modal de nova análise abre
- [ ] Upload de PDF funciona
- [ ] Upload de imagem funciona
- [ ] OCR extrai dados corretamente
- [ ] Dados podem ser editados manualmente
- [ ] Salvar análise funciona
- [ ] Lista de análises carrega
- [ ] Filtros funcionam

**Monitoramento:**
- [ ] Nova inspeção pode ser criada
- [ ] Seleção de pragas funciona
- [ ] Seleção de doenças funciona
- [ ] Fotos podem ser anexadas
- [ ] Health score é calculado
- [ ] Lista de inspeções carrega

**Insights IA:**
- [ ] KPIs aparecem corretamente
- [ ] Gráfico de área renderiza
- [ ] Gráfico radar renderiza
- [ ] Alertas aparecem (se houver dados críticos)
- [ ] Toast notifications funcionam
- [ ] Seletor de período funciona
- [ ] Botão atualizar recarrega dados
- [ ] Recomendações aparecem

**Performance:**
- [ ] Páginas carregam em <3s
- [ ] Lazy loading funciona (ver Network tab)
- [ ] Sem erros no console
- [ ] Responsive em mobile
- [ ] Responsive em tablet
- [ ] Responsive em desktop

---

## 📚 Code Standards

### TypeScript

**Tipos explícitos:**
```typescript
// ✅ Bom
interface SoilSample {
  id: string
  sample_number: string
  soil_sampling_activity_id: string
  created_at: string
}

function processSample(sample: SoilSample): void {
  // ...
}

// ❌ Evitar
function processSample(sample: any) {
  // ...
}
```

**Null safety:**
```typescript
// ✅ Bom
const name = user?.profile?.nome ?? 'Desconhecido'

// ❌ Evitar
const name = user.profile.nome // Pode dar erro se user ou profile for null
```

### React Hooks

**Dependências corretas:**
```typescript
// ✅ Bom
useEffect(() => {
  loadData()
}, [organization, startDate, endDate])

// ❌ Evitar (missing deps)
useEffect(() => {
  loadData() // Usa organization mas não está nas deps
}, [])
```

**Cleanup:**
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('changes')
    .on('postgres_changes', { ... }, handler)
    .subscribe()

  return () => {
    subscription.unsubscribe() // ✅ Cleanup
  }
}, [])
```

### Naming Conventions

**Componentes:** PascalCase
```typescript
// ✅ Bom
export default function AnaliseSoloPage() {}

// ❌ Evitar
export default function analiseSoloPage() {}
```

**Funções/variáveis:** camelCase
```typescript
// ✅ Bom
const loadAnalysisData = async () => {}

// ❌ Evitar
const LoadAnalysisData = async () => {}
```

**Constantes:** UPPER_SNAKE_CASE
```typescript
// ✅ Bom
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ❌ Evitar
const maxFileSize = 10485760
```

---

## 🚨 Common Pitfalls

### 1. RLS Bypass
```typescript
// ❌ ERRO: Tentar bypassar RLS
const { data } = await supabase
  .from('soil_samples')
  .select('*') // Retorna vazio se RLS bloquear

// ✅ CORRETO: Garantir join com fazendas
const { data } = await supabase
  .from('soil_samples')
  .select(`
    *,
    soil_sampling_activities!inner(
      fazendas!inner(organization_id)
    )
  `)
```

### 2. State Updates em Loops
```typescript
// ❌ ERRO: Múltiplos re-renders
items.forEach(item => {
  setData(prev => [...prev, item]) // Re-render a cada iteração
})

// ✅ CORRETO: Um único update
setData(prev => [...prev, ...items])
```

### 3. Promises não aguardadas
```typescript
// ❌ ERRO: Não aguarda promise
useEffect(() => {
  loadData() // Promise não aguardada
}, [])

// ✅ CORRETO: Async function interna
useEffect(() => {
  async function load() {
    await loadData()
  }
  load()
}, [])
```

### 4. Memory Leaks
```typescript
// ❌ ERRO: setState após unmount
useEffect(() => {
  fetchData().then(data => {
    setData(data) // Pode ocorrer após unmount
  })
}, [])

// ✅ CORRETO: Verificar mounted
useEffect(() => {
  let mounted = true
  fetchData().then(data => {
    if (mounted) setData(data)
  })
  return () => { mounted = false }
}, [])
```

---

## 📖 Additional Resources

### Links Úteis
- **React Docs:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Supabase Docs:** https://supabase.com/docs
- **TailwindCSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com
- **Recharts:** https://recharts.org/en-US/

### Extensões VSCode Recomendadas
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

---

**Versão:** 4.0  
**Última Atualização:** 2025-11-05  
**Desenvolvedor:** MiniMax Agent
