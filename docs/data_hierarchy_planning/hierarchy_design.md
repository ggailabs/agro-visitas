# Blueprint de Planejamento: Estruturas Hierárquicas de Dados para Fazenda → Área → Talhão → Visita Técnica → Análises Específicas

## Resumo Executivo

Este blueprint define um modelo de dados hierárquico e temporal para sistemas agrícolas, centrado na cadeia fazenda → área → talhão → visita técnica → análises específicas, com extensões para histórico de cultivos/rotação e eventos climáticos. O objetivo é prover um projeto lógico e físico de dados orientado a performance, escalabilidade e governança, capaz de suportar análises históricas consistentes e rastreáveis ao longo de ciclos produtivos.

A arquitetura proposta combina:
- Um núcleo transacional normalizado em banco relacional, com suporte geoespacial para geometrias de área e talhão (PostGIS), garantindo integridade referencial e capacidade de consultas espaciais eficientes[^1][^2].
- Estratégias de particionamento e índices cuidadosamente desenhados para as tabelas de maior volume (visitas técnicas e análises específicas), minimizando latência e custo total de ownership[^9][^10].
- Um data warehouse (DWH) escalável em camadas, com modelagem em estrela para relatórios operacionais e científicos, integrando séries temporais climáticas e histórico de cultivos/rotação[^4].
- Fluxos de integração e harmonização de dados (incluindo séries temporais de sensoriamento remoto) para atualização incremental, auditoria e reprodutibilidade de análises[^5][^6].
- Práticas de governança (catálogo, lineage, dicionário de dados, políticas de retenção e segurança) para assegurar qualidade e conformidade[^3].

Resultados esperados: consultas rápidas por contexto hierárquico-temporal, cubes OLAP para indicadores-chave (recursos, manejo, produtividade), integração fluida com GIS e APIs, e um pipeline histórico que sustenta análises de rotação, variabilidade espaço-temporal de yields e inferências de solo e clima[^1][^4][^5]. Lacunas de informação (volumes, SLOs, catálogos oficiais de solo e clima) são explicitadas para viabilizar a calibração final do projeto físico.

## Princípios de Design e Requisitos

O design parte de princípios pragmáticos, alinhados ao estado da arte em dados agrícolas e engenharia de banco de dados:

- Hierarquia como espinha dorsal. A cadeia fazenda → área → talhão define o contexto geográfico e operacional. Toda observação (visita, análise, clima, cultivo) é ancorada a esse contexto e a um período de validade, preservando histórico e auditabilidade[^3][^4].
- Geometrias como primeiros cidadãos. Áreas e talhões são polígonos com referência espacial, índice geoespacial e metadados (SRID, precisão), permitindo consultas espaciais, sobreposições e agregações por agregado geográfico[^1].
- Temporalidade 版本ada. Campos de validade (valido_de, valido_ate), versão e comprovação (source_system, created_at/updated_at) asseguram reprodutibilidade, análises históricas e reconciliação de mudanças de fronteira e manejo[^4].
- Dados e metadados padronizados. Dicionários de códigos para solo e clima, unidades, métodos e instrumentação, conectados a catálogos reconhecidos, elevam a interoperabilidade e a qualidade das análises[^5][^7].
- Performance por design. Particionamento por tempo, índices por chaves hierárquicas e espaciais, materializações de agregados e pré-computação de KPIs minimizam latência de leitura e custo de manutenção[^9][^10].
- Observabilidade e governança. Monitoramento contínuo, relatórios de capacidade, tags e templates operacionais permitem operar em escala com governança robusta[^11].

Requisitos funcionais essenciais:
- CRUD de contexto hierárquico (fazenda, área, talhão) com geometrias válidas e metadados.
- Registro de visita técnica e associado de análises específicas (solo, planta, clima, produtividade).
- Rastreamento temporal de cultivos/rotação por talhão e vínculo a eventos climáticos.
- Consultas por janela temporal, agregações por nível hierárquico e filtros espaciais.
- Relatórios analíticos (OLAP) e exportação para GIS e ciência de dados.

Requisitos não funcionais:
- Latência alvo por tipo de consulta (alvo a definir), throughput sustentado para ingestão, disponibilidade e segurança.
- Escalabilidade horizontal e vertical, com estratégias de particionamento e retenção por categoria de dado.
- Conformidade com práticas de governança e compartilhamento responsável de dados agrícolas[^3].

Assunções e lacunas de informação:
- Volumes por entidade, frequência de visitas/analises, granularidade e fontes climáticas, catálogo de análises e padrões de acesso não foram informados; o plano indica onde esses parâmetros são necessários para ajustes finos de particionamento e índices.

## Modelo Conceitual Hierárquico

