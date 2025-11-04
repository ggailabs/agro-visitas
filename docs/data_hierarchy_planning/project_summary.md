# Planejamento de Estruturas Hierárquicas de Dados para Fazenda → Área → Talhão → Visita Técnica → Análises Específicas

## 1. Visão Geral, Objetivos e Escopo

Este blueprint técnico apresenta um plano de arquitetura e modelagem de dados para um sistema agrícola que organiza dados de forma hierárquica — fazenda, área e talhão — e registra observações operacionais e analíticas: visitas técnicas e análises específicas (solo, planta, produtividade, clima). O documento abarca o desenho lógico e físico do núcleo relacional/geoespacial, estratégias de performance e escalabilidade, organização de dados de solo por área, temporalidade de histórico de cultivos e rotação, integração de eventos climáticos e séries temporais, bem como a viabilização de análises históricas por meio de um data warehouse com modelagem em estrela, agregados materializados e boas práticas de integração e governança de dados.

Objetivos:
- Garantir rastreabilidade e auditabilidade por contexto hierárquico e por tempo.
- Prover performance consistente em consultas espaciais, temporais e hierárquicas.
- Escalabilidade horizontal e vertical com padrões de particionamento e índices apropriados.
- Integrar e harmonizar dados geoespaciais, climáticos e agronômicos para análises reprodutíveis.
- Sustentar governança de dados (catálogo, lineage, políticas de retenção e segurança), alinhada a práticas reconhecidas internacionalmente[^3].

Escopo:
- Hierarquia espacial e operacional: fazenda → área → talhão.
- Eventos operacionais: visitas técnicas; análises específicas e suas medições.
- Histórico agronômico: cultivos e rotação.
- Dados meteorológicos: eventos e séries temporais.
- Arquitetura transacional (OLTP) e analítica (DW/OLAP), integrações (GIS, serviços OGC, séries temporais de sensoriamento remoto), e governança.

Resultados esperados:
- Modelo de dados hierárquico-temporal coerente e escalável.
- Esquemas de banco relacionais e geoespaciais (PostGIS) com constraints e índices definidos[^1].
- Pipeline de dados históricos com cubes e agregados materializados (DW/OLAP) e integração com GIS.
- Boas práticas de governança e conformidade aplicadas ao contexto agrícola[^3].


## 2. Princípios de Design, Requisitos e Critérios de Sucesso

A abordagem de design se apoia em princípios que têm se consolidado na agricultura digital e na engenharia de dados.

- Hierarquia como eixo organizador: todo evento, medição e vínculo agronômico é ancorado a fazenda/área/talhao com chaves artificiais e naturais, preservando integridade e rastreabilidade[^4].
- Geometrias de área e talhão como entidades de primeira classe: uso de PostGIS (geometry/geography), metadados de SRID e precisão, e índices espaciais compatíveis com consultas críticas[^1][^2].
- Temporalidade e versionamento: janelas de validade (valido_de/valido_ate), versionamento e origem (source_system), permitindo análises históricas consistentes[^4].
- Metadados e padronização: catálogos de variáveis, métodos, unidades e referências técnicas para interoperabilidade e reprodutibilidade, especialmente em dados de solo e experimentos agronômicos[^7][^5].
- Performance e escalabilidade: particionamento temporal nas tabelas de maior volume; índices por chaves hierárquicas e por colunas temporal/espaciais; materialized views para agregados críticos; monitoramento proativo com templates e tags em ambientes de múltiplas instâncias[^9][^10][^11].
- Governança e qualidade de dados: catálogo, glossário, lineage e dicionários por domínio; políticas de retenção; controle de acesso e segregação por contexto hierárquico[^3].

Para orientar decisões de implementação, a Tabela 1 sintetiza requisitos funcionais versus não funcionais.

Tabela 1 — Requisitos funcionais vs. não funcionais

