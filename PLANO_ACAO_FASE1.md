# 🚀 PLANO DE AÇÃO - Implementação Fase 1 (MVP Mobile)

**Projeto:** Sistema de Visitas Agrícolas  
**Fase:** MVP Mobile  
**Duração:** 8-10 semanas  
**Início:** Imediato  
**Objetivo:** App instalável com GPS automático e offline básico

---

## 📋 PRÉ-REQUISITOS (Semana 0)

### Aprovações Necessárias
- [ ] Aprovação do orçamento: $8.000-12.000
- [ ] Aprovação do timeline: 8-10 semanas
- [ ] Aprovação do escopo (MVP Mobile)
- [ ] Aprovação para API keys pagas

### API Keys e Credenciais
```bash
# Google Maps
GOOGLE_MAPS_API_KEY=xxxxx
Custo: ~$50-200/mês
Link: https://console.cloud.google.com/apis/credentials

# Email Service (Resend)
RESEND_API_KEY=xxxxx
Custo: ~$10/mês (free tier: 3k emails/mês)
Link: https://resend.com/api-keys

# VAPID Keys (Push Notifications - Fase 2)
VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx
Geração: web-push generate-vapid-keys
```

### Ferramentas de Desenvolvimento
```bash
# Instalar dependências
npm install -g web-push
npm install -g lighthouse

# Criar ícones PWA (usar online)
https://realfavicongenerator.net/
https://www.pwabuilder.com/imageGenerator
```

### Equipe Mínima
- [ ] 1 Desenvolvedor Full-Stack (React + Supabase)
- [ ] 1 Designer (ícones PWA + ajustes UI)
- [ ] 1 QA/Tester (testes em dispositivos reais)
- [ ] 2-3 Beta Testers (técnicos agrícolas)

---

## 🗓️ CRONOGRAMA DETALHADO

### **SPRINT 1: PWA Setup + GPS** (Semanas 1-2)

#### Semana 1: PWA Foundation
**Objetivo:** App instalável na tela inicial

**Segunda-feira (Dia 1)**
- [ ] **Manhã:** Criar manifest.json
  ```json
  {
    "name": "AgroVisitas - Gestão de Visitas Técnicas",
    "short_name": "AgroVisitas",
    "description": "Sistema completo para gestão de visitas técnicas agrícolas",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait",
    "theme_color": "#16a34a",
    "background_color": "#ffffff",
    "categories": ["productivity", "business"],
    "screenshots": [...]
  }
  ```
- [ ] **Tarde:** Gerar ícones PWA (16 tamanhos)
  - Usar logo existente como base
  - 192x192, 512x512 (obrigatórios)
  - Ícones maskable (iOS)
  - Ícones adaptivos (Android)

**Terça-feira (Dia 2)**
- [ ] **Manhã:** Criar service-worker.js básico
  ```javascript
  // Cache de assets estáticos
  const CACHE_NAME = 'agrovisitas-v1';
  const urlsToCache = [
    '/',
    '/index.html',
    '/assets/index.css',
    '/assets/index.js'
  ];
  ```
- [ ] **Tarde:** Registrar SW no main.tsx
- [ ] **Teste:** Verificar instalação (Chrome DevTools)

**Quarta-feira (Dia 3)**
- [ ] **Manhã:** Implementar install prompt customizado
  ```typescript
  // InstallPrompt.tsx
  - Detectar beforeinstallprompt
  - Banner customizado "Instalar App"
  - Salvar decisão do usuário
  ```
- [ ] **Tarde:** Add to Home Screen guidance
- [ ] **Teste:** iOS Safari + Android Chrome

**Quinta-feira (Dia 4)**
- [ ] **Manhã:** Otimizar manifest (screenshots, descrição)
- [ ] **Tarde:** Splash screens customizadas
- [ ] **Teste:** Lighthouse PWA audit (score > 90)

**Sexta-feira (Dia 5)**
- [ ] **Manhã:** Correção de bugs PWA
- [ ] **Tarde:** Deploy + testes em produção
- [ ] **Checkpoint:** App instalável? ✅

#### Semana 2: GPS Automático
**Objetivo:** Captura automática de coordenadas