A hierarquia principal segue a agregação geográfica e operacional: fazenda ⊃ área ⊃ talhão. As entidades de suporte (visit, analysis, measurement) adicionam contexto operacional e científico. Cultivos/rotação e eventos climáticos vinculam-se ao talhão com janelas temporais explícitas. Geometrias de talhão e área são persistidas e indexadas para consultas espaciais. A seguir, o mapa de entidades e relacionamentos resume cardinalidades e chaves.

Para orientar a leitura, a Tabela 1 apresenta um overview das entidades e relacionamentos principais, com chaves e cardinalidades.

Tabela 1 — Mapa de entidades e relacionamentos (conceitual)

| Entidade               | Chaves principais                              | Relacionamentos                                                     | Cardinalidade                     |
|------------------------|-----------------------------------------------|---------------------------------------------------------------------|-----------------------------------|
| Fazenda                | fazenda_id (PK)                                | Áreas pertencentes à fazenda                                        | 1:N (Fazenda→Área)                |
| Área                   | area_id (PK), fazenda_id (FK)                  | Talhões pertencentes à área; geometria (Polygon)                    | 1:N (Área→Talhão)                 |
| Talhão                 | talhao_id (PK), area_id (FK)                   | Geometria (Polygon); Visitas; Análises; Cultivos; Clima             | 1:N (Talhão→Visita/Análise/Culto/Clima) |
| Visita Técnica         | visita_id (PK), talhao_id (FK)                 | Análises específicas vinculadas                                     | 1:N (Visita→Análise)              |
| Análise Específica     | analise_id (PK), visita_id (FK)                | Medições (chave composto por escopo+indicador+unidade+metodo)       | 1:N (Análise→Measurement)         |
| Medição                | (analise_id+escopo+indicador+unidade+metodo+timestamp) (CK) | Valores observados/calculados, com metadados de qualidade          | N:1 (Measurement→Análise)         |
| Cultivo/Rotação        | rotacao_id (PK), talhao_id (FK)                | Sequências de cultivo com validades e práticas de manejo            | 1:N (Talhão→Rotação)              |
| Evento Climático       | clima_id (PK), talhao_id (FK)                  | Séries temporais (ponto/polígono), fonte e método de agregação      | 1:N (Talhão→Clima)                |
| Geometria              | (talhao_id/area_id) + valid_time               | Polígonos com SRID e precisão, versionamento de fronteiras          | 1:N por entidade com temporalidade |

Observações de design:
- Todas as observações trazem campos de validade temporal e origem (source_system), viabilizando análises por janela e auditoria de mudanças.
- Cultivos e eventos climáticos vinculam-se a talhão com timestamps e, quando aplicável, geometrias (para clima) que permitem reprojetar análises no espaço e no tempo[^5][^1].

### Hierarquia principal (fazenda → área → talhão)

Definições operacionais e metadados mínimos:
- Fazenda: identificador único, nome, localização, propriedades administrativas e operacionais. Pode carregar uma geometria agregada para contexto.
- Área: subunidade organizacional da fazenda, com geometria Polígono, SRID, data de levantamento, método de aquisição, e precisão.
- Talhão: unidade mínima de manejo, com geometria Polígono, SRID, data de delimitação e histórico de ajustes. Em contextos de agricultura de precisão, talhões são often dinâmica e espacialmente heterogêneos, requerendo versionamento geoespacial para análises consistentes[^1][^2].

A Tabela 2 resume atributos mínimos por nível.

Tabela 2 — Atributos mínimos por nível hierárquico

| Nível   | Atributos essenciais                                                                                 |
|---------|------------------------------------------------------------------------------------------------------|
| Fazenda | fazenda_id, nome, localização, propietario, contact, source_system, created_at, updated_at           |
| Área    | area_id, fazenda_id, nome, geom (Polygon), srid, data_levantamento, metodo_aquisicao, precisao, source_system, created_at, updated_at |
| Talhão  | talhao_id, area_id, codigo_interno, geom (Polygon), srid, data_delimitacao, metodo, precisao, source_system, created_at, updated_at |

### Visita Técnica e Análises Específicas

A visita técnica registra o contexto da avaliação de campo (data, responsável, objetivo, notes) e ancora análises específicas: solo (químicos, físicos, biológicos), tecido vegetal, produtividade/colheita e clima local. As análises carregam escopo (solo, planta, produtividade, clima), método, unidade, referência técnica e vínculo a medição com valor, timestamp e metadados de qualidade.

Tabela 3 — Catálogo de análises e metadados obrigatórios