| Categoria | Requisito | Descrição | Métrica/Alvo |
|---|---|---|---|
| Funcional | CRUD hierárquico | Fazendas, áreas e talhões com geometrias válidas | 100% das operações válidas |
| Funcional | Registro de visitas e análises | Vínculo a talhão; métodos, unidades, indicadores | 100% com metadados mínimos |
| Funcional | Histórico de cultivos e rotação | Por talhão e janela temporal, com regras agronômicas | 100% das sequências validadas |
| Funcional | Séries climáticas | Integração por talhão/área com QA/QC | 100% com metadados de origem |
| Funcional | Relatórios analíticos | Cubes e agregados por nível hierárquico e tempo | Dashboards com latência < 3s |
| Não funcional | Consultas hierárquicas | Por fazenda/área/talhao em janelas | P95 < 1s com índices adequados |
| Não funcional | Consultas espaciais | Interseções, vizinhança, proximidade | P95 < 2s com GiST/BRIN[^1] |
| Não funcional | Consultas temporais | Filtros por intervalo e agregações | P95 < 2s com partições |
| Não funcional | Disponibilidade | Uptime do núcleo OLTP | ≥ 99.5% |
| Não funcional | Segurança | Controle de acesso por contexto | RBAC implementada |
| Não funcional | Governança | Catálogo, lineage, retenção | 100% dos domínios mapeados |

Critérios de sucesso:
- Integridade referencial e validação espacial/temporal sem violações.
- Consultas espaciais e temporais dentro de SLAs definidos.
- Camada analítica com reprodutibilidade de KPIs por versão de dados.
- Conformidade com práticas de compartilhamento e governança agrícola[^3].


## 3. Modelo Conceitual Hierárquico

A modelagem conceitual estrutura entidades e relacionamentos alinhados a sistemas agrícolas modernos e à literatura de dados agrícolas e ontologias de fazendas, solos e clima[^5]. A hierarquia principal é:

- Fazenda ⊃ Área ⊃ Talhão.
- Visita técnica (evento operacional) vincula talhão a análises específicas.
- Análises específicas abrangem medição de variáveis (solo, planta, produtividade, clima).
- Cultivos e rotação se associam a talhão por janela temporal.
- Eventos climáticos vinculam-se a talhão/área com séries temporais e, quando aplicável, geometrias (ex.: interpolação).

A Tabela 2 apresenta o mapa de entidades e relacionamentos com chaves e cardinalidades.

Tabela 2 — Entidades e relacionamentos: chaves e cardinalidades

| Entidade | PK | FKs | Principais atributos | Relacionamento | Cardinalidade |
|---|---|---|---|---|---|
| Fazenda | fazenda_id | — | nome, localização, código | Área | 1:N |
| Área | area_id | fazenda_id | nome, geom (Polygon), srid | Talhão | 1:N |
| Talhão | talhao_id | area_id | código, geom (Polygon), srid | Visita | 1:N |
| Visita | visita_id | talhao_id | data, responsável | Análises | 1:N |
| Análise | analise_id | visita_id | escopo, método, unidade | Medições | 1:N |
| Medição | (analise_id, indicador, timestamp, método) | analise_id | valor, unidade, QA | — | N:1 |
| Cultivo | cultivo_id | talhao_id | espécie/cultivar, janela | — | N:1 |
| Rotação | rotacao_id | talhao_id | sequência, datas | — | N:1 |
| Evento climático | clima_id | talhao_id | tipo, valor, janela | — | N:1 |
| Série climática | serie_id | talhao_id/area_id | timestep, valor, metadados | — | N:1 |

### 3.1 Hierarquia Principal (Fazenda → Área → Talhão)

Cada nível carrega metadados mínimos para auditabilidade e interoperabilidade. A Tabela 3 consolida atributos essenciais.

Tabela 3 — Atributos mínimos por nível hierárquico

| Nível | Atributos essenciais |
|---|---|
| Fazenda | fazenda_id (PK), nome, código_externo, localização, fonte, created_at, updated_at |
| Área | area_id (PK), fazenda_id (FK), nome, geom (Polygon), srid, método_aquisicao, data_levantamento, precisão, fonte, created_at, updated_at |
| Talhão | talhao_id (PK), area_id (FK), código, geom (Polygon), srid, data_delimitacao, método, precisão, fonte, created_at, updated_at |

Geometrias devem respeitar validações e metadados de SRID e precisão; índices espaciais otimizam consultas de interseção e proximidade[^1][^2].

### 3.2 Visita Técnica e Análises Específicas

Visita técnica é o evento que ancora análises: registro de data, responsável e objetivo. As análises possui escopo (solo, planta, produtividade, clima), método, unidade e lista de medições com timestamp e metadados de qualidade (QA). A Tabela 4 sintetiza o catálogo e metadados mínimos de análises[^7].

Tabela 4 — Catálogo de análises e metadados mínimos