**Segunda-feira (Dia 6)**
- [ ] **Manhã:** Criar hook useGeolocation.ts
  ```typescript
  export function useGeolocation() {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const getCurrentLocation = () => {
      // Geolocation API
    };
    
    const watchLocation = () => {
      // Continuous tracking
    };
    
    return { location, error, loading, getCurrentLocation, watchLocation };
  }
  ```
- [ ] **Tarde:** Tratamento de erros (permissão negada, timeout)

**Terça-feira (Dia 7)**
- [ ] **Manhã:** Integrar em NovaVisitaPage.tsx
  - Botão "Capturar GPS Atual"
  - Auto-captura ao abrir página (opcional)
  - Display de coordenadas (lat/lng)
- [ ] **Tarde:** Salvar em visita_geolocalizacao

**Quarta-feira (Dia 8)**
- [ ] **Manhã:** GPS em upload de fotos
  - Capturar coordenadas ao tirar foto
  - Salvar em visita_fotos (latitude/longitude)
- [ ] **Tarde:** Indicador visual de precisão GPS

**Quinta-feira (Dia 9)**
- [ ] **Manhã:** Testes mobile (iOS + Android)
  - Permissões de localização
  - Precisão em campo aberto
  - Precisão com sinal ruim
- [ ] **Tarde:** Fallback para GPS manual

**Sexta-feira (Dia 10)**
- [ ] **Manhã:** Ajustes finais GPS
- [ ] **Tarde:** Documentação + handoff
- [ ] **Checkpoint:** GPS funcionando? ✅

---

### **SPRINT 2: Google Maps** (Semanas 3-4)

#### Semana 3: Setup + Visualização Básica
**Objetivo:** Mapa com marcadores de fazendas

**Segunda-feira (Dia 11)**
- [ ] **Manhã:** Setup Google Maps API
  - Obter API key
  - Configurar billing (limites)
  - Habilitar APIs: Maps JavaScript, Geocoding
- [ ] **Tarde:** Instalar @googlemaps/react-wrapper

**Terça-feira (Dia 12)**
- [ ] **Manhã:** Criar componente MapView.tsx
  ```typescript
  interface MapViewProps {
    center: { lat: number; lng: number };
    zoom: number;
    markers: Marker[];
    onMarkerClick: (id: string) => void;
  }
  ```
- [ ] **Tarde:** Estilização customizada (tema verde agrícola)

**Quarta-feira (Dia 13)**
- [ ] **Manhã:** Componente FazendaMarker.tsx
  - Ícones customizados (fazenda)
  - Cores por status
  - Cluster para múltiplas fazendas
- [ ] **Tarde:** Info windows com dados básicos

**Quinta-feira (Dia 14)**
- [ ] **Manhã:** Adicionar mapa em FazendasPage.tsx
  - Toggle: Lista / Mapa
  - Carregar coordenadas de fazendas
  - Centralizar em região
- [ ] **Tarde:** Filtros no mapa (cliente, cidade)

**Sexta-feira (Dia 15)**
- [ ] **Manhã:** Testes de performance (muitas fazendas)
- [ ] **Tarde:** Otimizações (lazy load, clustering)
- [ ] **Checkpoint:** Mapa básico? ✅

#### Semana 4: Mapa em Visitas + Interatividade
**Objetivo:** Mapa com pontos de fotos e rotas

**Segunda-feira (Dia 16)**
- [ ] **Manhã:** Adicionar mapa em VisitaDetalhesPage.tsx
  - Mostrar localização da fazenda
  - Marcadores de fotos com GPS
- [ ] **Tarde:** Thumbnails de fotos no info window

**Terça-feira (Dia 17)**
- [ ] **Manhã:** Navegação: Mapa → Foto full-screen
- [ ] **Tarde:** Direções para fazenda (Google Directions)

**Quarta-feira (Dia 18)**
- [ ] **Manhã:** Dashboard com mapa geral
  - Todas fazendas da organização
  - Heat map de visitas
- [ ] **Tarde:** Filtros temporais (último mês, etc.)

