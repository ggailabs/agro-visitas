# Blueprint do Schema PostgreSQL para Áreas Técnicas Especializadas (Solo, Cultura, Produção, Clima, Relatórios) com RLS, Triggers, Índices e Escalabilidade para IA

## 1. Sumário executivo e escopo

Este documento propõe um projeto de schema em PostgreSQL para suportar operações agrícolas que demandam granularidade técnica: análises de solo, monitoramento de cultura, colheita e produção, registro de eventos climáticos e geração de relatórios técnicos. O desenho prioriza consistência, auditabilidade, desempenho e segurança por linha, com políticas de Row Level Security (RLS) baseadas em entidades organizacionais. A modelagem considera a integração com sistemas de informação geográfica (GIS) para geospatial e a evolução futura em direção a dados de sensores (IoT) e pipelines de inteligência artificial (IA).

Escopo e entregáveis:
- Proposta completa de tabelas, relacionamentos, índices, restrições, triggers e políticas RLS.
- Estratégia de particionamento temporal e sugere extensões (TimescaleDB opcional) e PostGIS para geospatial.
- Plano de versionamento de dados e de relatórios técnicos.
- Sondas e métricas de qualidade e desempenho para governança.
- Roteiro de implementação incremental e migração a partir de legado.

Princípios de design:
- Normalização pragmática para garantir integridade e reduzir redundância, desnormalizando seletivamente onde agrega desempenho (e.g., materialized views).
- Consistência e auditabilidade: todas as tabelas principais usam chaves substitutas (UUID), timestamps de criação/atualização, origem (source) e carimbo de integridade (hash).
- Desempenho: índices parciais e compostos, índices por expressão (inclusive GiST para geospatial), e manutenção via vacuum/analyze e reindex programados.
- Segurança: RLS com políticas por organização, papel técnico e agregados; criptografia em trânsito e recomendações de criptografia em repouso.
- Escalabilidade e evolução: particionamento temporal em tabelas de alta ingestão (observações, leituras de sensores, relatórios), extensibilidade para IA (armazenagem de features, modelos, execuções e previsões).

Limitação conhecida: requisitos não funcionais (volume, SLOs, regiões/tenancy, conformidade) não foram fornecidos. O design indica onde parametrizar decisões a depender desses fatores.

## 2. Requisitos e visão geral da solução

Requisitos funcionais:
- Gestão de áreas e glebas com geometrias e atributos agronômicos.
- Amostragens e análises de solo com metodologias, unidades e limites de referência.
- Monitoramento de cultura por talhão, incluindo inspeções e leituras de sensores (opcional).
- Planejamento e registros de colheita com produtividade e qualidade.
- Coleta de eventos climáticos de múltiplas fontes e normalização de unidades.
- Relatórios técnicos auditáveis (conteúdo estruturado e materializações).
- Auditoria de trilha e RLS multi-organização.

Requisitos não funcionais (a parametrizar):
- Carga de escrita/leitura e retenção por classe de dados.
- Disponibilidade e objetivos SLO/SLI.
- Regulação de dados e residência (LGPD/GDPR) e segregação por organização.
- Orçamento e licenciamento de extensões (TimescaleDB, PostGIS).

Visão de camadas:
- Dados mestres: fazendas, talhões, culturas, variedades, método analítico.
- Observações/resultados: amostras de solo, análises laboratoriais, inspeções de campo, leituras de sensores, eventos climáticos.
- Operação/produção: planejamentos de colheita, registros de produção, lotes e movimentações.
- Relatórios: relatórios técnicos com conteúdo em JSON, resultados sumarizados e materializações.

Extensões recomendadas:
- PostGIS para geometrias/geografia e índices GiST.
- TimescaleDB (opcional) para hypertable em tabelas temporais de alto volume.
- pgcrypto para funções de hash e possíveis necessidades de criptografia.

## 3. Modelo conceitual e narrativas de domínios

O modelo conceitual organiza-se em domínios que se relacionam de forma natural: organização → áreas/talhões → culturas/variedades → operações e observações → síntese em relatórios.

Domínios:
- Organização e usuários: körperschaft que define fazendas, áreas e políticas RLS.
- Áreas e talhões: propriedades geoespaciais (polígonos) e atributos agronômicos.
- Solo: atividades de amostragem, amostras, análises laboratoriais e resultados com parâmetros, valores e unidades.
- Cultura: inspeções e relatórios de campo, sensoriamento remoto, e leituras de sensores IoT.
- Colheita e produção: planejamento e execução de colheita,registros de produção e agregações.
- Clima: eventos climáticos com fontes, localização e métricas.
- Relatórios técnicos: versão de relatórios, parâmetros, conteúdo JSON e materializações.
- Segurança e auditoria: papéis, RLS e trilha de auditoria.

Narrativas:
- Solo: a atividade de amostragem gera amostras que, processadas por um método analítico, produzem resultados por parâmetro (e.g., pH, matéria orgânica) com valor e unidade, referenciando limites de referência quando aplicável.
- Cultura: inspeções de campo e leituras de sensores são registradas por talhão e cultura, permitindo analisar evolução fenológica esanitária.
- Colheita: o planejamento guia a execução; os registros de produção por talhão alimentam agregações de produtividade por período, variedade e talhão.
- Clima: eventos como chuva, geada e granizo são coletados por fontes distintas (estações, satélites) e normalizados para análises conjuntas com solo e cultura.
- Relatórios: modelos parametrizados geram versões com conteúdo estruturado e auditável, materializados para consumo analítico.

Cardenalidades principais:
- Organização 1:N Fazendas; Fazenda 1:N Talhões; Talhão N:1 Cultura em janelas temporais.
- Amostragem 1:N Amostras; Amostra 1:N Resultados de Análise (por parâmetro).
- Talhão 1:N Inspeções; Talhão 1:N Leituras de Sensores.
- Colheita 1:N Registros de Produção; Produção N:1 Lote.
- Evento Climático N:1 Localização (quando aplicável).
- Relatório Técnico 1:N Versões de Relatório.

Eventos e entidades históricas:
- Inspeções e resultados analíticos são naturalmente versionados no tempo; o design usa data de validade (valid_from/valid_to) e/origem (source) para rastreabilidade.
- Leituras de sensores e eventos climáticos são séries temporais; particionamento temporal e compressão (via TimescaleDB, opcional) são recomendados.

## 4. Modelo lógico (schema DDL) — visão geral e padrões

Padrões transversais:
- Identificadores: uso de UUID como chave substituta (BIGSERIAL apenas quando apropriado para chaves internas locais).
- Timestamps: created_at (timestamp com fuso), updated_at (manter via trigger), e faixas de validade (valid_from, valid_to) quando necessário para versionamento.
- Auditoria: campos padrão de auditoria (origem/source, hash de integridade) em tabelas principais; triggers para maintaining updated_at e hashing.
- Unidades e referências: normalização de unidades por tabela companion e domínios de referência (métodos analíticos, tipos de inspeção, tipos de evento climático, etc.).
- Geospatial: PostGIS com colunas geometry/geography e SRID definido; índices GiST para otimizar consultas espaciais.