| Análise (escopo) | Exemplos de indicadores | Metadados mínimos |
|---|---|---|
| Solo | pH, MO, P, K, Ca, Mg, Al, V%, CTC, densidade, textura | método, unidade, referência, laboratório, data_coleta, geom_amostra |
| Planta | N, P, K, Ca, Mg, micronutrientes | protocolo, unidade, limiar, laboratório, data_coleta |
| Produtividade | rendimento, umidade, biomassa | metodologia, unidade, método_calibração, data |
| Clima local | temp., umidade, chuva, vento | instrumento, calibracao, unidade, timestep, fonte |

### 3.3 Histórico de Cultivos e Rotação

Cultivos são registrados por talhão com janela temporal (início/fim), espécie/cultivar e práticas de manejo. A rotação é inferida pela sequência de cultivos, com regras agronômicas e validações de coerência temporal. Essa rastreabilidade temporal sustenta análises históricas e integrações com bases espaciais e sensores remotos[^6][^14].

Tabela 5 — Estrutura de rotação por talhão (sequência e validações)

| Campo | Descrição |
|---|---|
| rotacao_id (PK) | Identificador da rotação |
| talhao_id (FK) | Talhão |
| cultura_1, cultura_2, ... | Cultivos na sequência |
| data_inicio/fim_1..n | Janelas temporais por cultivo |
| regras_aplicadas | Regras agronômicas checadas (flags) |
| origem_fonte | source_system e versão |

### 3.4 Eventos Climáticos

Eventos climáticos são estruturados por tipo, valor, unidade e timestep, com vinculação a talhão/área. Quando pertinente, geometrias de interpolação são armazenadas (ex.: polígonos de precipitação). A Tabela 6 resume variáveis climáticas e metadados mínimos[^8][^5].

Tabela 6 — Variáveis climáticas por granularidade e metadados

| Variável | Granularidade | Unidade | Passo temporal | Fonte | Metodologia de agregação |
|---|---|---|---|---|---|
| Chuva | talhão/área | mm | diário/horário | estação/sensor | somatório; gap-fill; interpolação |
| Temperatura | talhão/área | °C | diário/horário | estação/sensor | média/mín/máx; QA/QC |
| Umidade | talhão/área | % | diário/horário | estação/sensor | média; QA/QC |
| Vento | talhão/área | m/s | diário/horário | estação/sensor | média/rajadas |
| Radiação | talhão/área | MJ/m² | diário | estação/sensor | somatório |


## 4. Modelo Lógico de Dados (Núcleo Transacional)

O núcleo relacional normalizado preserva integridade e suporta consultas hierárquicas/temporais. Chaves substitutas (UUID ou BIGSERIAL) são preferidas para facilitar replicação e evolução. Chaves naturais (códigos) são armazenadas como atributos únicos.

- Integridade: PKs e FKs com cascatas definidas; constraints de unicidade e checks (ex.: valido_de ≤ valido_ate).
- Temporalidade: colunas valido_de/valido_ate, version, source_system, created_at/updated_at e campos de auditoria (created_by/updated_by).
- Geometrias: PostGIS com SRID definido; índices GiST/BRIN conforme padrão de acesso; validações ST_IsValid e metadados de precisão[^1][^2].

A Tabela 7 apresenta a lista de tabelas, chaves e índices essenciais.

Tabela 7 — Lista de tabelas: PKs, FKs e índices essenciais

| Tabela | PK | FKs | Índices essenciais |
|---|---|---|---|
| fazendas | fazenda_id | — | (nome), (codigo_externo) únicos |
| areas | area_id | fazenda_id | (fazenda_id), (nome), geom GiST |
| talhoes | talhao_id | area_id | (area_id), (codigo), geom GiST |
| visitas | visita_id | talhao_id | (talhao_id, data), (responsavel) |
| analises | analise_id | visita_id | (visita_id, escopo), (tipo) |
| medicoes | (analise_id, indicador, timestamp, método) | analise_id | (analise_id, timestamp), (indicador) |
| rotacoes | rotacao_id | talhao_id | (talhao_id, data_inicio) |
| cultivos | cultivo_id | talhao_id | (talhao_id, especie, janela) |
| clima_eventos | clima_id | talhao_id | (talhao_id, tipo, timestep) |
| clima_series | serie_id | talhao_id/area_id | (local_id, timestep), geom (quando aplicável) |

Referências de boas práticas DDL, transações e manutenção podem ser encontradas em materiais de SQL e bancos agrícolas[^12][^13][^1].