**Quinta-feira (Dia 19)**
- [ ] **Manhã:** Otimizações finais
  - Reduzir chamadas de API
  - Cache de geocoding
- [ ] **Tarde:** Testes mobile (touch, zoom, pan)

**Sexta-feira (Dia 20)**
- [ ] **Manhã:** Ajustes UI/UX
- [ ] **Tarde:** Deploy + testes produção
- [ ] **Checkpoint:** Mapas completos? ✅

---

### **SPRINT 3-4: Offline Mode** (Semanas 5-8)

#### Semana 5: Service Worker Avançado
**Objetivo:** Cache inteligente de dados

**Segunda-feira (Dia 21)**
- [ ] **Manhã:** Instalar Workbox
  ```bash
  npm install workbox-build workbox-precaching workbox-routing
  ```
- [ ] **Tarde:** Configurar workbox-config.js

**Terça-feira (Dia 22)**
- [ ] **Manhã:** Estratégias de cache
  - Cache-first: assets estáticos
  - Network-first: dados da API
  - Stale-while-revalidate: imagens
- [ ] **Tarde:** Implementar runtime caching

**Quarta-feira (Dia 23)**
- [ ] **Manhã:** Cache de páginas visitadas
- [ ] **Tarde:** Pre-cache de assets críticos

**Quinta-feira (Dia 24)**
- [ ] **Manhã:** Indicator de status online/offline
  ```typescript
  // OfflineIndicator.tsx
  - Detectar navigator.onLine
  - Banner "Modo Offline"
  - Sincronização pendente
  ```
- [ ] **Tarde:** Testes de transição online/offline

**Sexta-feira (Dia 25)**
- [ ] **Manhã:** Debugging offline (Chrome DevTools)
- [ ] **Tarde:** Ajustes de cache (tamanho, TTL)

#### Semana 6-7: IndexedDB + Sync
**Objetivo:** Criar visitas offline

**Segunda-feira (Dia 26)**
- [ ] **Manhã:** Instalar idb (IndexedDB wrapper)
  ```bash
  npm install idb
  ```
- [ ] **Tarde:** Criar db.ts (schema IndexedDB)

**Terça-feira (Dia 27)**
- [ ] **Manhã:** Store: visitas_offline
  ```typescript
  // Estrutura
  interface OfflineVisita {
    id: string; // UUID temporário
    ...data,
    status: 'pending' | 'syncing' | 'synced',
    created_at: Date,
    sync_attempts: number
  }
  ```
- [ ] **Tarde:** CRUD local (criar, ler, atualizar)

**Quarta-feira (Dia 28)**
- [ ] **Manhã:** Detectar modo offline em NovaVisitaPage
  - Se offline: salvar em IndexedDB
  - Se online: salvar no Supabase normalmente
- [ ] **Tarde:** UI feedback (salvando localmente)

**Quinta-feira (Dia 29)**
- [ ] **Manhã:** Background Sync API
  ```javascript
  // Service Worker
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-visitas') {
      event.waitUntil(syncVisitas());
    }
  });
  ```
- [ ] **Tarde:** Sincronização quando voltar online

**Sexta-feira (Dia 30)**
- [ ] **Manhã:** Fila de uploads de fotos offline
- [ ] **Tarde:** Retry logic (3 tentativas)

**Segunda-feira (Dia 31)**
- [ ] **Manhã:** Store: clientes_cache
- [ ] **Tarde:** Store: fazendas_cache

**Terça-feira (Dia 32)**
- [ ] **Manhã:** Store: talhoes_cache
- [ ] **Tarde:** Auto-refresh ao voltar online

**Quarta-feira (Dia 33)**
- [ ] **Manhã:** Store: fotos_pending (base64)
- [ ] **Tarde:** Compressão de imagens offline

**Quinta-feira (Dia 34)**
- [ ] **Manhã:** Página "Sincronização Pendente"
  - Lista de itens não sincronizados
  - Forçar sincronização manual
  - Resolver conflitos
- [ ] **Tarde:** Tratamento de erros de sync

**Sexta-feira (Dia 35)**
- [ ] **Manhã:** Testes extensivos offline
  - Criar visita offline
  - Adicionar fotos offline
  - Voltar online → verificar sync