| Análise (escopo)   | Exemplos de indicadores                              | Metadados mínimos (método/unidade/faixa_ref/código_lab)                                  |
|--------------------|-------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Solo               | pH, MO, P, K, Ca, Mg, Al, V%, CTC, densidade, textura | método (ex.: Mehlich-1), unidade, faixa_ref, laboratório/código_lab, data_coleta,geometria_amostra |
| Tecido Vegetal    | N, P, K, Ca, Mg, micronutrientes                      | protocolo, unidade, limiar, laboratório, data_coleta                                      |
| Produtividade      | rendimento, umidade, biomassa                         | metodologia (ex.: mapa de colheita), unidade, método_calibração, data                     |
| Clima Local        | temp, umidade, chuva, vento                           | instrumento, calibracao, unidade, timestep, fonte (estação/sensor)                        |

Nota: O catálogo final de análises deve seguir diretrizes de padronização e metadados científicos para sustentar interoperabilidade e reprodutibilidade[^7].

### Histórico de Cultivos e Rotação

O cultivo é registrado por talhão e janela temporal (início/fim), com espécie/cultivar, manejo (irrigação, preparo, cobertura), produtividade e eventos associados. A rotação é inferida por sequência temporal de cultivos, com checagem de regras agronômicas e validações. Isso é fundamental para modelos de solo (ex.: carbono orgânico) e diagnóstico de manejo de longo prazo[^5][^14].

Tabela 4 — Estrutura de rotação (registro e validação)

| Campo                     | Descrição                                                                 |
|--------------------------|---------------------------------------------------------------------------|
| rotacao_id               | Identificador                                                             |
| talhao_id                | Talhão (FK)                                                               |
| cultivo_id               | Identificador do cultivo (espécie/cultivar)                               |
| data_inicio / data_fim   | Janela temporal do cultivo                                                |
| manejo                   | irrigação, preparo, cobertura, adubação                                   |
| produtividade            | valor e unidade                                                           |
| validacao_regras         | flags/observações de regras agronômicas (ex.: janela mínima, sucesso)     |
| source_system            | Origem do registro                                                        |

### Eventos Climáticos

Eventos climáticos devem ser coletados com granularidade consistente (por talhão ou área agregada) e vinculados a séries temporais e, quando relevante, a geometrias (ex.: raster ou polígonos interpolados). A matriz de variáveis climáticas e parâmetros de qualidade segue as necessidades dos modelos agronômicos e das análises estatísticasspace-time[^8][^5].

Tabela 5 — Matriz de variáveis climáticas e metadados

| Variável | Granularidade | Unidade | Passo temporal | Fonte           | Metodologia de agregação             |
|----------|----------------|---------|----------------|-----------------|--------------------------------------|
| Chuva    | Talhão/Área    | mm      | Diário/horário | Estação/sensor  | Somatório;cheia de dados; interpolação |
| Temp.    | Talhão/Área    | °C      | Diário/horário | Estação/sensor  | Média/mín/máx; gap-fill              |
| Umidade  | Talhão/Área    | %       | Diário/horário | Estação/sensor  | Média; QA/QC                         |
| Vento    | Talhão/Área    | m/s     | Diário/horário | Estação/sensor  | Média; rajadas                       |
| Radiação | Talhão/Área    | MJ/m²   | Diário         | Estação/sensor  | Somatório                            |

Observação: Seleção final de variáveis, granularidade e políticas de QA/QC depende das fontes climáticas disponíveis (lacuna de informação).

## Modelo Lógico de Dados (Núcleo Transacional)

O núcleo relacional preserva integridade referencial e viabiliza consultas hierárquicas e temporais eficientes. Chaves substitutas (UUIDs ou bigserial) são utilizadas para facilitar replicação e evolução; chaves naturais (códigos internos) são guardadas como atributos únicos.

- Chaves e integridade: PKs e FKs em todas as relações, constraints de unicidade, checks de validez (ex.: valido_de ≤ valido_ate). Tabelas com geometrias contam com constraints espaciais e SRID definido[^1][^2].
- Temporalidade: colunas valido_de/valido_ate, version (int ou UUID), source_system, created_at/updated_at, e campos de auditoria (created_by/updated_by) em todas as entidades históricas.
- Geometrias: uso de PostGIS (geometry/geography) para polígonos de área e talhão; índices espaciais (GiST/BRIN) conforme padrão de consulta[^1][^2].

A Tabela 6 resume as tabelas e chaves lógicas principais.

Tabela 6 — Resumo de tabelas e chaves (núcleo relacional)