### 4.1 Esquema Geoespacial

Polígonos de áreas e talhões utilizam tipos geometry/geography do PostGIS. Metadados de SRID e precisão são obrigatórios. Validações (ST_IsValid) devem ser executadas em inserts/updates, e índices GiST/BRIN configurados conforme volume e padrão de consulta[^1][^2].

Tabela 8 — Metadados geoespaciais por nível

| Nível | Campos geoespaciais | Restrições |
|---|---|---|
| Área | geom (Polygon), srid, precisão, método | ST_IsValid(geom) = true; SRID consistente |
| Talhão | geom (Polygon), srid, precisão, método | ST_IsValid(geom) = true; SRID consistente |

### 4.2 Temporalidade e Versionamento

Versionamento e auditabilidade sustentam análises “como estava” em qualquer data. A Tabela 9 detalha campos obrigatórios por entidade.

Tabela 9 — Campos de temporalidade e auditoria por entidade

| Entidade | Temporalidade | Auditoria e origem |
|---|---|---|
| Áreas/Talhões | valido_de, valido_ate, version | created_at, updated_at, created_by, updated_by, source_system |
| Visitas/Análises | data (timestamp), janela de validade | created_at/updated_at, created_by/updated_by, source_system |
| Cultivos/Rotação | data_inicio/data_fim | created_at/updated_at, source_system |
| Clima | timestep (timestamp) | metadados de origem, QA/QC |

Reprodutibilidade de análises históricas requer snapshots e materializações consistentes por versão de dados e metadados[^4].


## 5. Organização de Dados de Solo por Área

Amostras de solo devem estar georreferenciadas e temporalmente registradas, vinculadas a visitas e análises. Dicionários harmonizados de métodos, unidades e referências técnicas são obrigatórios para consistência e interoperabilidade entre laboratórios e bases de dados[^7][^15]. A Tabela 10 exemplifica um dicionário de variáveis de solo.

Tabela 10 — Dicionário de variáveis de solo: método, unidade, referência

| Variável | Método (ex.) | Unidade | Referência técnica (ex.) |
|---|---|---|---|
| pH | Mehlich-1 | — | Manual do laboratório |
| Matéria orgânica (MO) | Walkley-Black | % | Guia de métodos |
| Fósforo (P) | Mehlich-1 | mg/dm³ | Normas analíticas |
| Potássio (K) | Mehlich-1 | cmolc/dm³ | Normas analíticas |
| CTC | Cálculo | cmolc/dm³ | Procedimentos |
| Densidade | Corpo indeforme | g/cm³ | Protocolos |
| Textura | Pipeta/Bouyoucos | % | Guia de laboratório |

Metadados mínimos por amostra:
- Identificador, localização (coordenadas/polígono), SRID, data/hora, método de coleta, laboratório, responsável, instrumentos e protocolos. A Tabela 11 estrutura o catálogo[^7].

Tabela 11 — Catálogo de amostras e metadados mínimos

| Campo | Descrição |
|---|---|
| amostra_id (PK) | Identificador único |
| visita_id (FK) | Visita associada |
| local | coordenadas/polígono |
| srid | Sistema de referência |
| data_coleta | Timestamp |
| metodo_coleta | Descrição |
| laboratorio | Nome/código |
| responsavel | Técnico responsável |
| instrumentos | Equipamentos/calibração |

### 5.1 Validação e Consistência de Dados de Solo

Regras de QA/QC asseguram confiabilidade: faixas plausíveis, consistência método-unidade, somatório de textura = 100%, e reconciliação com requisitos de modelos agronômicos[^7][^15].

Tabela 12 — Regras de validação e relatórios de QA/QC

| Regra | Descrição | Ação |
|---|---|---|
| Faixa plausível | pH 3–9; MO 0–20% | Marcar outlier |
| Método vs unidade | Método compatível com unidade | Validar/invalidar |
| Textura soma | Areia+Silte+Argila=100% | Verificar |
| Referência modelo | Parâmetros mínimos do modelo | Checar completude |


## 6. Histórico de Cultivos e Rotação

O histórico por talhão com janela temporal permite inferências de rotação, diagnóstico de manejo e análises de longo prazo. Regras agronômicas de sucesso de culturas e cobertura mínima entre ciclos são verificadas; integrações com camadas históricas (CDL) e sensoriamento remoto ajudam a preencher lacunas e a validar sequências[^6][^14]. A Tabela 13 propõe uma matriz de rotação com validação.