- [ ] **Tarde:** Correção de bugs críticos

#### Semana 8: Polish + Testes
**Objetivo:** Sistema offline robusto

**Segunda-feira (Dia 36)**
- [ ] **Manhã:** Indicadores visuais
  - Badge de itens pendentes
  - Progress bar de sincronização
- [ ] **Tarde:** Animações de transição

**Terça-feira (Dia 37)**
- [ ] **Manhã:** Gerenciamento de storage
  - Limpar cache antigo
  - Limites de tamanho (100MB)
- [ ] **Tarde:** Clear cache manual (settings)

**Quarta-feira (Dia 38)**
- [ ] **Manhã:** Testes de edge cases
  - Ficar offline por dias
  - Perder conexão durante upload
  - Múltiplos dispositivos
- [ ] **Tarde:** Tratamento de conflitos

**Quinta-feira (Dia 39)**
- [ ] **Manhã:** Performance optimization
  - Reduzir tamanho do cache
  - Lazy load de imagens
- [ ] **Tarde:** Testes de bateria (não drenar)

**Sexta-feira (Dia 40)**
- [ ] **Manhã:** Documentação técnica
- [ ] **Tarde:** Guia do usuário (modo offline)
- [ ] **Checkpoint:** Offline completo? ✅

---

### **SPRINT 5: Testes Beta** (Semanas 9-10)

#### Semana 9: Testes Internos
**Objetivo:** Identificar bugs críticos

**Segunda-feira (Dia 41)**
- [ ] **Manhã:** Deploy versão beta
- [ ] **Tarde:** Setup analytics (Google Analytics 4)

**Terça-feira (Dia 42)**
- [ ] **Dia todo:** Testes em dispositivos
  - iPhone 12/13/14 (iOS 16+)
  - Samsung Galaxy S21/S22
  - Xiaomi Redmi (Android popular)
  - iPad

**Quarta-feira (Dia 43)**
- [ ] **Dia todo:** Testes em cenários reais
  - Campo aberto (GPS)
  - Área sem sinal (offline)
  - Conexão 3G lenta
  - Mudar entre online/offline

**Quinta-feira (Dia 44)**
- [ ] **Manhã:** Coletar feedback do time QA
- [ ] **Tarde:** Priorizar bugs (crítico/alto/médio/baixo)

**Sexta-feira (Dia 45)**
- [ ] **Dia todo:** Fix bugs críticos

#### Semana 10: Testes Beta Externos
**Objetivo:** Validar com usuários reais

**Segunda-feira (Dia 46)**
- [ ] **Manhã:** Selecionar 5-10 beta testers
  - Técnicos agrícolas reais
  - Diferentes regiões
  - Mix de iOS/Android
- [ ] **Tarde:** Enviar convites + instruções

**Terça-feira (Dia 47)**
- [ ] **Dia todo:** Onboarding de beta testers
  - Videochamada de introdução
  - Como instalar PWA
  - Como testar offline
  - Como reportar bugs

**Quarta-feira (Dia 48)**
- [ ] **Dia todo:** Monitoramento ativo
  - Verificar analytics
  - Responder dúvidas
  - Coletar feedback

**Quinta-feira (Dia 49)**
- [ ] **Manhã:** Sessão de feedback (call)
- [ ] **Tarde:** Análise de dados de uso

**Sexta-feira (Dia 50)**
- [ ] **Manhã:** Fix bugs reportados
- [ ] **Tarde:** Preparar para launch
- [ ] **Checkpoint:** Pronto para produção? ✅

---

## ✅ CHECKLIST PRÉ-LANÇAMENTO

### Funcionalidades
- [ ] PWA instalável em iOS e Android
- [ ] Ícones e splash screens configurados
- [ ] GPS automático funcionando
- [ ] GPS manual como fallback
- [ ] Mapas com marcadores de fazendas
- [ ] Mapas com pontos de fotos
- [ ] Criar visita offline
- [ ] Adicionar fotos offline
- [ ] Sincronização automática
- [ ] Sincronização manual
- [ ] Indicadores de status (online/offline/syncing)