Domínios (tipos enum-like) em catálogo (exemplos):
- soil_parameter (pH, MO, P, K, Ca, Mg, Na, CTC, V%, Al3+, MO%,錯?).
- method_type (e.g., MP_?, ekstraksi_química?).
- inspection_type (fitossanidade, fenologia, herbal, pragas).
- event_type (chuva, geada, granizo, vendaval, seca, inundação).
- unit_type (unidades SI e conversões normalizadas).
- report_status (draft, finalized, published).

Geometrias e SRID:
- Talhões e áreas: polygons/multipolygons SRID definido conforme projeto (sugestão: SIRGAS 2000 / UTM da região).
- Localização de eventos: points SRID coerente com o projeto.

## 5. Schema detalhado por domínio

A seguir, a definição das tabelas por domínio, com campos, chaves, relacionamentos, índices, triggers e políticas RLS. As políticas assumem a existência de um papel (role) de esquema técnico (e.g., tech_role) e as colunas de segurança organizacional, como org_id e owner_org_id, utilizadas nas condições de RLS.

### 5.1 Organização e segurança (usuários, papéis, políticas base)

Objetivo: centralizar entidades organizacionais, usuários e papéis; suportar RLS por organização e papéis.

Tabelas:
- organizations
  - id (uuid, pk)
  - name (text, único)
  - status (text)
  - created_at (timestamptz)
- users
  - id (uuid, pk)
  - email (text, único)
  - display_name (text)
  - created_at (timestamptz)
- user_profiles
  - user_id (uuid, pk fk users.id)
  - default_org_id (uuid, fk organizations.id)
  - locale (text)
  - timezone (text)
- roles
  - id (uuid, pk)
  - role_key (text, único)
  - description (text)
- user_org_roles
  - id (uuid, pk)
  - user_id (uuid, fk users.id)
  - org_id (uuid, fk organizations.id)
  - role_id (uuid, fk roles.id)

Índices:
- users(email) unique.
- user_org_roles(org_id, role_id, user_id) unique.

Triggers:
- updated_at em organizations, users, user_profiles, roles, user_org_roles.

RLS:
- organizations:SELECT para tech_role.
- users:SELECT filtrando por关联 a organizações onde o usuário possui papel;UPDATE/DELETE restritos a owner (a definir).
- user_org_roles:SELECT para tech_role;INSERT/UPDATE/DELETE limitados a papéis administrativos.
- user_profiles:SELECT pelo próprio usuário;UPDATE pelo próprio usuário.

DDL base:

```sql
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organizations_name_uq ON organizations (name);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_uq ON users (email);

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_org_id uuid REFERENCES organizations(id),
  locale text,
  timezone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX roles_role_key_uq ON roles (role_key);

CREATE TABLE user_org_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX user_org_roles_uq ON user_org_roles (user_id, org_id, role_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_set_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER user_org_roles_set_updated_at
BEFORE UPDATE ON user_org_roles
FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();
```

### 5.2 Áreas e talhões (geometria PostGIS, atributos agronômicos)

Objetivo: representar fazendas e talhões com geometrias, atributos de solo/cultura e metadados.

Tabelas:
- fazendas
  - id (uuid, pk)
  - org_id (uuid, fk organizations.id)
  - nome (text)
  - codigo_externo (text)
  - area_total_ha (numeric)
  - localizacao (point geometry, SRID definido)
  - created_at, updated_at
- talhoes
  - id (uuid, pk)
  - fazenda_id (uuid, fk fazendas.id)
  - codigo (text)
  - area_ha (numeric)
  - geometria (polygon geometry, SRID definido)
  - cultura_padrao_id (uuid, fk culturas.id, nullable)
  - tipo_solo (text)
  - created_at, updated_at

Índices:
- fazendas(org_id), fazendas(codigo_externo) unique.
- talhoes(fazenda_id, codigo) unique.
- GiST em geometria de talhões para consultas espaciais.

Triggers:
- updated_at em fazendas e talhoes.

RLS:
- fazendas/ talhoes:SELECT/INSERT/UPDATE/DELETE filtrando org_id do contexto;políticas dependem de papéis administrativos/agronomistas.

Extensões:
- PostGIS e criação de índice GiST na coluna geometria.

DDL:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE fazendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  nome text NOT NULL,
  codigo_externo text,
  area_total_ha numeric(18,3),
  localizacao geometry(Point, 4674), -- Exemplo de SRID; ajuste ao projeto
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fazendas_codigo_externo_uq ON fazendas (codigo_externo) WHERE codigo_externo IS NOT NULL;
CREATE INDEX fazendas_org_id_idx ON fazendas (org_id);

CREATE TABLE talhoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id uuid NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  area_ha numeric(18,3) NOT NULL,
  geometria geometry(MultiPolygon, 4674) NOT NULL,
  cultura_padrao_id uuid REFERENCES culturas(id),
  tipo_solo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX talhoes_fazenda_codigo_uq ON talhoes (fazenda_id, codigo);
CREATE INDEX talhoes_org_fazenda_idx ON talhoes (fazenda_id);
CREATE INDEX talhoes_geometria_gist ON talhoes USING gist (geometria);

CREATE TRIGGER fazendas_set_updated_at
BEFORE UPDATE ON fazendas FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER talhoes_set_updated_at
BEFORE UPDATE ON talhoes FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();
```

### 5.3 Domínios de referência

Objetivo: catalogar culturas, variedades e métodos analíticos; parametrizar parâmetros de solo, unidades e limites de referência.

Tabelas:
- culturas
  - id, nome, especie, ciclo_dias, created_at, updated_at
- variedades
  - id, cultura_id, nome, origem, created_at, updated_at
- soil_parameters
  - id, key, name, description, created_at
- method_types
  - id, key, name, description, created_at
- units
  - id, symbol, name, base_unit_key, factor_to_base, created_at
- soil_reference_limits
  - id, parameter_id, method_id, min_value, max_value, unit_id, textura_classe, created_at

Índices:
- unik em culturas(nome), variedades(cultura_id, nome), soil_parameters(key), method_types(key), units(symbol).
- soil_reference_limits(parameter_id, method_id, textura_classe) unique.

RLS:
- Domínios de referência:SELECT público para tech_role; operações DML restritas a papéis administrativos.

DDL:

```sql
CREATE TABLE culturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  especie text,
  ciclo_dias int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX culturas_nome_uq ON culturas (nome);

CREATE TABLE variedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultura_id uuid NOT NULL REFERENCES culturas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  origem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX variedades_cultura_nome_uq ON variedades (cultura_id, nome);

CREATE TABLE soil_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX soil_parameters_key_uq ON soil_parameters (key);

CREATE TABLE method_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX method_types_key_uq ON method_types (key);

CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  name text NOT NULL,
  base_unit_key text,
  factor_to_base numeric(18,10),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX units_symbol_uq ON units (symbol);