| Tabela              | PK                  | FKs                            | Unicidade/Constraints principais                               |
|---------------------|---------------------|--------------------------------|-----------------------------------------------------------------|
| fazendas            | fazenda_id          | —                              | nome_fazenda único por owner/organização                        |
| areas               | area_id             | fazenda_id                     | (fazenda_id, nome) único; geom Polígono; srid check             |
| talhoes             | talhao_id           | area_id                        | (area_id, codigo_interno) único; geom Polígono; srid check      |
| visitas             | visita_id           | talhao_id                      | data_visita não nula; responsável não nulo                      |
| analises            | analise_id          | visita_id                      | (visita_id, escopo, tipo) único; método/unidade não nulos       |
| medicoes            | (analise_id, indicador, timestamp, metodo) | analise_id | valor numérico; flags de qualidade; timestamp não nulo          |
| rotacoes            | rotacao_id          | talhao_id                      | (talhao_id, data_inicio) único; data_fim ≥ data_inicio          |
| cultivos            | cultivo_id          | talhao_id                      | (talhao_id, especie/cultivar, janela) sem sobreposição crítica  |
| clima_eventos       | clima_id            | talhao_id                      | timestep não nulo; geom opcional; (talhao_id, timestep) único   |
| clima_series        | serie_id            | talhao_id/area_id              | (local_id, timestep) único; valor numérico; metadados QA/QC     |

Padrões DDL e transações seguem boas práticas established em implementações de bancos de dados agrícolas e SQL relacional[^12][^13].

### Esquema Geoespacial

- Geometrias: polígonos para áreas e talhões, com SRID compatível ao sistema de referência local; metadados de aquisição, precisão e método de levantamento. Versionamento de fronteiras por valido_de/valido_ate e version.
- Operações: validações de geometria (ST_IsValid), simplificação e suavização conforme precisão alvo; cálculo de área e perímetro para KPIs e normalizações[^1].
- Restrições: manutenção de referência espacial (SRID) e validações ao inserir/atualizar geometrias; uso de índices GiST para consultas de interseção e vizinhança[^2].

### Temporalidade e Versionamento

- Validade temporal: valido_de/valido_ate em áreas e talhões; janelas em visitas, análises, cultivos e clima.
- Auditoria: campos created_at/updated_at, created_by/updated_by, e source_system; triggers de atualização e constraints de coerência temporal.
- Reprodutibilidade: versionamento de registros e materializações de snapshots para análises históricas; suporte a consultas por “estado em data” (as-of), viabilizando séries históricas consistentes[^4].

## Organização de Dados de Solo por Área

Amostras de solo devem localizar-se espacialmente (coordenadas ou polígono da subárea) e temporalmente (data da coleta), com vínculos claros a visitas e análises. Resultados são padronizados por método (ex.: Mehlich-1), unidade e referências, com dicionários harmonizados. A integração com bases oficiais e modelos de solo é feita por metadados rastreáveis e códigos comparáveis[^7][^15].

Tabela 7 — Dicionário de variáveis de solo (exemplos)

| Variável | Descrição                   | Método (ex.) | Unidade | Faixa de referência (genérica) | Observações QA/QC |
|----------|-----------------------------|--------------|---------|---------------------------------|-------------------|
| pH       | Acidez ativa                | Mehlich-1    | —       | 4–8                             | Checar outliers   |
| MO       | Matéria orgânica            | Walkley-Black| %       | 1–6                             | Consistência.unidade |
| P        | Fósforo disponível          | Mehlich-1    | mg/dm³  | 0–50                            | Diluição conferida |
| K        | Potássio trocável           | Mehlich-1    | cmolc/dm³ | 0–2                           | Interferências    |
| CTC      | Capacidade de troca catiônica | —          | cmolc/dm³ | 5–30                           | Calcular quando necessário |
| Dens.    | Densidade do solo           | —            | g/cm³   | 1–1.8                           | Amostra indeformada |
| Textura  | Frações de argila/silte/areia | —         | %       | 0–100                           | Somatório = 100   |

Metadados mínimos por amostra:
- Identificador, local (coordenada/polígono), SRID, data/hora, método de coleta, laboratório, responsável, instrumentos e protocolos; referências a catálogos (ex.: bases de solo globais e parâmetros mínimos para modelos de cultura)[^15].

Vinculação a visitas e análise de inconsistências:
- Cada amostra aponta a visita técnica e a análise pai. Regras de validação (faixas plausíveis, coerência entre método e unidade, somatório de textura) e relatórios de QA/QC sustentam confiabilidade e reuso em modelos[^7][^15].

## Histórico de Cultivos e Rotação

O registro de cultivos por talhão com janelas temporais permite inferir rotação e analisar impactos de longo prazo em solo e produtividade. Práticas de manejo (irrigação, preparo, cobertura) são vinculadas. A harmonização com camadas de histórico externo (ex.: CDL) e séries temporais de sensoriamento melhora cobertura e consistência, sobretudo em lacunas de registro[^5][^6][^14].

Tabela 8 — Tabela de cultivos e eventos de manejo