Tabela 13 — Matriz de rotação e validação

| Talhão | Sequência | Janela | Regra aplicada | Validação |
|---|---|---|---|---|
| T001 | Milho → Soja → Milho | 2019–2024 | Sucessão допустима | OK |
| T002 | Trigo → Barbeiro | 2019–2023 | Cobertura mínima | OK |
| T003 | Soja → Soja | 2020–2021 | Repetição crítica | Falha |

Essas validações orientam recomendações e sustentam estudos históricos sobre impactos de rotação no solo e na produtividade[^14].


## 7. Eventos Climáticos e Meteorologia

A granularidade (talhao/área), variáveis e metadados devem ser definidas de modo consistente com análises espaço-temporais e requisitos dos modelos. A integração exige QA/QC, gap-fill, reprodutibilidade e auditoria de fontes. A Tabela 14 consolida variáveis, unidades, passos temporais e fontes[^8][^5].

Tabela 14 — Variáveis climáticas: unidades, timestep, fonte e metodologia

| Variável | Unidade | Passo | Fonte | Metodologia |
|---|---|---|---|---|
| Chuva | mm | 1h/1d | Estação/sensor | Soma, preenchimento |
| Temp. | °C | 1h/1d | Estação/sensor | Média/mín/máx |
| Umidade | % | 1h/1d | Estação/sensor | Média, QA |
| Vento | m/s | 1h | Estação/sensor | Média/rajadas |
| Radiação | MJ/m² | 1d | Estação/sensor | Soma |

Critérios de QA/QC:
- Consistência temporal (sem saltos ilegais), validação de faixas e reconciliação de fontes múltiplas; versionamento de série e metadados de transformação[^5].


## 8. Performance e Escalabilidade

Escalabilidade depende de particionamento, índices e materializações alinhadas aos padrões de acesso. A governança técnica em ambientes multi-instância se beneficia de monitoramento proativo, relatórios e templates[^11]. O design relacional e índices devem seguir boas práticas de bancos escaláveis[^9][^10].

Padrões de acesso e implicações:
- Hierárquico: filtro por fazenda/area/talhao exige índices nas chaves e nas datas.
- Temporal: filtros e agregações por intervalo em medicoes e clima pedem índices e partições por tempo.
- Espacial: consultas por polígono e vizinhança pedem GiST/BRIN em geometrias[^1].

A Tabela 15 apresenta o plano de particionamento; a Tabela 16, os índices essenciais por tabela.

Tabela 15 — Plano de particionamento (chave e granularidade)

| Tabela | Chave de partição | Granularidade inicial |
|---|---|---|
| medicoes | timestamp | Trimestre |
| clima_eventos | timestep | Mês |
| clima_series | timestep | Mês |
| rotacoes | data_inicio | Ano |
| cultivos | data_inicio | Ano |
| analises | data_analise | Trimestre |
| visitas | data_visita | Trimestre |

Tabela 16 — Índices essenciais por tabela

| Tabela | Índices recomendados |
|---|---|
| areas | (fazenda_id), geom GiST |
| talhoes | (area_id), (codigo), geom GiST |
| visitas | (talhao_id, data_visita) |
| analises | (visita_id, escopo), (talhao_id, data_analise) |
| medicoes | (analise_id, timestamp), (indicador) |
| rotacoes | (talhao_id, data_inicio) |
| cultivos | (talhao_id, data_inicio) |
| clima_* | (local_id, timestep), geom (se aplicável) |

### 8.1 Consultas Críticas e Planos de Execução

Consultas típicas devem orientar índices e materialized views. A Tabela 17 mostra um mapa de consulta → índice.

Tabela 17 — Mapa consulta → índice

| Consulta | Índice/Materialização |
|---|---|
| Solo por talhão e janela | (analise_id, escopo) + MV por escopo=‘solo’ |
| Rotação por área/talhao | (talhao_id, data_inicio/data_fim) |
| Clima por polígono | ST_Intersects(talhoes.geom, :poly) + GiST |

Em cenários de alto volume, materialized views por escopo/indicador (solo, produtividade) e por janela (mensal, safra) reduzem latência e custo de execução, desde que acompanhadas de políticas de refresh e invalidação consistentes[^10].


## 9. Arquitetura de Análise Histórica (DW/OLAP)