CREATE TABLE soil_reference_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id uuid NOT NULL REFERENCES soil_parameters(id),
  method_id uuid REFERENCES method_types(id),
  min_value numeric(18,6),
  max_value numeric(18,6),
  unit_id uuid REFERENCES units(id),
  textura_classe text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX soil_ref_limits_uq ON soil_reference_limits (parameter_id, method_id, textura_classe);
```

### 5.4 Solo (amostras, análises e resultados)

Objetivo: registrar amostragens, amostras físicas e resultados laboratoriais com rastreabilidade, unidades e validação.

Tabelas:
- soil_sampling_activities
  - id, org_id, talhao_id, atividade_tipo, realizada_em, responsavel_id (users), observacao, created_at, updated_at
- soil_samples
  - id, activity_id, codigo, tipo (composição/simples), coleta_em, profundidade_cm, ponto_geometria (point), massa_g, origem_source, hash_integridade, created_at, updated_at
- soil_analysis_results
  - id, sample_id, parameter_id, method_id, valor, unit_id, qualidade, limiar_ref_id, valid_from, valid_to, created_at, updated_at

Índices:
- soil_samples(activity_id, codigo) unique.
- soil_analysis_results(sample_id), (parameter_id), (method_id).
- soil_analysis_results(valid_from, valid_to).
- Índices parciais por qualidade (e.g., quality_flag = 'validated').

Triggers:
- updated_at nas três tabelas.
- Integridade de profundidade (check depth > 0).
- Hash de integridade nas amostras (hash over campos determinísticos;ver Seção 8).

Validação:
- CHECK em soil_samples.profundidade_cm > 0.
- Limites de referência validados via JOIN com soil_reference_limits conforme parâmetro, método e textura.

RLS:
- Registros filtrados por organização do talhão (org_id);papéis agronômicos e laboratoriais habilitam INSERT/UPDATE em etapas apropriadas.

DDL:

```sql
CREATE TABLE soil_sampling_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  talhao_id uuid NOT NULL REFERENCES talhoes(id),
  atividade_tipo text NOT NULL, -- e.g., composicao, simples, rotina
  realizada_em timestamptz NOT NULL,
  responsavel_id uuid REFERENCES users(id),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX soil_sampling_org_talhao_idx ON soil_sampling_activities (org_id, talhao_id, realizada_em);