| Campo            | Tipo        | Observações                                              |
|------------------|-------------|----------------------------------------------------------|
| cultivo_id       | UUID        | PK                                                       |
| talhao_id        | UUID        | FK                                                       |
| especie/cultivar | Texto       | Padronizar nomenclatura                                  |
| data_inicio      | Data/hora   | Obrigatório                                              |
| data_fim         | Data/hora   | ≥ data_inicio                                            |
| manejo_irrigacao | Booleano    | Se aplicável, volume e período                           |
| preparo_solo     | Texto       | Convencional, conservação, etc.                          |
| cobertura        | Texto       | Presença e tipo                                          |
| adubacao         | Texto/núm.  | N-P-K, doses, datas                                      |
| produtividade    | Núm./unidade | Mapa de colheita/estimativa                              |
| source_system    | Texto       | Origem e versão                                          |

Validação de rotação e uso histórico:
- Regras agronômicas (sucessão допустима, janelas mínimas) e reconciliação com camadas de histórico espacial (CDL, quando aplicável) fortalecem a qualidade do histórico e sustentam estudos espaço-temporais de yields e solo[^6][^14].

## Eventos Climáticos e Meteorologia

Definição de variáveis mínimas e granularidade:
- Temperatura, umidade, precipitação, vento e radiação, em passos temporais consistentes (horário/diário), com unidades e métodos harmonizados. Quando necessário, agregações espaciais por talhão/área e interpolação de dados de estações ou sensores remotos[^8][^5].

Metodologia de integração:
- Controle de qualidade (QA/QC), preenchimento de lacunas e auditoria de fontes; derivação de índices (ex.: acumulados de chuva, graus-dia) conforme modelos e análises; versionamento de séries e reprodutibilidade dos pipelines[^5][^8].

## Performance e Escalabilidade

A escalabilidade depende de particionamento, índices e materializações adequados ao perfil de acesso. Em ambientes com múltiplas instâncias e domínios de segurança, práticas de monitoramento, templates e tags simplificam operação e governança em escala[^11]. A disciplina de design escalável em bancos relacionais deve orientar as escolhas de chaves, tipos e normalização[^9][^10].

Padrões de acesso e implicações:
- Consultas por hierarquia (ex.: todos os talhões de uma área/fazenda) favorecem índices por (fazenda_id, area_id, talhao_id).
- Séries temporais (clima, análises) exigem índices por (local_id, timestamp) e, em cenários de alto volume, partições por tempo.
- Filtros espaciais (polígonos de interesse) pedem índices espaciais GiST em geometrias de talhão/área[^1].

Estratégias de particionamento por tabela:
- medicoes e clima_eventos: partição por mês/trimestre de timestamp.
- rotacoes e cultivos: partição por ano de data_inicio.
- analises e visitas: partição por trimestre/ano de data, considerando volume de visitas.

Tabela 9 — Plano de particionamento por tabela (indicativo)

| Tabela        | Chave de partição       | Granularidade inicial       |
|---------------|--------------------------|-----------------------------|
| medicoes      | timestamp                | Trimestre (Q)               |
| clima_eventos | timestamp                | Mês                         |
| clima_series  | timestep                 | Mês                         |
| rotacoes      | data_inicio              | Ano                         |
| cultivos      | data_inicio              | Ano                         |
| analises      | data_visita/data_analise | Trimestre                   |
| visitas       | data_visita              | Trimestre                   |

Observação: As granularidades devem ser ajustadas conforme volumes e SLOs (lacuna de informação).

Plano de índices essenciais:

Tabela 10 — Índices essenciais por tabela

| Tabela   | Índices                                                                                 |
|----------|------------------------------------------------------------------------------------------|
| areas    | (fazenda_id), geom USING GiST                                                            |
| talhoes  | (area_id), (codigo_interno), geom USING GiST                                            |
| visitas  | (talhao_id, data_visita)                                                                 |
| analises | (visita_id, escopo, tipo), (talhao_id, data_analise)                                     |
| medicoes | (analise_id, timestamp), (indicador), (talhao_id, timestamp) em materialized views       |
| rotacoes | (talhao_id, data_inicio), (talhao_id, data_fim)                                          |
| cultivos | (talhao_id, data_inicio), (talhao_id, especie/cultivar, data_inicio)                     |
| clima_*  | (local_id, timestep), geom (quando aplicável) USING GiST                                 |

### Consultas Críticas e Planos de Execução

Para garantir performance sob cenários típicos, a engenharia de índices deve responder diretamente a perguntas recorrentes:

- “Dado um talhão, retorne todas as análises de solo dos últimos 24 meses, com pH, P, K, MO e respectivos métodos.” Índices (analise_id, escopo), medicoes (indicador, timestamp) e filtro por timestamp backwards suportam busca rápida; materialized views por escopo=‘solo’ podem pré-filtrar registros[^10][^13].
- “Para uma área, agregue o histórico de cultivos e rotação por talhão nos últimos 5 anos.” Índices (talhao_id, data_inicio/data_fim) viabilizam scans eficientes e anti-joins para sequências sobrepostas.
- “Dada uma janela temporal, recupere todas as medições dentro de um polígono de interesse (ex.: talhões intersectando MUI).” Índices GiST em talhoes.geom com operadores de interseção ST_Intersects resolvem filtros espaciais com baixo custo[^1].

Para cenários com alto volume de medições, índices por (indicador, timestamp) e partições por tempo em medicoes reduzem custo de varredura e melhoram latência média, particularmente quando combinados com materialized views por escopo/indicador. Boas práticas de execução (evitar SELECT *, limitar colunas, pushdown de predicates) devem fazer parte da disciplina de consultas e da política de acesso a dados[^10][^13].

## Arquitetura de Análise Histórica (DW/OLAP)

O DWH adopta uma modelagem em estrela que separa claramente dimensões hierárquicas e fatos de eventos. Dimensões (tempo, fazenda, área, talhão, cultivo, solo, clima) são versionadas para preservar estados históricos. Fatos (visitas, análises, medições, eventos climáticos, produtividade) são particionados por tempo. A pipeline ETL integra fontes heterogêneas com harmonização de códigos e unidades, sustentando análises estatísticas e científicasspace-time[^4][^5].

Tabela 11 — Esquema em estrela (dimensões e fatos)

| Tipo   | Tabelas principais                                           | Chaves e atributos essenciais                                                      |
|--------|--------------------------------------------------------------|------------------------------------------------------------------------------------|
| Dimensão | dim_tempo, dim_fazenda, dim_area, dim_talhao, dim_cultivo, dim_solo, dim_clima | SKs (surrogate keys), NKs (chaves naturais), valido_de/valido_ate, atributos descritivos |
| Fato   | fato_visitas, fato_analises, fato_medicoes, fato_clima, fato_colheita           | FKs para dimensões, métricas, timestamp, particionamento por tempo, flags QA/QC   |

Agregações e KPIs:
- Indicadores por talhão/ciclo: produtividade média, variabilidade (desvio), aplicado por unidade de área; contagens de visitas e densidade de amostragem.
- Acumulados climáticos (chuva, graus-dia) e índices derivados por janela fenológica.
- Indicadores de solo por janela (ex.: pH médio, P disponível por método), harmonizados por método/unidade.

Tabelas de resumo materializadas:
- Aggreg_mensal_talhao_solo, Aggreg_safra_colheita_talhao, Aggreg_clima_daily_talhao. Essas tabelas viabilizam dashboards de baixa latência e sustentam análises exploratórias de séries históricas, com custos controlados de manutenção e reprocessamento incremental[^4].

Dashboards e relatórios:
- Painéis operacionais (sanidade de amostragem, cobertura de dados, qualidade de série climática) e relatórios científicos (padrões espaço-temporais de yields, sensibilidade de parâmetros de solo) devem conectar-se ao DWH por camadas de consulta e materializações específicas, permitindo análises sem degradar o OLTP[^4][^8].

## Integração de Dados e APIs

A harmonização de esquemas e códigos é a base para interoperabilidade:
- Catálogos e dicionários comuns para unidades, métodos, indicadores e fontes; mapeamento entre nomenclaturas locais e bases externas (quando aplicável) com versionamento.
- Padronização temporal e espacial (SRID, timestep, timezone) e estratégias de reconciliação de granularidades distintas[^3][^5].

APIs e pipelines:
- Endpoints para CRUD hierárquico e ingestão de visitas/analises; streaming/batch para clima e séries de sensores; triggers para validação e qualidade.
- Integração com GIS (QGIS/ArcGIS) por serviços espaciais e visualização de geometrias e camadas derivadas, com retrieval rápido e estilos padronizados[^3].

Séries temporais e sensoriamento remoto:
- Ingestão de índices espectrais (NDVI, EVI) e séries Landsalt/Sentinel, com harmonização temporal e espacial para vincular a talhões e janelas de cultivo. Metadados de missão, órbita, processamento e QA/QC asseguram reprodutibilidade e uso analítico consistente[^5][^16].

Tabela 12 — Mapa de integrações por fonte

| Fonte                  | Periodicidade | Método          | Schema/Transformações                                           | QA/QC                                      |
|------------------------|---------------|-----------------|-----------------------------------------------------------------|--------------------------------------------|
| Estações climáticas    | Horário/diário| Batch/Streaming | Mapear variáveis; unidades; timestamp; interpolação opcional    | Gap-fill; validação de ranges              |
| Sensores remotos       | Semanal/mensal| Batch           | NDVI/EVI; geometric correction; reprojeção; agregação por talhão | Máscaras de nuvem; filtros de qualidade    |
| Mapas de colheita      | Por safa      | Batch           | Geocodificação; raster→polígono; normalização por unidade       | Calibração; consistência espacial          |
| Laboratórios de solo   | Por campanha  | Batch           | Método→código; unidades; dicionários de referência              | Verificação de consistência de unidades    |
| Registros operacionais | Por evento    | API/Streaming   | Normalização de campos; chaves hierárquicas                     | Validações de integridade e completude     |