A camada analítica adota modelagem em estrela: dimensões (tempo, fazenda, área, talhão, cultivo, solo, clima) com SCD Tipo 2; fatos (visitas, análises, medições, clima, colheita) com partições por tempo. Agregados materializados dão suporte a dashboards e relatórios operacionais/científicos. A literatura indica DWHs agrícolas distribuídos e escaláveis, com pipelines de integração e harmonização de metadados[^4][^5].

Tabela 18 — Esquema em estrela (dimensões e fatos)

| Tipo | Tabela | SK | Atributos principais |
|---|---|---|---|
| Dimensão | dim_tempo | tempo_sk | data, semana, mês, ano, safra |
| Dimensão | dim_fazenda | fazenda_sk | nome, código, localização |
| Dimensão | dim_area | area_sk | nome, geom, srid, validade |
| Dimensão | dim_talhao | talhao_sk | código, geom, srid, validade |
| Dimensão | dim_cultivo | cultivo_sk | espécie/cultivar, janela |
| Dimensão | dim_solo | solo_sk | método, unidade, referência |
| Dimensão | dim_clima | clima_sk | variável, fonte, timestep |
| Fato | fato_visitas | — | FKs dim, data, responsável |
| Fato | fato_analises | — | FKs dim, escopo, método |
| Fato | fato_medicoes | — | FKs dim, indicador, valor, timestamp |
| Fato | fato_clima | — | FKs dim, valor, timestep |
| Fato | fato_colheita | — | FKs dim, rendimento, umidade |

Agregados e KPIs:
- Produtividade média por talhão/safra, indicadores de solo harmonizados por método/unidade, acumulados climáticos por janela fenológica. A Tabela 19 sugere materializações.

Tabela 19 — Agregados materializados

| Agregado | Granularidade | Métricas | Refresh |
|---|---|---|---|
| agg_mensal_talhao_solo | talhão/mês | pH médio, P, K (por método) | Diário |
| agg_safra_colheita_talhao | talhão/safra | rendimento médio, umidade | Semanal |
| agg_clima_daily_talhao | talhão/dia | chuva, temp média/mín/máx | Diário |

Boas práticas de ETL: padronização de códigos e unidades, versionamento de transformações, reprodutibilidade por log de jobs e metadados de execução[^5].


## 10. Integração de Dados e APIs

A interoperabilidade requer catálogos comuns, mapeamentos entre sistemas e serviços padronizados. A integração com GIS pode ser viabilizada por serviços OGC; sensoriamento remoto e séries históricas são incorporados com metadados de missão, órbita e processamento[^5][^16][^3].

Tabela 20 — Mapa de integrações por fonte

| Fonte | Periodicidade | Método | Transformações | QA/QC |
|---|---|---|---|---|
| Estação/sensor clima | 1h/1d | API/Batch | unidades, timestep | gap-fill, validação |
| CDL histórico | anual | Batch | harmonização código | verificação espacial |
| Sentinel/Landsat | semanal/mensal | Batch | NDVI/EVI, correção | máscara de nuvem |
| Laboratórios | campanha | Batch | método→código | consistência unidades |
| Mapas colheita | safra | Batch | raster→polígono | calibração espacial |

Catálogo de APIs:
- CRUD hierárquico; ingestão de visitas/analises; endpoints de agregados; serviços espaciais OGC (WMS/WFS). Governança e versionamento de APIs devem constar no catálogo de dados[^3][^16].


## 11. Governança, Segurança e Conformidade

Governança compreende catálogo, glossário, dicionários de metadados, políticas de retenção, auditoria e controle de acesso. Em ambientes de múltiplas instâncias, monitoramento e templates operacionais são cruciais para segurança e escalabilidade[^3][^11].

Tabela 21 — Política de retenção por categoria

| Categoria | Retenção (indicativa) | Motivo | Armazenamento |
|---|---|---|---|
| OLTP — visitas/analyses | 3–5 anos | auditoria | primário + archival |
| Clima — bruto | ≥ 10 anos | séries históricas | DWH + frio |
| Cultivos/rotação | ≥ 10 anos | análise de longo prazo | DWH |
| Agregados | permanente | relatórios | DWH |

Tabela 22 — Matriz de controles de acesso por perfil

| Perfil | Leitura | Escrita | Admin | Segregação |
|---|---|---|---|---|
| Admin fazenda | Todas | Todas | Sim | Por fazenda |
| Técnico | Escopo atribuído | Sim (campo) | Não | Por fazenda |
| Laboratório | Análises | Resultados | Não | Por origem |
| Analista | DWH/Aggregates | Não | Não | Por escopo |