CREATE TABLE soil_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES soil_sampling_activities(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  tipo text NOT NULL, -- 'composicao' | 'simples'
  coleta_em timestamptz NOT NULL,
  profundidade_cm numeric(6,2) NOT NULL,
  ponto_geometria geometry(Point, 4674),
  massa_g numeric(10,3),
  origem_source text,
  hash_integridade text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX soil_samples_activity_codigo_uq ON soil_samples (activity_id, codigo);
CREATE INDEX soil_samples_coleta_idx ON soil_samples (coleta_em);

CREATE TABLE soil_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL REFERENCES soil_samples(id) ON DELETE CASCADE,
  parameter_id uuid NOT NULL REFERENCES soil_parameters(id),
  method_id uuid REFERENCES method_types(id),
  valor numeric(18,6) NOT NULL,
  unit_id uuid REFERENCES units(id),
  qualidade text, -- ex: 'bruto', 'validado'
  limiar_ref_id uuid REFERENCES soil_reference_limits(id),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX soil_analysis_sample_idx ON soil_analysis_results (sample_id);
CREATE INDEX soil_analysis_param_method_idx ON soil_analysis_results (parameter_id, method_id);
CREATE INDEX soil_analysis_valid_range_idx ON soil_analysis_results (valid_from, valid_to);
CREATE INDEX soil_analysis_quality_idx ON soil_analysis_results (quality_flag) WHERE quality_flag = 'validado';

CREATE TRIGGER soil_sampling_set_updated_at
BEFORE UPDATE ON soil_sampling_activities FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER soil_samples_set_updated_at
BEFORE UPDATE ON soil_samples FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER soil_analysis_set_updated_at
BEFORE UPDATE ON soil_analysis_results FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

-- Constraints
ALTER TABLE soil_samples ADD CONSTRAINT soil_samples_profundidade_chk
CHECK (profundidade_cm > 0);
```

### 5.5 Cultura (inspeções, sensoriamento remoto, sensores)

Objetivo: registrar inspeções de campo e leituras de sensores (opcionais), com timeline por talhão e cultura.

Tabelas:
- culture_inspections
  - id, org_id, talhao_id, cultura_id, data, responsavel_id, tipo, relatorio_json, created_at, updated_at
- sensor_devices
  - id, org_id, talhao_id, tipo, fabricante, modelo, identificador_externo, status, instalado_em, uninstalled_at, created_at, updated_at
- sensor_readings
  - id, device_id, timestamp, metric_type, valor, unit_id, quality_flag, valid_from, valid_to, created_at
  - Sugestão: hypertable em (timestamp) via TimescaleDB opcional.

Índices:
- culture_inspections(talhao_id, data), (org_id, data).
- sensor_readings(device_id, timestamp), (metric_type, timestamp), índices parciais por quality_flag.

Triggers:
- updated_at nas tabelas principais; validação de faixa para valid_from/valid_to.

RLS:
- culture_inspections e sensor_readings: filtrar por org_id via talhão e organização.

DDL:

```sql
CREATE TABLE culture_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  talhao_id uuid NOT NULL REFERENCES talhoes(id),
  cultura_id uuid NOT NULL REFERENCES culturas(id),
  data timestamptz NOT NULL,
  responsavel_id uuid REFERENCES users(id),
  tipo text NOT NULL, -- 'fitossanidade' | 'fenologia' | ...
  relatorio_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX culture_inspections_org_data_idx ON culture_inspections (org_id, data);
CREATE INDEX culture_inspections_talhao_data_idx ON culture_inspections (talhao_id, data);

CREATE TABLE sensor_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  talhao_id uuid NOT NULL REFERENCES talhoes(id),
  tipo text NOT NULL, -- e.g., 'umidade', 'temperatura', 'ndvi'
  fabricante text,
  modelo text,
  identificador_externo text,
  status text,
  instalado_em timestamptz NOT NULL,
  uninstalled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sensor_devices_org_talhao_idx ON sensor_devices (org_id, talhao_id);

CREATE TABLE sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES sensor_devices(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  metric_type text NOT NULL,
  valor numeric(18,6) NOT NULL,
  unit_id uuid REFERENCES units(id),
  quality_flag text, -- e.g., 'validado'
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sensor_readings_device_ts_idx ON sensor_readings (device_id, timestamp);
CREATE INDEX sensor_readings_metric_ts_idx ON sensor_readings (metric_type, timestamp);
CREATE INDEX sensor_readings_quality_idx ON sensor_readings (quality_flag) WHERE quality_flag = 'validado';

-- Triggers
CREATE TRIGGER culture_inspections_set_updated_at
BEFORE UPDATE ON culture_inspections FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER sensor_devices_set_updated_at
BEFORE UPDATE ON sensor_devices FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();
```

### 5.6 Colheita e produção

Objetivo: planejar e registrar colheita, quantificar produtividade por talhão e variedade e controlar lotes.

Tabelas:
- harvest_plans
  - id, org_id, talhao_id, cultura_id, variedade_id, inicio_previsto, fim_previsto, status, created_at, updated_at
- harvest_operations
  - id, plan_id, inicio, fim, operacao_status, responsavel_id, created_at, updated_at
- harvest_production_records
  - id, operation_id, talhao_id, variedade_id, data, quantidade, unidade_id, teor_umidade, impurezas, lote_id, created_at, updated_at
- production_batches
  - id, org_id, codigo, produto_id, data_producao, volume_total, unidade_id, created_at, updated_at
- production_movements
  - id, lote_id, tipo_movimento, quantidade, unidade_id, destino, observacao, created_at

Índices:
- harvest_production_records(talhao_id, data), (variedade_id, data), (operation_id).
- production_batches(org_id, codigo) unique; (org_id, data_producao).
- production_movements(lote_id, created_at).

Triggers:
- updated_at nas tabelas.
- Consistência de datas (início < fim) via CHECK.

RLS:
- Filtragem por org_id; papéis de operação agrícola habilitam INSERT/UPDATE conforme fluxo.

DDL:

```sql
CREATE TABLE harvest_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  talhao_id uuid NOT NULL REFERENCES talhoes(id),
  cultura_id uuid NOT NULL REFERENCES culturas(id),
  variedade_id uuid REFERENCES variedades(id),
  inicio_previsto timestamptz,
  fim_previsto timestamptz,
  status text NOT NULL DEFAULT 'planejado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX harvest_plans_org_talhao_idx ON harvest_plans (org_id, talhao_id);

CREATE TABLE harvest_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES harvest_plans(id),
  inicio timestamptz,
  fim timestamptz,
  operacao_status text NOT NULL DEFAULT 'em_andamento',
  responsavel_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX harvest_operations_plan_idx ON harvest_operations (plan_id);

CREATE TABLE harvest_production_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid REFERENCES harvest_operations(id),
  talhao_id uuid NOT NULL REFERENCES talhoes(id),
  variedade_id uuid REFERENCES variedades(id),
  data timestamptz NOT NULL,
  quantidade numeric(18,3) NOT NULL,
  unidade_id uuid REFERENCES units(id),
  teor_umidade numeric(5,2),
  impurezas numeric(5,2),
  lote_id uuid REFERENCES production_batches(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX harvest_production_talhao_data_idx ON harvest_production_records (talhao_id, data);
CREATE INDEX harvest_production_variedade_data_idx ON harvest_production_records (variedade_id, data);

CREATE TABLE production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  codigo text NOT NULL,
  produto_id uuid,
  data_producao timestamptz NOT NULL,
  volume_total numeric(18,3),
  unidade_id uuid REFERENCES units(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX production_batches_org_codigo_uq ON production_batches (org_id, codigo);
CREATE INDEX production_batches_org_data_idx ON production_batches (org_id, data_producao);

CREATE TABLE production_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  tipo_movimento text NOT NULL, -- 'entrada' | 'saida' | 'ajuste'
  quantidade numeric(18,3) NOT NULL,
  unidade_id uuid REFERENCES units(id),
  destino text,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX production_movements_lote_idx ON production_movements (lote_id, created_at);

-- Triggers
CREATE TRIGGER harvest_plans_set_updated_at
BEFORE UPDATE ON harvest_plans FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER harvest_operations_set_updated_at
BEFORE UPDATE ON harvest_operations FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER harvest_production_set_updated_at
BEFORE UPDATE ON harvest_production_records FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER production_batches_set_updated_at
BEFORE UPDATE ON production_batches FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

-- Constraints
ALTER TABLE harvest_operations ADD CONSTRAINT harvest_operations_datas_chk
CHECK (inicio IS NULL OR fim IS NULL OR inicio < fim);
```

### 5.7 Clima (eventos, normalização)

Objetivo: registrar eventos climáticos de múltiplas fontes, normalizando unidades e metadados.

Tabelas:
- climate_sources
  - id, org_id, tipo (estacao, satelite, modelo), nome, identificador_externo, metadados_json, created_at, updated_at
- climate_events
  - id, org_id, source_id, occurred_at, event_type, intensidade, unidade_id, localizacao (point geometry), detalhes_json, created_at, updated_at
- climate_event_observations
  - id, event_id, metric_type, valor, unit_id, valid_from, valid_to, created_at
    - Opcional: hypertable em valid_from/valid_to.

Índices:
- climate_events(org_id, occurred_at), (event_type), (source_id).
- GiST em localizacao.
- climate_event_observations(event_id), (metric_type, valid_from).

RLS:
- Filtrar por org_id; integrações de ingestão com papéis de sistema.

DDL:

```sql
CREATE TABLE climate_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  tipo text NOT NULL, -- 'estacao' | 'satelite' | 'modelo'
  nome text NOT NULL,
  identificador_externo text,
  metadados_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX climate_sources_org_idx ON climate_sources (org_id);

CREATE TABLE climate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  source_id uuid REFERENCES climate_sources(id),
  occurred_at timestamptz NOT NULL,
  event_type text NOT NULL, -- 'chuva' | 'geada' | 'granizo' | 'vendaval' | 'seca' | 'inundacao'
  intensidade numeric(18,3),
  unidade_id uuid REFERENCES units(id),
  localizacao geometry(Point, 4674),
  detalhes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX climate_events_org_occurred_idx ON climate_events (org_id, occurred_at);
CREATE INDEX climate_events_type_idx ON climate_events (event_type);
CREATE INDEX climate_events_source_idx ON climate_events (source_id);
CREATE INDEX climate_events_localizacao_gist ON climate_events USING gist (localizacao);

CREATE TABLE climate_event_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES climate_events(id) ON DELETE CASCADE,
  metric_type text NOT NULL, -- e.g., 'precipitacao', 'temp_media', 'temp_min'
  valor numeric(18,6) NOT NULL,
  unit_id uuid REFERENCES units(id),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX climate_event_obs_event_idx ON climate_event_observations (event_id);
CREATE INDEX climate_event_obs_metric_idx ON climate_event_observations (metric_type, valid_from);

-- Triggers
CREATE TRIGGER climate_sources_set_updated_at
BEFORE UPDATE ON climate_sources FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER climate_events_set_updated_at
BEFORE UPDATE ON climate_events FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();
```

### 5.8 Relatórios técnicos (modelos, versões, conteúdo)

Objetivo: padronizar relatórios técnicos com conteúdo estruturado e materializações auditáveis.

Tabelas:
- report_models
  - id, org_id, nome, versao, parametros_json, escopo, created_at, updated_at
- report_versions
  - id, model_id, numero, status, conteudo_json, gerado_em, gerado_por, created_at, updated_at
- report_outputs
  - id, version_id, tipo (csv, pdf, json), arquivo_path, hash_arquivo, created_at
- materialized_report_summaries
  - id, version_id, talhao_id, resumo_json, created_at

Índices:
- report_models(org_id, nome, versao) unique; report_versions(model_id, numero) unique.
- report_outputs(version_id); materialized_report_summaries(version_id, talhao_id).

Triggers:
- updated_at em modelos e versões.
- Conteúdo imutável após “finalized” (trigger prevenir UPDATE em linhas finalizadas).

RLS:
- Filtrar por org_id; distribuição controlada por papéis.

DDL:

```sql
CREATE TABLE report_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  nome text NOT NULL,
  versao text NOT NULL,
  parametros_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  escopo text NOT NULL, -- e.g., 'solo', 'cultura', 'clima'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX report_models_org_nome_versao_uq ON report_models (org_id, nome, versao);

CREATE TABLE report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES report_models(id) ON DELETE CASCADE,
  numero int NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  conteudo_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  gerado_em timestamptz,
  gerado_por uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX report_versions_model_num_uq ON report_versions (model_id, numero);

CREATE TABLE report_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'csv' | 'pdf' | 'json'
  arquivo_path text NOT NULL,
  hash_arquivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_outputs_version_idx ON report_outputs (version_id);

CREATE TABLE materialized_report_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  talhao_id uuid REFERENCES talhoes(id),
  resumo_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX materialized_report_version_talhao_idx ON materialized_report_summaries (version_id, talhao_id);

-- Triggers
CREATE TRIGGER report_models_set_updated_at
BEFORE UPDATE ON report_models FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

CREATE TRIGGER report_versions_set_updated_at
BEFORE UPDATE ON report_versions FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at();

-- Trigger para immutabilidade após finalized
CREATE OR REPLACE FUNCTION trg_prevent_update_on_finalized() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'finalized' AND NEW.status = OLD.status AND NEW.conteudo_json IS DISTINCT FROM OLD.conteudo_json THEN
    RAISE EXCEPTION 'Conteúdo de relatório finalizado não pode ser alterado';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER report_versions_finalized_lock
BEFORE UPDATE ON report_versions
FOR EACH ROW EXECUTE PROCEDURE trg_prevent_update_on_finalized();
```

### 5.9 Auditoria, governança e catálogo

Objetivo: trilha de auditoria por operação DML e catálogo de domínios, integridade por hash.

Tabela de auditoria:
- audit_log
  - id, schema_name, table_name, operation, record_id, user_id, org_id, timestamp, payload_json, hash_integridade

Índices:
- audit_log(table_name, timestamp), (org_id, timestamp).

Triggers:
- Função genérica de log em INSERT/UPDATE/DELETE, harmonizada por tabela principal.

DDL:

```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
  record_id uuid,
  user_id uuid,
  org_id uuid,
  timestamp timestamptz NOT NULL DEFAULT now(),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_integridade text
);
CREATE INDEX audit_log_table_ts_idx ON audit_log (table_name, timestamp);
CREATE INDEX audit_log_org_ts_idx ON audit_log (org_id, timestamp);
```

Exemplo de trigger genérico de auditoria:

```sql
CREATE OR REPLACE FUNCTION trg_audit_row() RETURNS trigger AS $$
DECLARE
  org uuid;
BEGIN
  -- Exemplo simplificado: extrair org_id de uma tabela com coluna org_id
  IF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'soil_samples' THEN
    SELECT ssa.org_id INTO org
    FROM soil_sampling_activities ssa
    WHERE ssa.id = NEW.activity_id;
  ELSE
    org := NEW.org_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (schema_name, table_name, operation, record_id, org_id, payload_json)
    VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id, org, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (schema_name, table_name, operation, record_id, org_id, payload_json)
    VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, NEW.id, org, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (schema_name, table_name, operation, record_id, org_id, payload_json)
    VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, OLD.id, org, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

-- Exemplo de aplicação:
CREATE TRIGGER soil_samples_audit
AFTER INSERT OR UPDATE OR DELETE ON soil_samples
FOR EACH ROW EXECUTE PROCEDURE trg_audit_row();
```

## 6. Relacionamentos e integridade referencial

Chaves estrangeiras e ações:
- Cascata: exclusões em cascata em relacionamentos filho estritos (e.g., soil_samples(activity_id), climate_event_observations(event_id)).
- Restrição: operações que mantêm integridade de referência em domínios (e.g., soil_parameters em soil_analysis_results).
- Set null: campos opcionais com FK (e.g., cultura_padrao_id em talhoes).

Restrições de unicidade e existência:
- Unicidade composital em talhoes (fazenda_id, codigo) e domínios (variedades(cultura_id, nome)).
- CHECKs: profundidades, datas coerentes, e regras de estado (e.g., relatórios finalizados).

Consistência entre tabelas relacionadas:
- Fazer referências explícitas (e.g., production_records → harvest_operations → harvest_plans), garantindo caminhos para RLS por org_id.
- Unificar medidas: campos de quantidade devem referenciar unit_id para garantir语义 correta; tabelas companion de units provêm factor_to_base para conversões.

Tabela-resumo das chaves estrangeiras e ações:

| Origem (tabela.coluna)                               | Destino (tabela.coluna)                   | Ação on delete/update |
|------------------------------------------------------|-------------------------------------------|-----------------------|
| soil_sampling_activities.org_id                      | organizations.id                           | RESTRICT              |
| soil_sampling_activities.talhao_id                   | talhoes.id                                 | CASCADE               |
| soil_samples.activity_id                             | soil_sampling_activities.id                | CASCADE               |
| soil_analysis_results.sample_id                      | soil_samples.id                            | CASCADE               |
| soil_analysis_results.parameter_id                   | soil_parameters.id                         | RESTRICT              |
| culture_inspections.talhao_id                        | talhoes.id                                 | CASCADE               |
| culture_inspections.cultura_id                       | culturas.id                                | RESTRICT              |
| sensor_devices.talhao_id                             | talhoes.id                                 | CASCADE               |
| harvest_plans.talhao_id                              | talhoes.id                                 | CASCADE               |
| harvest_operations.plan_id                           | harvest_plans.id                           | CASCADE               |
| harvest_production_records.operation_id              | harvest_operations.id                      | SET NULL              |
| production_batches.org_id                            | organizations.id                           | RESTRICT              |
| production_movements.lote_id                         | production_batches.id                      | CASCADE               |
| climate_events.source_id                             | climate_sources.id                         | RESTRICT              |
| climate_event_observations.event_id                  | climate_events.id                          | CASCADE               |

Check constraints por tabela:

| Tabela                     | Regra                                                                              |
|---------------------------|-------------------------------------------------------------------------------------|
| soil_samples              | profundidade_cm > 0                                                                 |
| harvest_operations        | inicio IS NULL OR fim IS NULL OR inicio < fim                                      |
| report_versions           | Imutabilidade após status = 'finalized' (trigger)                                  |
| climate_events            | intensidade >= 0                                                                    |
| sensor_readings           | timestamp não nulo; valor não nulo                                                 |

## 7. Índices, particionamento e otimização de consultas

Estratégias de indexação:
- Índices BTREE para chaves e filtros usuais (org_id, talhao_id, data).
- Índices parciais para estados desejados (quality_flag = 'validado'), reduzindo tamanho e melhorando desempenho.
- Índices por expressão em campos JSONB (e.g., relatorio_json->>'tipo'), se a consulta exigir.
- Índices GiST para geometrias (talhoes.geometria, climate_events.localizacao).
- Consultas de cobertura: considerar INCLUDE em índices para colunas frequently selected sem custos excessivos de manutenção.

Plano de índices por tabela:

| Tabela                     | Índice                                      | Justificativa                                           | Impacto esperado                         |
|---------------------------|---------------------------------------------|---------------------------------------------------------|------------------------------------------|
| organizations             | name (unique)                               | Lookup por nome                                         | Baixa latência em catalogações           |
| user_org_roles            | (user_id, org_id, role_id) unique           |Autorização rápida e uniqueness                         |Melhoria em checks de permissão           |
| talhoes                   | USING gist (geometria)                      |Consultas espaciais (interseção, proximidade)           |Acelera geosqueries                       |
| soil_samples              | (activity_id, codigo) unique                |Rastreabilidade por amostra                              |Prevenção de duplicidade + busca rápida   |
| soil_analysis_results     | (sample_id), (parameter_id, method_id), parcial por qualidade |Filtros por amostra, parâmetro e validação |Consultas laboratoriais otimizadas        |
| culture_inspections       | (org_id, data), (talhao_id, data)           |Timeline por organização e talhão                        |Listagens cronológicas rápidas            |
| sensor_readings           | (device_id, timestamp), (metric_type, timestamp), parcial por qualidade |Séries temporais e filtragem por validação |Performance em leituras e dashboards      |
| harvest_production_records| (talhao_id, data), (variedade_id, data), (operation_id) |Produtividade e agregações por variedade/talhão |Dashboards de colheita eficientes         |
| production_batches        | (org_id, codigo) unique, (org_id, data_producao) |Controle de lotes por org e tempo                       |Rastreabilidade de lotes                  |
| climate_events            | (org_id, occurred_at), (event_type), USING gist (localizacao) |Filtro temporal/tipo e geosqueries                      |Análises climáticas com mapas             |
| report_versions           | (model_id, numero) unique                   |Versionamento correto                                    |Evita duplicidades e acelera retrieval    |
| audit_log                 | (table_name, timestamp), (org_id, timestamp) |Auditoria e troubleshooting                              |Busca temporal por tabela e organização   |

Particionamento temporal:
- Tabelas candidatas: sensor_readings, climate_events, climate_event_observations, audit_log.
- Estratégia: partições mensais (ou trimestrais, conforme volume) por campo timestamp (timestamp, occurred_at, valid_from).
- Manutenção: criação automática de partições, compressão (TimescaleDB opcional), e politicas de retenção por partição.

Trades-offs:
- Índice parcial: reduz manutenção e tamanho, mas requer queries alinhadas ao predicate.
- JSONB index por expressão: acelera campos específicos, mas aumenta custo de写入;usar com parcimônia.
- Partições: melhoram performance de escrita/leitura por janela, mas complexificam maintenance (vacuum, analyze, reindex) e requerem planejamento de agregação e indexes nas partições filhas.

Vacuum/Analyze:
- Ajustar configurações para tablas particionadas; garantir que analyze rode regularmente para estimativas do planner.
- Reindex programado em índices GiST após grandes operações de carga.

## 8. Triggers, validações e processamento de eventos

Padrões de triggers:
- updated_at: aplicado transversalmente.
- Audit trail: log de DML com payload_json, capturando old/new.
- Integridade e hash: cálculo de hash de integridade para tabelas críticas (e.g., soil_samples), a partir de campos determinísticos (e.g., activity_id, codigo, coleta_em, profundidade_cm, ponto_geometria).

Exemplo de trigger de hash de integridade em soil_samples:

```sql
CREATE OR REPLACE FUNCTION trg_compute_integrity_hash() RETURNS trigger AS $$
BEGIN
  NEW.hash_integridade := encode(
    digest(
      concat_ws('|',
        NEW.activity_id::text,
        NEW.codigo,
        NEW.coleta_em::text,
        NEW.profundidade_cm::text,
        ST_AsText(NEW.ponto_geometria)
      ), 'sha256'
    ), 'hex'
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER soil_samples_integrity_hash
BEFORE INSERT OR UPDATE ON soil_samples
FOR EACH ROW EXECUTE PROCEDURE trg_compute_integrity_hash();
```

Validações customizadas:
- soil_analysis_results: verificar ranges plausíveis por unidade e parâmetros; ou validação por JOIN com limites quando disponível textura_classe.
- culture_inspections: garantir relatorio_json com chaves esperadas pelo modelo de inspeção.
- harvest_operations: datas consistentes e status coerente com eventos posteriores.

Orquestração e processamento de eventos:
- Consumir eventos de produção e clima para atualizar materialized views de produtividade e alertas (e.g., geadas).
- Encadeamento de triggers: atualizar materialized views em background após novas inserções em harvest_production_records.

## 9. Segurança e Row Level Security (RLS)

Modelo de segurança:
- Entidade organizacional: controle por org_id.
- Papéis: administrativo, agronomista, técnico de campo, analista de laboratório, visualizador.
- Contexto de sessão: custom claims em token (e.g., org_id ativo, lista de papéis).

Princípios RLS:
- Privilégios mínimos: papéis con access-only ao que pertece à organização e escopo.
- Negação por padrão: sem polity explícita, acesso negado.
- Agregados: materialized views com RLS herdarão políticas ao serem consultadas,devendo replicar condições.

Exemplos de políticas:

```sql
-- Habilitar RLS
ALTER TABLE soil_samples ENABLE ROW LEVEL SECURITY;

-- Política: SELECT permite ler amostras da mesma organização do talhão
CREATE POLICY soil_samples_org_select ON soil_samples
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM soil_sampling_activities ssa
      JOIN talhoes t ON t.id = ssa.talhao_id
      WHERE ssa.id = soil_samples.activity_id
        AND t.fazenda_id IN (
          SELECT f.id FROM fazendas f WHERE f.org_id = current_setting('app.current_org_id')::uuid
        )
    )
  );

-- Política: INSERT/UPDATE/DELETE por papéis agronômicos/laboratoriais
CREATE POLICY soil_samples_org_write ON soil_samples
  FOR ALL
  USING (
    current_setting('app.current_roles', true) ~ 'agronomo|laboratorio'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM soil_sampling_activities ssa
      JOIN talhoes t ON t.id = ssa.talhao_id
      WHERE ssa.id = soil_samples.activity_id
        AND t.fazenda_id IN (
          SELECT f.id FROM fazendas f WHERE f.org_id = current_setting('app.current_org_id')::uuid
        )
    )
  );
```

Matriz de políticas por tabela (resumo):

| Tabela                     | Operação | Condição principal                                                     | Papéis permitidos                 | Observações                                         |
|---------------------------|----------|------------------------------------------------------------------------|-----------------------------------|-----------------------------------------------------|
| organizations             | SELECT   | TRUE                                                                     | tech_role                         | Catálogo; leitura pública controlada               |
| users                     | SELECT   | user_id = auth.uid() ou papel administrativo                            | admin, tech_role                  | Filtrar por contexto organizacional                 |
| user_org_roles            | ALL      | EXISTS SELECT 1 com user_id = auth.uid() e papel admin                  | admin                             | Escrita restrita                                   |
| fazendas                  | ALL      | org_id = current org e papel agronomia/admin                            | admin, agronomo                   | Escopo por organização                             |
| talhoes                   | ALL      | via fazenda org_id                                                       | admin, agronomo, tecnico_campo    | Consultas espaciais com GiST                       |
| soil_sampling_activities  | ALL      | org_id = current org                                                     | admin, agronomo, laboratorio      | Laboratórios podem iniciar amostragens             |
| soil_samples              | ALL      | via activity_id e talhão org_id                                          | agronomo, laboratorio             | Hash de integridade obrigatório                    |
| soil_analysis_results     | ALL      | via sample_id → activity_id → org_id                                     | agronomo, laboratorio             | Índices parciais por qualidade                     |
| culture_inspections       | ALL      | org_id = current org                                                     | agronomo, tecnico_campo           | Relatórios JSONB                                   |
| sensor_readings           | ALL      | via device_id → talhão → org_id                                          | agronomo, tecnico_campo           | TimescaleDB opcional                               |
| harvest_plans/operations  | ALL      | via talhão → org_id                                                      | admin, agronomo                   | Consistência temporal via check                    |
| harvest_production_records| ALL      | via talhão/operation → org_id                                            | admin, agronomo                   | Agregações por talhão/variedade                    |
| production_batches        | ALL      | org_id = current org                                                     | admin, agronomo                   | Rastreabilidade de lote                            |
| climate_sources/events    | ALL      | via org_id ou source global                                              | admin, agronomo                   | Fontes por organização                             |
| report_versions/outputs   | ALL      | via model_id → org_id                                                    | admin, agronomo, visualizador     | Finalizados imutáveis                              |
| audit_log                 | SELECT   | org_id = current org                                                     | admin, auditor                    | Escrita apenas por triggers                        |

Proteção adicional:
- Criptografia em trânsito (TLS) e recomendações de criptografia em repouso (e.g.,disk-level).
- Segregação de chaves, acesso mínimo aos ambientes operacionais, segregação de funções (desenv, dba, app).
- Gestão de dados pessoais conforme LGPD/GDPR: identificar PII e aplicar retenções.

## 10. Geospatial e séries temporais (extensões PostGIS/TimescaleDB)

PostGIS:
- Uso de geometry/geography com SRID definido (e.g., SIRGAS 2000/UTM).
- Indexação GiST em talhoes.geometria e climate_events.localizacao.
- Consultas espaciais: interseção de eventos com talhões; proximidade de sensores; cálculo de áreas e centroides.
- Exemplo de consulta: selecionar eventos de chuva que intersectam um talhão:

```sql
SELECT ce.*
FROM climate_events ce
JOIN talhoes t ON t.id = :talhao_id
WHERE ce.event_type = 'chuva'
  AND ST_Intersects(t.geometria, ce.localizacao);
```

TimescaleDB (opcional):
- Conversão de sensor_readings e climate_event_observations em hypertables:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => true);
SELECT create_hypertable('climate_event_observations', 'valid_from', if_not_exists => true);
```
- Políticas de retenção e compressão (configuráveis por janela e organização).

Boas práticas:
- Harmonizar SRIDs e sistemas de referência;evitar reprojeções desnecessárias.
- Simplificar geometrias para índices eficientes;manter precisão conforme necessidade analítica.

## 11. Preparação para IA (armazenagem de features, modelos, execuções)

Estruturas para aprendizado de máquina:
- ml_models: metadados de modelos (nome, versão, framework, parâmetros, escopo, trained_at).
- ml_model_artifacts: binários/artefatos (caminho, hash, tamanho).
- ml_training_datasets: datasets usados (source tables, filtros, período, features).
- ml_training_runs: execuções (model_id, started_at, ended_at, métricas_json).
- ml_inferences: previsões (model_id, input_hash, output_json, score, created_at).
- ml_feature_store: features derivadas (feature_key, escopo, valor, origem, período, hash).

Tabela de metadados de modelos (exemplo):

| Campo            | Descrição                                               |
|------------------|---------------------------------------------------------|
| id               | UUID                                                    |
| nome             | Nome do modelo                                          |
| versao           | Versão                                                  |
| framework        | Framework (e.g., scikit-learn, TensorFlow)              |
| escopo           | Domínio (solo, cultura, clima, produção)                |
| hyperparameters  | JSON com hiperparâmetros                                |
| metrics          | JSON com métricas (RMSE, F1, etc.)                      |
| trained_at       | Data/hora do treinamento                                |
| created_at       | Timestamp de criação                                    |

Observações:
- Separar features de outputs para reprodutibilidade (input_hash + parametros).
- Definir lineage por tabelas de origem (e.g., soil_analysis_results, climate_events, sensor_readings).

## 12. Migração, versionamento e governança de dados

Versionamento de schema:
- Use migrações versionadas (e.g., arquivos SQL com timestamps ou hashes).
- Estratégia blue/green ou rolling para mudanças compatíveis.
- Backfill de dados para colunas新增 e validações.

Estratégia de migração:
- Criar novas colunas com defaults seguros.
- Preencher dados via jobs transacionais;garantir integridade.
- Alternar leitura para novas colunas após validação;remover antigas conforme política.

Backfill:
- Exemplo: popular unidade_id em registros legados;mapear symbol → unit_id.
- Log de auditoria em cada batch.

Retenção e archival:
- Definir políticas por classe de dados (e.g., sensor_readings 24 meses; audit_log 12 meses; relatórios finalizados permanentes).
- Arquivamento para cold storage (e.g., partições antigas movidas para tablespaces frias).

Plano de migração por release (exemplo):

| Change id | Descrição                                          | Tabelas afetadas                  | Risco   | Estratégia de rollback                    |
|-----------|----------------------------------------------------|-----------------------------------|---------|-------------------------------------------|
| M-001     | Adicionar coluna unit_id em sensor_readings        | sensor_readings                   | Médio   | Remover coluna após migração; backup      |
| M-002     | Particionar climate_events por mês                 | climate_events                    | Alto    | Reverter para tabela única; reindex       |
| M-003     | Habilitar RLS em soil_samples                      | soil_samples, soil_sampling_...   | Alto    | Desabilitar RLS e policy; restaurar acesso|

## 13. Testes, dados de exemplo e validação

Testes de integridade:
- FKs: tentar inserir resultado sem amostra;deve falhar.
- CHECKs: inserir soil_samples com profundidade negativa;deve falhar.
- Unicidade: inserir talhão com mesmo código para a mesma fazenda;deve falhar.

Testes de performance:
- Bulk insert: 1M linhas em sensor_readings;medir tempo e índices.
- Consultas:
  - Geosqueries: interseção de 10k eventos com 5k talhões.
  - Agregações: produtividade por talhão e variedade no último trimestre.
  - Filtragens: resultados de solo por parâmetro e data com qualidade validada.

Testes de segurança RLS:
- Usuário sem acesso à organização: todas as consultas retornam vazio.
- Papel visualizador: apenas SELECT nas tabelas permitido.
- Tentativa de UPDATE em relatório finalizado: deve falhar pelo trigger.

Suite de testes por domínio:

| Domínio   | Caso de teste                                      | Esperado                                              |
|-----------|------------------------------------------------------|-------------------------------------------------------|
| Solo      | Inserir amostra com profundidade negativa            | Erro por CHECK                                       |
| Solo      | Inserir resultado com unit_id inexistente            | Erro por FK                                          |
| Cultura   | Consulta inspeções por talhão em período             | Retorna conjunto correto                              |
| Produção  | Agregar produtividade por variedade                  | Resultado consistente (quantidade/unidade)            |
| Clima     | Interseção de eventos com talhão                     | Retorna eventos dentro da geometria                   |
| Relatórios| Atualizar conteúdo de relatório finalizado           | Erro por trigger; registro inalterado                 |
| RLS       | Usuário de outra organização acessando amostras      | Nenhum registro retornado                             |

## 14. Operação, monitoramento e métricas

Monitoramento:
- Bloat e vacuum: acompanhar eficácia de vacuum e índices inchados.
- Latência de consultas: queries críticas em dashboards de solo/produção.
- Atraso de ingestão: tempo entre sensor_readings arriving e disponibilidade em materialized views.
- Integridade de dados: taxa de falhas de FK e CHECK; auditorias de hash.

Alertas:
- Erros de triggers (e.g., falha no cálculo de hash).
- Políticas RLS impedindo operações legitimas (spikes em zero-rows).
- Partições ausentes para novas janelas temporais.

Sondas (health checks) e KPIs:

| Métrica                              | Objetivo                 | Limiar de alerta             |
|--------------------------------------|--------------------------|------------------------------|
| bloat médio em índices críticos      | < 20%                    | > 40%                        |
| tempo médio de query de geos         | < 300 ms                 | > 800 ms                     |
| atraso de ingestão em sensor_readings| < 2 min                  | > 10 min                     |
| falhas de FK por dia                 | 0                        | > 10                         |
| latência de write por transação      | < 50 ms                  | > 150 ms                     |

Tarefas de manutenção:
- Vacuum/Analyze programado (ajustado por tabela).
- Reindex em GiST e índices de alta atualização.
- Criação preventiva de partições mensais.
- Refresh de materialized views (e.g., diária).

## 15. Roadmap de implementação e próximos passos

Entregas por fase:
- Fase 1: Domínios de referência e áreas/talhões; RLS base; índices essenciais; triggers updated_at.
- Fase 2: Solo (amostragens, amostras, resultados); RLS completo; testes de integridade; materialized views de validação.
- Fase 3: Cultura e sensores; índices parciais; consultas de geos; integração PostGIS.
- Fase 4: Colheita e produção; agregados por talhão/variedade; dashboards operacionais.
- Fase 5: Clima; normalização; geosqueries; políticas de retenção; particionamento.
- Fase 6: Relatórios técnicos; conteúdo imutável; outputs e materializações.
- Fase 7: Auditoria e governança; hash de integridade; catálogo completo.
- Fase 8: IA — modelos, artefatos, runs e feature store.

Critérios de aceitação:
- Conformidade com modelo relacional e RLS.
- Cobertura de testes ≥ 85% em integridade e segurança.
- Performance SLO atende parâmetros definidos (a completar).

Backlog técnico:
- Extensões (PostGIS, TimescaleDB).
- Dashboards operacionais (monitoramento e qualidade).
- Pipelines de ingestão de clima e sensores.
- Automação de migrações e criação de partições.

Responsabilidades e cronograma:
- DBA/Engenheiro de Dados: índices, particionamento, RLS, migrações.
- Desenvolvedor Backend: triggers, validações, endpoints.
- Engenheiro GIS: PostGIS, consultas espaciais.
- Analista de Segurança: políticas, testes de penetração.
- Produto/QA:验收 de domínio e testes funcionais.

Tabela de entrega por fase (exemplo):

| Fase | Escopo principal                                         | Responsáveis           | Entregáveis                              |
|------|----------------------------------------------------------|------------------------|-------------------------------------------|
| 1    | Referências, áreas/talhões, RLS base                     | DBA, Backend, Segurança| Tabelas e políticas iniciais              |
| 2    | Solo completo e testes                                   | Backend, QA            | DML/DDL, testes de integridade            |
| 3    | Cultura, sensores e PostGIS                              | Eng. GIS, Backend      | Geosqueries, índices GiST                 |
| 4    | Colheita/produção e agregados                            | Backend, QA            | Materialized views e dashboards           |
| 5    | Clima e particionamento                                  | DBA, Backend           | Hypertables/partições, retenção           |
| 6    | Relatórios técnicos                                      | Backend, Produto       | Conteúdo imutável e outputs               |
| 7    | Auditoria e governança                                   | DBA, Segurança         | Triggers de audit e hash de integridade   |
| 8    | IA (modelos, execuções, features)                        | Data/Eng. ML           | Metadados e store de features             |

## Lacunas de informação a parametrizar

Para completar e calibrar o projeto, os seguintes parâmetros são necessários:
- Volume esperado por tabela (registros/dia/mês), retenção e janelas de consulta.
- SLOs de latência e throughput por operação crítica (ingestão de sensores, geração de relatórios).
- Escopo geográfico e SRID preferido;regulamentações de residência de dados e PII.
- Níveis de isolamento transacional e políticas de concorrência e bloqueios.
- Papéis e processos de aprovação para relatórios técnicos e acesso a dados sensíveis.
- Requisitos de auditoria (quem, quando, quais operações).
- Modelos de cultivo, culturas e parâmetros de solo específicos; limites de referência por textura/região.
- Fontes e formatos de dados climáticos (estações, satélites, APIs) e política de ingestão.
- Necessidades de IA (tipos de modelos, horizontes, features, outputs, Ciclo MLOps).
- Preferência por extensões (TimescaleDB para séries temporais e PostGIS para geospatial).
- Ambiente operacional (versão do PostgreSQL, configuração de conexão, cloud/DBaaS).
- Necessidades de internacionalização (idiomas, unidades).

## Considerações finais

O blueprint proposto fornece uma base sólida para uma plataforma agronômica moderna, combinando rigor de dados, segurança por linha e desempenho em consultas críticas. Ao incorporar particionamento temporal e extensões, o schema está preparado para escalar, ao mesmo tempo que mantém governança e auditabilidade. A integração com IA é facilitada por estruturas explícitas de modelos, execuções e store de features, permitindo evolução orgânica da solução. O sucesso do projeto depende de parametrizar as lacunas de informação e aderir ao roteiro incremental de implementação, com validação contínua por testes e monitoramento operacional.