## Governança, Segurança e Conformidade

Governança de dados:
- Catálogo de dados, glossário e dicionário de metadados por entidade e indicador; documentação de transformações (linhagem) e regras de qualidade.
- Versionamento de esquema e política de migração com janelas de compatibilidade.

Políticas de retenção:
- OLTP: retenção curta/média para visitas e análises, archival em طبقات frias; clima: retenção longa, com agregados históricos no DWH.
- DWH: histórico completo com snapshots periódicos e políticas de arquivamento gerenciadas[^3].

Segurança e conformidade:
- Controle de acesso baseado em funções e domínios; segregação por fazenda/cliente; auditoria e trilhas de acesso.
- Em ambientes multi-instância, práticas de monitoramento, relatórios e templates ajudam a manter operação segura e escalável[^11].

Tabela 13 — Política de retenção por categoria

| Categoria      | Retenção (indicativa) | Justificativa                                       | Camada de armazenamento         |
|----------------|------------------------|-----------------------------------------------------|----------------------------------|
| OLTP — visitas | 3–5 anos               | Ciclo de auditoria e reclamações                    | Primário + archival              |
| OLTP — análises| 3–5 anos               | Reproducibilidade de diagnósticos                   | Primário + archival              |
| Clima — bruto  | 10+ anos               | Séries históricas e modelos                         | DWH + objetos frios              |
| Cultivo/rotação| 10+ anos               | Padrões de manejo e inferências de solo             | DWH                              |
| Agregados DWH  | Permanente             | Relatórios e ciência                                | DWH                              |

Nota: Valores de retenção devem ser alinhados a regulação local e requisitos do negócio (lacuna de informação).

## Governança Técnica do Modelo (Versionamento e Auditoria)

Versionamento de esquema:
- Migrações versionadas com compatibilidade retroativa e documentação.
- Catalogação de mudanças (changelog), revisões de impacto e janelas de depreciação.

Auditoria e rastreabilidade:
- Campos de auditoria (created_at/updated_at, created_by/updated_by) e source_system em todas as entidades históricas.
- Snapshots periódicos de dimensões ( Slowly Changing Dimensions, SCD Tipo 2) e fatos para permitir consultas “como era” em qualquer data; rastreabilidade até níveis de amostra/medição[^4].

Monitoramento operacional:
- Relatórios de capacidade e desempenho, templates de configuração e tags para agrupar bancos e focar em subconjuntos do sistema; alertas proativos de interrupções, picos de uso e degradação de performance[^11].

## Validação, Testes e Roadmap de Implementação

Cenários de validação:
- Consultas hierárquicas por fazenda/área/talhões com filtros temporais.
- Análises de solo (pH, P, K, MO) por janela e por método; comparação entre amostras e agregados por talhão.
- Séries climáticas por talhão/área com agregados diários/mensais e índices derivados.
- Rotação e sucessão de cultivos por talhão em janelas plurianuais; inferência de regras agronômicas.

Testes de performance:
- Cargas sintéticas escalonáveis (tarefas paralelas de ingestão e consulta) e testes de estresse para medir latência sob picos e crecimiento de volume.
- Benchmarks de consultas críticas (filtros por timestamp, operadores espaciais ST_Intersects, joins hierárquicos) e validação de planos de execução com índices e partições.

Roadmap de implementação:
- Fase 1 — núcleo: criação de schemas hierárquicos, validações espaciais/temporais, índices essenciais.
- Fase 2 — análises e catálogo: implementação de medicoes, dicionário de variáveis de solo, QA/QC e auditoria.
- Fase 3 — DWH: modelagem em estrela, pipelines ETL, agregados materializados e dashboards.
- Fase 4 — integrações externas: clima, sensoriamento remoto, camadas de histórico (CDL), GIS e APIs.
- Fase 5 — operação em escala: otimizações, retenção e archival, governança avançada e monitoramento contínuo.

## Lacunas de Informação e Parâmetros Pendentes