Monitoramento e relatórios operacionais devem incluir capacidade, desempenho, alertas e logs de longo prazo para auditoria e planejamento[^11].


## 12. Governança Técnica do Modelo (Versionamento e Auditoria)

Versionamento de esquema, snapshots e auditoria são necessários para garantir análises reprodutíveis e rastreáveis. Monitoramento contínuo e relatórios técnicos apoiam escalabilidade e operação em produção[^4][^11].

Tabela 23 — Plano de versionamento

| Item | Periodicidade | Escopo | Responsável |
|---|---|---|---|
| Esquema núcleo | trimestral | tabelas/índices | DBA |
| Catálogo de metadados | contínuo | dicionários/códigos | Data Steward |
| Snapshots DW | mensal | fatos/dimensões | Eng. DW |
| Migrações | conforme | scripts e rollback | DevOps |

Políticas de snapshot:
- Dimensões com SCD Tipo 2 (validade e versão).
- Fatos com snapshots periódicos e agregados re-computados conforme rotinas de refresh.


## 13. Validação, Testes e Roadmap de Implementação

Validação por cenários:
- Consultas hierárquicas e temporais por fazenda/area/talhao.
- Análises de solo por janela e método.
- Séries climáticas e agregados por talhão/área.
- Rotação e sucessão por talhão em janelas plurianuais.

Testes de performance e estresse:
- Cargas sintéticas escalonáveis; latência P95 e throughput medidos por tipo de consulta.
- Benchmarks de consultas críticas (filtros temporais, ST_Intersects, joins hierárquicos), validados em ambientes de teste com índices/partições.

Roadmap por fases:
1. Núcleo OLTP: schemas hierárquicos, validações, índices.
2. Catálogo de análises e QA/QC; auditoria e temporalidade.
3. DW/OLAP: estrelas, ETL, agregados materializados.
4. Integrações: clima, sensoriamento remoto, GIS, APIs OGC.
5. Operação em escala: retenção, archival, monitoramento e templates.

A Tabela 24 organiza casos de teste e KPIs de performance; a Tabela 25 apresenta o roadmap.

Tabela 24 — Matriz de casos de teste e KPIs de performance

| Cenário | KPI | Critério de aprovação |
|---|---|---|
| Solo por talhão (24 meses) | P95 latência < 2s | 95% dos testes |
| Clima por polígono | P95 latência < 2s | 95% dos testes |
| Rotação por área | P95 latência < 1s | 95% dos testes |
| Agregados DW | Atualização < 2h | 100% janelas |

Tabela 25 — Roadmap por marcos

| Fase | Entregáveis | Dependências | Métricas |
|---|---|---|---|
| 1 | OLTP núcleo | Infraestrutura | Integridade 100% |
| 2 | Catálogo análises | Fase 1 | QA/QC ativo |
| 3 | DW/OLAP | Fases 1–2 | Dashboards disponíveis |
| 4 | Integrações | Fase 3 | Fontes integradas |
| 5 | Operações | Fases 1–4 | Uptime ≥ 99.5% |


## Lacunas de Informação

Para ajustar o projeto físico e operacional, são necessárias definições e medições adicionais:
- Volumes por entidade e frequência de visitas/analises (para calibrar partições e índices).
- SLAs de latência e throughput por tipo de consulta (OLTP e analítico).
- Fontes e granularidade de dados climáticos (estações, reanalysis, sensores remotos).
- Catálogo final de análises específicas (variáveis, métodos, unidades, referências).
- Padrões de acesso e relatórios (filtros mais usados, dashboards e periodicidade).
- Requisitos regulatórios locais (retenção, auditoria, compartilhamento).
- Política de versionamento geoespacial (fronteiras).
- Tecnologias preferenciais (SGBD, GIS, data lake/warehouse, mensageria, containerização).

Essas lacunas devem ser endereçadas nas fases iniciais do roadmap para garantir conformidade com SLAs e escalabilidade sustentada.


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

### Anexo: Observações de Implementação

Para execução:
- Ajustar granularidade de partições e índices conforme volumes reais e SLAs definidos.
- Manter catálogos e governança alinhados a práticas FAO e literatura de DWH agrícola.
- Garantir validações geoespaciais e temporais em pipelines de ingestão e atualização.