### Performance
- [ ] Lighthouse PWA score > 90
- [ ] Lighthouse Performance > 80
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Tamanho do bundle < 500KB (gzipped)
- [ ] Cache funciona offline
- [ ] GPS preciso (< 15m)

### Compatibilidade
- [ ] iOS 16+ (Safari)
- [ ] Android 12+ (Chrome)
- [ ] Funciona sem conexão
- [ ] Funciona com 3G lento
- [ ] Não trava em campos sem sinal
- [ ] Bateria não drena rápido

### Documentação
- [ ] README atualizado
- [ ] Guia de instalação PWA
- [ ] Guia de uso offline
- [ ] Como usar GPS automático
- [ ] FAQ de troubleshooting
- [ ] Documentação técnica (devs)

### Marketing
- [ ] Screenshots atualizados (com mapas)
- [ ] Vídeo demo (30s)
- [ ] Post de lançamento rascunhado
- [ ] Email para usuários existentes
- [ ] Landing page atualizada

---

## 🐛 PLANO DE CONTINGÊNCIA

### Se GPS não for preciso o suficiente
**Plano B:** Manter GPS manual sempre visível  
**Tempo:** +2 dias  
**Impacto:** Baixo (funcionalidade core mantida)

### Se offline for muito complexo
**Plano B:** Apenas cache de leitura (sem criar offline)  
**Tempo:** -7 dias  
**Impacto:** Médio (reduz valor, mas ainda funcional)

### Se Google Maps estourar budget
**Plano B:** Limitar carregamentos (5/dia por usuário)  
**Tempo:** +1 dia  
**Impacto:** Baixo (raramente excede)

### Se sync falhar constantemente
**Plano B:** Exportar dados offline como JSON + upload manual  
**Tempo:** +3 dias  
**Impacto:** Médio (UX pior, mas funciona)

---

## 📊 MÉTRICAS DE SUCESSO (Monitorar Diariamente)

```javascript
// Google Analytics 4 Events
gtag('event', 'pwa_installed', {
  platform: 'ios' | 'android',
  user_id: user.id
});

gtag('event', 'gps_captured', {
  accuracy: accuracy_meters,
  method: 'auto' | 'manual'
});

gtag('event', 'offline_visit_created', {
  photos_count: count,
  sync_time_seconds: duration
});

gtag('event', 'map_viewed', {
  markers_count: count,
  zoom_level: level
});
```

**Metas Semanais:**
- Semana 1-2: PWA install rate > 30%
- Semana 3-4: Map usage > 50% dos usuários
- Semana 5-8: Offline usage > 20% dos usuários
- Semana 9-10: Bug reports < 5 críticos

---

## 🎓 LIÇÕES APRENDIDAS (Pós-Mortem Planejado)

### O que deu certo?
- [ ] PWA setup foi mais fácil que esperado?
- [ ] GPS foi preciso o suficiente?
- [ ] Offline atendeu necessidades?
- [ ] Mapas agregaram valor?

### O que deu errado?
- [ ] Subestimamos complexidade de X?
- [ ] Problemas técnicos inesperados?
- [ ] Usuários confusos com Y?
- [ ] Performance menor que esperado?

### O que mudar na Fase 2?
- [ ] Melhorias de processo
- [ ] Ferramentas diferentes
- [ ] Mais testes antecipados
- [ ] Documentação mais clara

---

## 🚀 PRÓXIMOS PASSOS (Pós-MVP)

### Imediato (Semana 11)
1. Análise de métricas de sucesso
2. Coletar feedback detalhado de usuários
3. Priorizar bugs reportados
4. Planejar Fase 2 (Multi-user)

### Curto Prazo (Semanas 12-14)
1. Iterar baseado em feedback
2. Otimizações de performance
3. Features quick wins (compartilhamento)
4. Preparar pitch para vendas B2B

### Médio Prazo (Meses 3-4)
1. Iniciar Fase 2 (Gestão de Equipes)
2. Push notifications
3. Calendário de visitas
4. Relatórios avançados

---

**Plano criado por:** MiniMax Agent  
**Data:** 2025-11-04  
**Status:** Pronto para execução  
**Aprovação necessária:** ✅ Stakeholders