Para finalização e ajustes finos, os seguintes parâmetros são necessários:
- Volumes de dados por entidade (número de fazendas, áreas, talhões; frequência de visitas/analises).
- SLOs de latência e throughput por tipo de consulta (OLTP e analítico).
- Fontes climáticas e granularidade preferida (estações, reanalise, sensores remotos) e formatos de integração.
- Catálogo final de análises específicas (variáveis, métodos, unidades, limiares, referências).
- Padrões de acesso e relatórios (filtros mais frequentes, dashboards e periodicidade de atualização).
- Requisitos regulatórios locais (retenção, auditoria, compartilhamento de dados).
- Política de versionamento geoespacial (frequência de atualização de geometrias, tolerância a mudanças de fronteira).
- Tecnologias preferenciais (SGBD, GIS, data lake/warehouse, message bus, containerização).

Essas lacunas devem ser endereçadas na Fase 1 do roadmap para calibrar particionamentos, índices e contratos de serviço.

## Referências

[^1]: PostGIS Documentation — Chapter 4: Data Management. https://postgis.net/docs/using_postgis_dbmanagement.html  
[^2]: PostGIS — Spatial Database Extends PostgreSQL. https://postgis.net/  
[^3]: FAO — Farm data management, sharing and services for agriculture. https://openknowledge.fao.org/server/api/core/bitstreams/7043933b-dd27-4674-92ec-4bbfef8a4d48/content  
[^4]: Design and Implementation of a Scalable Data Warehouse for Agricultural Big Data (MDPI, Sustainability). https://www.mdpi.com/2071-1050/17/8/3727  
[^5]: An European database for integrated assessment and modeling of agricultural systems (ontology-schema). https://scholarsarchive.byu.edu/cgi/viewcontent.cgi?article=2697&context=iemssconference  
[^6]: ACPF — Land Use and Field Boundary Database Development and Structure. https://acpf4watersheds.org/resource/acpf-3-land-use-and-field-boundary-database-development-and-structure  
[^7]: A Database Schema for Standardized Data and Metadata Collection in Agricultural Experiments (Land, MDPI). https://www.mdpi.com/2073-445X/14/9/1816  
[^8]: Predicting spatial and temporal variability in crop yields (Open Access). https://pmc.ncbi.nlm.nih.gov/articles/PMC7212054/  
[^9]: Designing Highly Scalable Database Architectures (Redgate, Simple Talk). https://www.red-gate.com/simple-talk/databases/sql-server/performance-sql-server/designing-highly-scalable-database-architectures/  
[^10]: Database Design Best Practices for Scalable Applications (Medium). https://medium.com/@cheenawrites/database-design-best-practices-for-scalable-applications-eb5b5ed2ac2d  
[^11]: Mastering Database Scaling: Best Practices for Growth (dbWatch). https://www.dbwatch.com/blog/database-scaling-best-practices/  
[^12]: Using SQL to build a farm management database (Microsoft SQL Server example). https://medium.com/analytics-vidhya/sql-part-1-using-sql-to-build-a-real-life-farm-management-database-8e87a760d2e  
[^13]: SQL Tutorial (W3Schools). https://www.w3schools.com/sql/  
[^14]: Integrating Historical Crop Rotation Changes Into Soil Organic Carbon Modeling (AGU). https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2025EF006117  
[^15]: Basic Soil Data Requirements for Process-Based Crop Models as a Standardized Reference (MDPI). https://www.mdpi.com/2071-1050/12/18/7781  
[^16]: Crop mapping from satellite image time series (Remote Sensing of Environment). https://www.sciencedirect.com/science/article/pii/S0034425721003230  
[^17]: Extracting Agricultural Fields from Remote Sensing Imagery (MDPI Remote Sensing). https://www.mdpi.com/2072-4292/12/7/1205  
[^18]: Spatiotemporal Database Schema for Data Driven Applications in Agriculture (Indian Journal of Science & Technology). https://indjst.org/download-article.php?Article_Unique_Id=INDJST12773&Full_Text_Download=True

---

Anexo: Tabelas de referência rápida

Para consolidar as recomendações práticas, as tabelas a seguir sintetizam pontos críticos que devem ser consultados durante a implementação:

Anexo Tabela A — Checklist de metadados mínimos por amostra de solo
- Identificador, coordenadas/SRID, data/hora, método de coleta, laboratório, método analítico, unidade, referência, instrumento/calibração, responsável, validações QA/QC.

Anexo Tabela B — Matriz de índices por consulta crítica (exemplos)
- Consultas de solo por janela: analises (escopo=‘solo’), medicoes (indicador, timestamp).
- Rotação por talhão: rotacoes (talhao_id, data_inicio/data_fim).
- Clima por polígono: talhoes.geom (GiST) + clima_eventos com geom e (local_id, timestep).

Anexo Tabela C — Plano de snapshots do DWH (exemplos)
- Snapshots mensais de fato_medicoes por talhão e indicador (com preservação de method/unit).
- Snapshots anuais de fato_colheita por talhão/safra.
- Snapshots diários de agregados climáticos por talhão (chuva, temp média).