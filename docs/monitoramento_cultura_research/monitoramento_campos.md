# Blueprint de Monitoramento de Culturas Agrícolas: Fenologia, Pragas, Doenças, Déficit Hídrico, Imagens, GPS e Modelagem de Dados

## Visão Geral e Objetivos do Monitoramento Agrícola

O monitoramento agrícola é a prática sistemática de acompanhar o desenvolvimento das culturas, o ambiente de produção e os agentes que afetam a produtividade e a qualidade da colheita. Em sua essência, integra observação de campo, captura de imagens, mensuração de variáveis ambientais e georreferenciamento para subsidiar decisões técnicas no momento certo. Quando organizado de forma disciplinada ao longo do ciclo — do planejamento à pós-colheita — o monitoramento proporciona três impactos diretos: redução de custos (insumos, combustível, água), aumento da produtividade (por intervenção oportuna e eficiente) e suporte à sustentabilidade (racionalização de agroquímicos, conservação de água, menor compactação e tráfego). No contexto das Boas Práticas Agrícolas (BPA), o monitoramento é um eixo central, pois articula segurança alimentar, saúde humana, proteção ambiental e melhoria das condições de trabalho no campo[^1].

A prática de monitoramento tem de ser rotineira, cobrir todo o ciclo da cultura e seguir um fluxo claro: amostrar, identificar, decidir. A amostragem pode combinar percursos e métodos para detectar pragas e inimigos naturais; a identificação exige taxonomia e experiência; a decisão de controle deve ser acionada quando níveis de ação pré-definidos são atingidos, evitando aplicações desnecessárias e protegendo agentes úteis[^2]. A integração com imagens aéreas e WebMapping acelera esse ciclo ao transformar dados georreferenciados em mapas temáticos, consultas espaciais, análises multi-temporais e produtos prontos para máquinas agrícolas[^3]. O uso combinado de GPS e câmeras em dispositivos móveis completa o circuito, assegurando que cada ponto de observação, cada imagem e cada recomendação sejam localizáveis no espaço e auditáveis no tempo[^4].

Para ancorar esses objetivos, a adoção das diretrizes de BPA e de sistemas de monitoramento com visualização e consulta remota cria uma linguagem comum entre agrônomos, técnicos, gestores e máquinas — elevando a qualidade da decisão e a eficiência operacional[^1][^3].

## Fenologia das Culturas: Escalas V e R e Critérios de Classificação

Fenologia é o estudo dos fenômenos periódicos dos seres vivos e suas relações com o ambiente, traduzidas em marcos morfológicos da planta. Em culturas anuais como o feijoeiro, a escala de desenvolvimento se organiza em duas fases: vegetativa (V) e reprodutiva (R). Na fase vegetativa, os estádios V0 a V4 registram a transição de germinação e emergência até a estruturação de folhas compostas; na fase reprodutiva, R5 a R9 descrevem a evolução de florescimento, formação e preenchimento de vagens até a maturação[^5]. Essa escala orienta o manejo, pois cada estádio carrega exigências específicas de água, nutrientes e proteção, e responde de forma distinta a pragas e doenças.

Para visualizar os marcos fenológicos e sua lógica de progressão:

![Ilustração de marcos fenológicos do feijoeiro (Embrapa Arroz e Feijão)](.pdf_temp/viewrange_chunk_1_1_5_1762287300/images/moes1a.jpg)

A importância prática da fenologia está em conectar “o que observar” com “quando intervir”. Ao reconhecermos que a sensibilidade a pragas de vagens é maior a partir do florescimento e que a compactação do solo impacta o estande inicial, conseguimos calibrar a frequência de amostragens e o tipo de registro por estádio — de densidade de insetos a desfolha e sintomas foliares. Em termos de banco de dados, os marcos fenológicos funcionam como eixo temporal que condiciona consultas e análises posteriores.

Para explicitar a arquitetura da escala e suas implicações no manejo, a Tabela 1 resume os estádios fenológicos do feijoeiro, suas fases e observações-chave.

Tabela 1 — Estádios fenológicos do feijoeiro (fase V e fase R), definição breve e observações de manejo
| Fase | Estádio | Definição breve | Observações de manejo |
|---|---|---|---|
| Vegetativa (V) | V0 | Germinação | Atenção à qualidade de sementes e umidade do solo para emergência uniforme. |
| Vegetativa (V) | V1 | Emergência | Monitorar pragas de solo e estande; registrar plantas mortas e falhas de linha. |
| Vegetativa (V) | V2 | Folhas primárias | Início de nodulação (em leguminosas); observar desfolha por besouros e lagartas. |
| Vegetativa (V) | V3 | Primeira folha composta | Intensificar amostragens com pano-de-batida; verificar brotos terminais e folhas novas. |
| Vegetativa (V) | V4 | Terceira folha trifoliolada | Ponto para ajuste de frequência de inspeções; iniciar registros sistemáticos de inimigos naturais. |
| Reprodutiva (R) | R5 | Florescimento | Direcionar amostragens para flores, percevejos e lagartas que atacam vagens. |
| Reprodutiva (R) | R6 | Formação de vagens | Monitorar intensidade de ataque em vagens; correlacionar com umidade e temperatura. |
| Reprodutiva (R) | R7 | Enchimento de grãos | Avaliar sintomas foliares e de haste; planejar janelas de controle baseadas em níveis de ação. |
| Reprodutiva (R) | R8 | Maturação | Consolidar registros de danos e perdas; preparar logística de colheita. |
| Reprodutiva (R) | R9 | Maturação plena | Encerrar ciclo de monitoramento; arquivar dados para análise multi-temporal. |

Em síntese, a fenologia estrutura o “tempo técnico” do monitoramento — informando quando intensificar a coleta, quais métodos usar e como interpretar os achados à luz do desenvolvimento da cultura[^5].

## Monitoramento de Pragas: Métodos, Amostragem e Níveis de Ação

Um sistema robusto de monitoramento de pragas se baseia em três pilares: desenho de amostragem, métodos de captura e gatilhos de decisão (níveis de ação). A amostragem deve ser representativa, rápida, simples e de baixo custo, seguindo percursos como zigue-zague ou perímetro, com 20 plantas por ponto e, no mínimo, cinco pontos por talhão (totalizando 100 plantas), evitando bordaduras a menos de 30 metros da entrada[^6]. Essa estrutura reduz viés espacial e padroniza o esforço de campo.

Em termos de métodos, destacam-se:

- Pano-de-batida (pano branco de 1 m x 0,5 m com suportes laterais): inserir entre linhas e bater vigorosamente as plantas para deslocar insetos e permitir contagens. Adequado para lagartas e percevejos, complementado por observação direta em brotos e folhas novas quando alguns insetos não caem no pano[^6][^7].
- Armadilhas: feromônios (atraem espécies específicas), luminosas (atração de insetos noturnos entre 19h e 5h), e adesivas (cartões azuis/amarelos com lados quadriculados para contagem), úteis para monitoramento populacional contínuo e detecção precoce[^6].
- Observação direta: inspeção de brotos, faces superior e inferior de folhas, hastes e flores, registrando pragas, sintomas e inimigos naturais[^2].
- Amostragem de solo: antes da semeadura, avaliar 1 m² a 5 cm de profundidade, distribuindo pontos pela área; detectar lagartas de solo e gorgulhos para decidir se há necessidade de postergar o plantio[^6].

![Amostragem em zigue-zague em lavoura (Centro de Excelência)](.pdf_temp/viewrange_chunk_2_6_10_1762287279/images/065afu.jpg)

![Sequência do método do pano-de-batida (UFSC/Relatório)](.pdf_temp/viewrange_chunk_1_1_5_1762287279/images/qgldxz.jpg)

Para apoiar a execução disciplinada do monitoramento, a Tabela 2 organiza, por cultura, os principais métodos por estágio fenológico. A sequência reforça que o “como amostrar” deve evoluir com o desenvolvimento da planta, adaptando o esforço e o instrumento ao risco fitossanitário predominante.

Tabela 2 — Métodos de amostragem recomendados por cultura e estágio fenológico
| Cultura | Estágio fenológico | Métodos prioritários | Observações operacionais |
|---|---|---|---|
| Feijão | V0–V2 | Amostragem de solo (1 m², 5 cm), observação direta | Registrar plantas mortas e pragas de solo; evitar bordaduras. |
| Feijão | V3–V4 | Pano-de-batida; observação de brotos e folhas novas | Contar insetos no pano; observar lagartas e mosca-branca em 10 folhas do terço superior. |
| Feijão | R5–R8 | Pano-de-batida; observação de flores e vagens | Direcionar para percevejos e lagartas de vagens; registrar desfolha por classe. |
| Algodão | V0–V1 | Observação direta; armadilhas adesivas | Registrar colônias de pulgões; atenção a brotos terminais. |
| Algodão | V2–R | Pano-de-batida; armadilhas feromoniais e luminosas | Ajustar a periodicidade conforme nível de ação; observar botões e capulhos. |
| Milho | VE–V4 | Observação direta; amostragem de solo (pré-plantio) | Registrar plantas cortadas/murchas; definir ação para lagarta-rosca e broca-caule. |
| Milho | V5–R | Observação em fileiras; armadilhas luminosas | Medir densidades por metro; aplicar níveis de ação para Helicoverpa. |
| Soja | V0–V2 | Observação direta; amostragem de solo | Registrar falhas de estande e plantas mortas; atenção a pragas de raiz. |
| Soja | V3–R | Pano-de-batida; armadilhas | Contar lagartas (pequenas/grandes) e percevejos; preservar inimigos naturais[^7]. |

O terceiro pilar são os níveis de ação, gatilhos que informam o momento de controlar. A Tabela 3 sintetiza níveis de ação por cultura e praga conforme recomendações, oferecendo uma régua para decisões consistentes. A adoção rigorosa desses gatilhos é a peça-chave para reduzir aplicações e custos sem comprometer a produtividade[^6][^7][^8].

Tabela 3 — Níveis de ação recomendados por cultura e praga
| Cultura | Praga/Condição | Nível de ação | Observações |
|---|---|---|---|
| Feijão | Percevejos (spp.) | 2 por pano e/ou 5 em 10 rodadas | Amostrar no florescimento e formação de vagens[^6]. |
| Feijão | Ootheca bennig e vaquinhas | 20 insetos por pano (2 m de linha) ou desfolha: 50% (primárias), 30% (pré-flor), 15% (pós-flor) | Registrar classe de desfolha visual por raio de 5 m[^6]. |
| Feião | Larva-minadora (Ophiomyia phaseoli) | 5–10% de plantas infestadas | Inspeção duas vezes/semana; verificar marcas de oviposição, minas e inchamento de caule[^6]. |
| Feijão | Piolho-negro (Aphis fabae) | 4 plantas com sintomas em 2 m de linha | Observação direta; correlacionar com colonisation em folhas novas[^6]. |
| Algodão | Pulgão (Aphis fabae) | 5–15% de plantas com colônias | Atenção ao terço superior e brotos[^6]. |
| Algodão | Lagarta militar | 10% de plantas atacadas | Inspeção visual dirigida a folhas jovens[^6]. |
| Algodão | Lagarta-da-maçã | 13% de plantas atacadas | Verificar ataques em estruturas reprodutivas[^6]. |
| Algodão | Percevejos | 20% de plantas com botões atacados | Focalizar amostragem em botões florais[^6]. |
| Algodão | Helicoverpa | 11% de plantas atacadas | Combinar observação e pano-de-batida onde aplicável[^6]. |
| Milho | Helicoverpa (<8 mm) | 2 lagartas por metro | Medir tamanho; contar por metro percorrido[^6]. |
| Milho | Helicoverpa (>8 mm) | 1 lagarta por metro | Ajustar controle conforme tamanho e densidade[^6]. |
| Milho | Lagarta-rosca (Agrotis ipsilon) | 10% de plantas atacadas | Atentar para corte de plântulas na linha[^6]. |
| Milho | Broca-caule (Busseola fusca) | 11% de plantas atacadas | Registrar presença de galerias e perfurações[^6]. |
| Soja | Lagartas (spp.) | Amostragem semanal; separar pequenas (<1,5 cm) e grandes (>1,5 cm) | Usar pano-de-batida; preservar inimigos naturais; decidir controle com base em densidade e tamanho[^8]. |

Por fim, é fundamental documentar a diversidade de inimigos naturais — predadores, parasitoides, aranhas, tesourinhas, vespas e outros — durante a amostragem, pois sua preservação é um objetivo explícito do MIP e Impacta diretamente a sustentabilidade do controle[^2][^6]. Um bom cadastro de campo registra não apenas “quem” e “quantos” insetos pragas, mas também “quem” são seus agentes de controle biológico.

## Monitoramento de Doenças: Agentes, Sintomas e Registro

As doenças em plantas são causadas por fungos, bactérias, vírus e outros agentes, whose sintomas se manifestam em folhas, hastes, vagens e raízes, frequentemente sob condições de temperatura e umidade favoráveis. O diagnóstico de campo se apoia em padrões visuais e na correlação com o ambiente — por exemplo, oídio e míldio estão associados a umidade relativa alta e temperaturas amenas, enquanto bacterioses tendem a se proliferar em condições de alta umidade e temperatura, muitas vezes com espalhamento por respingo de irrigação ou chuva[^10][^11]. O registro disciplinado é determinante para decisões de controle químico e cultural, e para o acompanhamento da evolução temporal.

![Sintomas foliares ilustrados em material técnico (UFSC/Relatório)](.pdf_temp/viewrange_chunk_1_1_5_1762287279/images/qgldxz.jpg)

Para sistematizar o processo, a Tabela 4 propõe um catálogo de doenças com agente causal, sintomas típicos, condições favoráveis e o que registrar em campo.

Tabela 4 — Catálogo de doenças (fungos e bactérias): sintomas, condições favoráveis e campos de registro
| Doença | Agente | Sintomas típicos | Condições favoráveis | Campos de registro (mínimos) |
|---|---|---|---|---|
| Oídio | Fungo | Manchas brancas pulverulentas em folhas; reduzir fotosíntese | Umidade moderada, temperaturas amenas | Data/estádio; folha (posição/idade); % de folhas com sintomas; condições climáticas; imagens[^7][^11] |
| Míldio | Fungo | Manchas amareladas na face superior; pólvora cinza na face inferior | Alta umidade relativa | Data/estádio; % de desfolha; umidade relativa/temperatura; imagens[^7][^11] |
| Podridão-branca da haste (esclerotínia) | Fungo | Micélio branco denso; escleródios em hastes e vagens | Alta umidade; densidade de dossel | Data/estádio; incidência (%) por talhão; imagens; condições climáticas; histórico da área[^7][^11] |
| Bacterioses (diversas) | Bactérias | Murchas, lesões escuras em hastes/vagens, apodrecimento | Chuva/aspersão; temperaturas elevadas | Data/estádio; tipo de lesão; condições de irrigação; imagens; medidas culturais adotadas[^10][^11] |

Boas práticas de controle químico recomendam alternância de fungicidas de contato e sistêmico para mitigar resistência, respeitando janela de aplicação e modo de ação — sempre integrados a medidas culturais e monitoramento consistente[^9][^10]. Em termos de documentação, registrar a data, o estádio fenológico, a localização (GPS), a incidência (percentual de plantas ou folhas), as condições climáticas e imagens georreferenciadas constrói uma trilha de auditoria útil para análises e decisões.

## Déficit Hídrico e Manejo de Irrigação: Sensores, Variáveis e Decisão

A água é o eixo do crescimento e da qualidade fisiológica da produção. Monitorar o déficit hídrico de forma instrumental permite irrigar no momento certo, com a quantidade adequada, evitando estresse que reduza crescimento, comprometimento de vagens ou queda de produtividade. Há duas abordagens principais para monitorar a umidade do solo: medir conteúdo volumétrico (por capacitância, TDR — Time Domain Reflectometry,ou sensores alternativos) e medir tensão da água no solo (por sensores matriciais, como o GMS — granular matrix sensor)[^12][^13][^14]. A primeira informa “quanto de água” há no solo; a segunda informa “com que facilidade a planta retira essa água”. Em conjunto com critérios de manejo — personalizados por cultura, solo e sistema de irrigação — esses dados orientam a decisão.

Para contextualizar o posicionamento dos sensores e a lógica de manejo:

![Exemplo de esquema/fluxo de monitoramento e posicionamento de sensores (Embrapa Irrigação)](.pdf_temp/viewrange_chunk_1_1_5_1762287300/images/i9a44y.jpg)

A integração entre dados de sensores, fenologia e clima oferece uma visão dinâmica do risco de déficit. Em termos práticos, recomenda-se instalar sensores em pontos representativos do talhão — considerando variabilidade de solo, topografia e linhas de irrigação — em profundidades que capturem a zona de maior densidade de raízes (por exemplo, 15–30 cm, ajustando conforme cultura e manejo)[^12]. A leitura sistemática dos sensores deve estar acoplada à agenda de irrigação, com alertas e logs que evitem excessos (que favorecem doenças e lixiviação) e deficits (que geram estresse e perdas).

Para tornar claro o uso de cada tipo de sensor, a Tabela 5 compara os principais dispositivos e variáveis, enquanto a Tabela 6 resume um plano de posicionamento e leitura.

Tabela 5 — Comparativo de sensores de umidade/tensão: tipo, variável medida, profundidade, prós/contras, uso recomendado
| Sensor | Variável | Profundidade típica | Prós | Contras | Uso recomendado |
|---|---|---|---|---|---|
| Capacitância | Conteúdo volumétrico | 15–30 cm (ajustável) | Resposta rápida; custo moderado | Influência de salinidade e temperatura; calibração por solo | Monitoramento contínuo de zonas radiculares[^14] |
| TDR | Conteúdo volumétrico | 15–30 cm | Alta precisão; boa repetibilidade | Custo maior; exige instalação cuidadosa | Locais com necessidade de alta confiabilidade[^12] |
| GMS (tensiómetro matricial) | Tensão da água (kPa) | 15–30 cm | Direto em “disponibilidade para a planta”; boa integração com manejo | Resposta mais lenta; manutenção depois de instalação | Decisão de irrigação orientada por limiares de tensão[^13] |
| Sensor alternativo (capacitância) | Conteúdo volumétrico | 15–30 cm | Baixo custo; factível em pequena escala | Calibração necessária; variabilidade por solo | Validação local e uso educativo/custo-efetivo[^14] |

Tabela 6 — Plano de posicionamento e leitura de sensores por talhão
| Item | Recomendação | Observação |
|---|---|---|
| Número de pontos por talhão | 3–5 pontos representativos | Considerar variabilidade de solo e topografia[^12] |
| Profundidade de instalação | 15–30 cm (principal zona de raízes) | Ajustar conforme cultura e manejo[^12] |
| Frequência de leitura | Diária (automática) ou 2–3x por semana (manual) | Alinhar com alarmes e níveis de decisão[^12][^13] |
| Registros | Valor do sensor, timestamp, GPS do ponto, estado fenológico, clima | Estruturar logs para auditoria e análise temporal |
| Integração com decisão | Comparar a limiares de tensão (kPa) ou conteúdo volumétrico | Usar a fenologia para calibrar حسایسة حساسة (sensibilidade) à água[^5][^13] |

Ao adotar essa instrumentação, é essencial que o sistema registre valor do sensor, timestamp, GPS do ponto de instalação, estádio fenológico e condições climáticas. A análise temporal desses dados, cruzada com fenologia, permite ajustar janelas de irrigação, prevenir estresse e, por consequência, reduzir incidência de doenças favorecidas por excesso de umidade[^12][^13][^14].

## Sistema de Imagens: Captura, Processamento, Armazenamento e Metadados

Imagens são poderosas aliadas do monitoramento: complementam a visão humana, quantificam sintomas, registram contexto e permitem análises espaciais. A captura pode sedar em câmeras RGB, infravermelho próximo (NIR), multiespectrais ou hiperespectrais, instaladas em satélites, aeronaves e drones (VANTs). Cada plataforma traz um compromisso entre altura de captura, resolução espacial, custo e propósito — satélites para monitoramento geral e séries temporais amplas; drones para inspeção detalhada e mapas de alta resolução[^3][^15][^16][^17]. Em paralelo, o processamento digital — pré-processamento, segmentação, extração de características e classificação — transforma imagens em informação operacional, com recursos como histogramas de cor, texturas (estrutural, estatística, espectral) e algoritmos de reconhecimento de padrões[^18].

Para orientar a escolha e o uso, a Tabela 7 compara plataformas e sensores segundo critérios decisivos.

Tabela 7 — Comparativo de plataformas e sensores (satélite, drone, câmera RGB/NIR) para uso no monitoramento agrícola
| Plataforma | Sensor | Altura típica | Resolução | Custo relativo | Uso recomendado |
|---|---|---|---|---|---|
| Satélite | RGB / multiespectral | Centenas de km | Baixa a média | Baixo a moderado | Monitoramento geral, séries temporais, detecção de anomalias em escala[^15][^17] |
| Aeronave | Multiespectral/hiperespectral | Centenas a milhares de m | Média a alta | Moderado a alto | Mapeamento temático detalhado, geração de índices (ex.: NDVI), apoio a taxa variável[^3] |
| Drone (VANT) | RGB / NIR / multiespectral | 30–120 m | Alta (centímetros) | Moderado a alto | Inspeção de focos, quantificação de danos, mapas precisos por talhão[^16] |
| Câmera terrestre | RGB | Baixa | Alta (objeto próximo) | Baixo | Registro de sintomas e lesões em folhas, documentação de campo[^18] |

O sistema de imagens deve ser integrado ao ciclo de monitoramento, com metadados mínimos que assegurem rastreabilidade e contexto: data/hora, GPS (latitude, longitude, altitude), кульvara/cultura, estádio fenológico, condições climáticas (temperatura, umidade relativa, vento) e objetivo da captura (ex.: “suspeita de oídio”). O processamento segue um pipeline que inclui, quando necessário, pré-processamento (redução de ruído, correção de contraste e iluminação), segmentação (por limiarização — Otsu — ou agrupamento difuso — Fuzzy C-Means), extração de características (cor, forma, textura, pontos de interesse) e classificação (supervisionada ou não), gerando saídas quantitativas e mapas temáticos[^18].

![Exemplo de mapeamento temático a partir de imagens aéreas (Embrapa Instrumentação)](.pdf_temp/viewrange_chunk_1_1_5_1762287469/images/u0q2i7.jpg)

Para assegurar consistência, a Tabela 8 define metadados mínimos por captura, reforçando a disciplina de etiquetagem que viabiliza consultas espaciais e análises multi-temporais.

Tabela 8 — Metadados mínimos por imagem capturada
| Campo | Descrição |
|---|---|
| Timestamp | Data e hora da captura (ISO 8601) |
| GPS | Latitude, longitude, altitude (WGS84) |
| Cultura/Variedade | Espécie e cultivar |
| Estádio fenológico | Vn/Rn conforme escala da cultura |
| Sensor/Plataforma | Tipo de sensor e plataforma (ex.: RGB em drone) |
| Condições climáticas | Temperatura, umidade relativa, vento |
| Objetivo | Motivo da captura (ex.: “suspeita de oídio”) |
| Identificador único | GUID ou ID sequencial do registro |
| QA/QC | Indicador de controle de qualidade (validado/pendente) |

Em suma, imagens devem ser tratados como dados georreferenciados com valor analítico, integrados a um banco geográfico e visualizados por WebMapping, com classes definidas por critérios estatísticos, consultas espaciais e análise multi-temporal — capacidades que transformam dados em recomendações acionáveis[^3][^18].

## GPS e Georreferenciamento: Precisão, Integração e Registro

O Sistema de Posicionamento Global (GPS) é o mecanismo que associa observações a locais, garantindo rastreabilidade espacial eauditabilidade. Em agricultura de precisão, GPS suporta amostragem de solo, demarcação de áreas, definição de trajetórias de máquinas, piloto automático, aplicação em taxa variável e monitoramento de operações — agregando precisão, eficiência e segurança[^19][^4]. Na prática, dispositivos móveis (smartphones, PDAs) equipados com GPS e câmera, coupled with apps de campo, registram coordenadas de pontos de amostragem, imagens e observações com timestamp, integrando tudo a um sistema central.

Para guiar a integração, a Tabela 9 lista os campos mínimos que devem ser coletados em cada ponto com GPS.

Tabela 9 — Campos mínimos por ponto georreferenciado
| Campo | Descrição |
|---|---|
| Latitude | Graus decimais (WGS84) |
| Longitude | Graus decimais (WGS84) |
| Altitude | Metros (WGS84) |
| Acurácia (CE90) | Erro circular esperado (90%) |
| Timestamp | Data e hora (ISO 8601) |
| Cultura/Estádio | Identificação da cultura e estádio fenológico |
| Método de coleta | Pano, armadilha, observação direta, sensor de umidade, imagem |
| Observações | Descrição livre (praga, doença, dano, ação) |
| Identificador único | GUID ou ID sequencial |
| QA/QC | Status de validação de campo |

O georreferenciamento consistente é a base de consultas espaciais (“contains”, “within”, “overlaps”) e da geração de mapas temáticos que informam gestão e máquinas, tanto em desktop quanto em WebMapping[^3][^19]. A disciplina em registrar acurácia e timestamp também assegura qualidade de dados para análise temporal e auditoria.

## Estruturação de Dados no Banco: Modelo Entidade–Relacionamento

Para que o monitoramento se transforme em informação confiável, a modelagem de dados precisa refletir as entidades do mundo real e seus relacionamentos. Um Modelo Entidade–Relacionamento (MER) organiza tabelas com chaves primárias e estrangeiras, cardinalidades e constraints, e define índices para consultas frequentes e performance. Em termos práticos, o banco deve suportar dados geoespaciais e catálogos de pragas/doenças, além de metadados de imagens e leituras de sensores, com integridade referencial e auditoria (logs de criação/atualização, e flags de QA/QC)[^20][^21][^3].

A Tabela 10 apresenta as principais entidades e relacionamentos com chaves e cardinalidades.

Tabela 10 — Entidades e relacionamentos (MER) com chaves e cardinalidades
| Entidade | Atributos principais | Chaves | Relacionamentos (cardinalidade) |
|---|---|---|---|
| Propriedade | id, nome, endereço | PK: id | Talhão (1:N); Propriedade→Usuário (N:M) |
| Talhão | id, area, solo, cultivo, geo | PK: id; FK: propriedade_id | Amostra (1:N); Sensor (1:N); Imagem (1:N); Observacao (1:N) |
| Cultura/Variedade | id, espécie, cultivar | PK: id | Talhão (N:1); EstagioFenologico (1:N) |
| EstagioFenologico | id, codigo (V0–V4, R5–R9), descrição | PK: id; UQ: codigo | Talhão (N:1); Observacao (1:N) |
| Praga | id, nome científico, comum | PK: id | N:M com Observacao (via tabela associativa) |
| Doenca | id, agente, sintomas | PK: id | N:M com Observacao (via tabela associativa) |
| InimigoNatural | id, nome, grupo | PK: id | N:M com Observacao (via tabela associativa) |
| Observacao | id, data, estadio_id, talhao_id, tipo, notas | PK: id; FK: estadio_id, talhao_id | N:M com Praga/Doenca/InimigoNatural; имеет 1:1 com Amostra? (opcional) |
| Amostra | id, observacao_id, método, ponto_gps | PK: id; FK: observacao_id | Imagem (1:N); Sensor (1:N) |
| Imagem | id, amostra_id, caminho, sensor, metadados | PK: id; FK: amostra_id | Arquivo (1:N) |
| Sensor | id, amostra_id, tipo, valor, unidade, profundidade | PK: id; FK: amostra_id | — |
| Aplicacao | id, talhao_id, data, produto, dose, alvo | PK: id; FK: talhao_id | — |
| Irrigacao | id, talhao_id, data, volume, duração, método | PK: id; FK: talhao_id | — |
| Arquivo | id, imagem_id, formato, hash | PK: id; FK: imagem_id | — |
| Usuario | id, nome, papel | PK: id | Propriedade (N:M) |
| QA/QC | id, entidade, registro_id, status, responsável, data | PK: id | Aplica-se a todas (entidade, registro_id) |

A modelagem deve contemplar índices em campos de consulta recorrente (talhao_id, data, estadio_id, tipo de observacao) e constraints de integridade referencial, além de colunas de auditoria (created_at, updated_at, created_by, updated_by) e status de QA/QC. A integração com banco geográfico e WebMapping demanda geometrias de talhões (polígonos), pontos de amostras (geometrias POINT) e camadas temáticas (imagens processadas), com suporte a operadores espaciais e multi-temporalidade[^3][^20][^21].

## Integração, Visualização e Recomendações (WebMapping e Agricultura de Precisão)

WebMapping é a camada que converte dados georreferenciados e imagens em informação para decisão. Ao integrar coletas de campo (PDAs com GPS e câmera), imageamento aéreo e dados de sensores, o sistema gera mapas temáticos com classes definidas por critérios estatísticos, suporta consultas restritivas e operadores booleanos, e realiza análises multi-temporais por safras — produzindo saídas interoperáveis com SIGs e máquinas agrícolas[^3][^18][^17].

![Exemplo de análise e transformação da informação em produto cartográfico (Embrapa Instrumentação)](.pdf_temp/viewrange_chunk_1_1_5_1762287468/images/bv2izs.jpg)

As recomendações técnicas emergem ao cruzar camadas: mapa de pragas (densidade por ponto) com mapa de inimigos naturais; mapa de doenças (incidência e sintomas) com mapa de umidade (tensão/conteúdo) e fenologia (estádios críticos); mapa de desfolha e mapa de imagens (RGB/NIR). A partir desses cruzamentos, o sistema gera alertas (ex.: “atingiu nível de ação para percevejos no talhão T12 em R6”) e produtos para máquinas (ex.: mapa de aplicação em taxa variável para correção de fertilidade ou sementes em áreas com falhas de estande), exportados em formatos padrão para interoperabilidade[^3][^18][^17].

A Tabela 11 define um fluxo de dados típico, desde a captura até a exportação e uso em máquinas.

Tabela 11 — Fluxo de dados: da coleta à decisão e exportação
| Etapa | Entrada | Processamento | Saída | Uso |
|---|---|---|---|---|
| Coleta em campo | PDAs com GPS e câmera; sensores; armadilhas | QA/QC inicial; sincronismo | Registros georreferenciados; imagens com metadados | Base de dados geográfica |
| Imageamento | Aeronaves/drones; satélites | Processamento (segmentação, classificação) | Mapas temáticos (pragas, doenças, solo, umidade) | Vistorias dirigidas e diagnóstico |
| Integração | Dados de campo + imagens | Banco geográfico; consultas espaciais | Camadas integradas e análises multi-temporais | Alertas e relatórios |
| Recomendação | Saídas analíticas + níveis de ação | Regras de decisão + fenologia | Mapa de recomendações (ex.: pulverização, irrigação) | Intervenção no campo |
| Exportação | Produtos finais | Formatos padrão ( shapefiles, raster, ISOXML) | Transferência para máquinas/SIGs | Execução e auditoria |

A viabilização desse fluxo exige disciplina em metadados, reprodutibilidade dos critérios estatísticos e interoperabilidade. Em ambientes com múltiplas fontes de dados, a consistência de identificadores e timestamps é tão crítica quanto a precisão espacial.

## Governança de Dados, Rastreabilidade e Conformidade com BPA

Governança de dados organiza quem faz o quê, quando e como, assegurando qualidade, rastreabilidade e auditoria. No contexto das BPA, isso inclui: papéis claros (inspetor de campo, manejador de pragas), procedimentos padronizados (fichas e caderno de campo), qualidade de dados (validação, logs de auditoria) e conformidade com regulamentações — desde o uso de agroquímicos registrados e programas reconhecidos até transparência e segurança alimentar[^1][^2]. Boas práticas regulatórias e manuais complementares ajudam a institutionalizar protocolos, capacitações e registros que demonstram a adoção de BPA.

A Tabela 12 sintetiza um checklist de governança aplicável ao monitoramento.

Tabela 12 — Checklist de governança de dados (papéis, procedimentos, QA/QC, auditoria, conformidade)
| Item | Descrição | Responsável | Periodicidade |
|---|---|---|---|
| Papéis e responsabilidades | Inspetor de campo, manejador de pragas, responsável por dados | Gestão técnica | Por safra |
| Procedimentos padronizados | Fichas/caderno de campo; protocolos de amostragem e metadados | Inspetor de campo | Contínuo |
| QA/QC de registros | Validação cruzada; flags de qualidade; correções | Responsável por dados | Semanal |
| Logs de auditoria | Criação/atualização de registros; trilha de mudanças | TI/Dados | Contínuo |
| Conformidade com BPA | Regulamentações e programas reconhecidos; registros de aplicações | Gestão técnica | Por evento |
| Capacitação | Treinamentos em MIP, BPA, uso de dispositivos | RH/Gestão | Por safra |
| Segurança e backup | Armazenamento seguro; replicação; acesso | TI/Dados | Contínuo |

A governança é mais do que um documento; é a prática diária que sustenta decisões técnicas e legais. A cada inspeção, o preenchimento correto dos campos e a validação posterior alimentam um ciclo virtuoso de melhoria contínua e conformidade[^1][^2].

## Apêndices Operacionais: Fichas, Planilhas e Protocolos de Campo

Para garantir execução disciplinada, são necessários protocolos operacionais claros, fichas e planilhas padronizadas, além de um fluxo digital que integre coletas e sincronização. O conjunto deve explicitar frequência mínima por fase (por exemplo, inspeções semanais no MIP), clarificar níveis de ação e estabelece rotinas de QA/QC.

![Exemplo de ilustração de inspeção de pragas em documento técnico (Embrapa Documentos 183)](.pdf_temp/viewrange_chunk_1_1_5_1762287279/images/qgldxz.jpg)

A Tabela 13 apresenta um modelo de ficha de campo de inspeção; a Tabela 14, um protocolo de amostragem em sequência; e a Tabela 15 define um fluxo de sincronização digital.

Tabela 13 — Modelo de ficha de campo de inspeção (dados mínimos)
| Campo | Descrição |
|---|---|
| Propriedade/Talhão | Identificação e geo |
| Data/Timestamp | ISO 8601 |
| Cultura/Estádio | Espécie e Vn/Rn |
| Método de amostragem | Pano/armadilha/observação/solo |
| Ponto GPS | Latitude, longitude, altitude, acurácia |
| Praga/Doença/InimigoNatural | Nome e contagem/incidência |
| Sintomas/Dano | Descrição e classe (ex.: desfolha %) |
| Condições climáticas | Temperatura, UR, vento |
| Imagens | Identificador de arquivo e metadados |
| Nível de ação | Verificação (atingido/não atingido) |
| Decisão | Ação recomendada (controle/observação) |
| Responsável | Inspetor e manejador |
| QA/QC | Status e observações |

Tabela 14 — Protocolo de amostragem por cultura e fase
| Cultura | Fase | Sequência operacional | Observações |
|---|---|---|---|
| Feijão | V0–V2 | 5 pontos; 20 plantas; 30 m de bordadura; 1 m² de solo a 5 cm | Registrar plantas mortas e pragas de solo[^6]. |
| Feijão | V3–V4 | Pano-de-batida; observar brotos e folhas novas | Contar insetos; anotar desfolha (raio 5 m)[^6]. |
| Feijão | R5–R8 | Pano-de-batida; observação de flores/vagens | Direcionar para percevejos e lagartas de vagens[^6]. |
| Algodão | V0–V1 | Observação direta; armadilhas adesivas | Registrar colônias de pulgões[^6]. |
| Algodão | V2–R | Pano; feromônios/luminosas | Ajustar periodicidade por níveis de ação[^6]. |
| Milho | VE–V4 | Observação direta; amostragem de solo | Plantas cortadas/murchas; lagarta-rosca[^6]. |
| Milho | V5–R | Contagem por metro; armadilhas | Definir ação por tamanho de Helicoverpa[^6]. |
| Soja | V0–V2 | Observação direta; solo | Foco em pragas de raiz; estande[^7]. |
| Soja | V3–R | Pano-de-batida | Separar lagartas por tamanho; níveis de ação[^8]. |

Tabela 15 — Fluxo de sincronização digital (coleta → conversão → integração → publicação)
| Etapa | Ferramenta | Produto | Destino |
|---|---|---|---|
| Coleta | App móvel (PDA/smartphone) | Registros com GPS/câmera; metadados | Repositório local |
| Conversão | ETL/serviço de integração | Padronização de formatos; QA/QC | Banco geográfico |
| Publicação | WebMapping | Mapas temáticos; consultas | Painéis e máquinas |

Essa estrutura operacional torna previsível a rotina de campo e reduz variabilidade entre técnicos e talhões — o que, por sua vez, melhora a confiabilidade dos níveis de ação e a qualidade das decisões[^2][^6][^3].

## Lacunas de Informação e Prioridades de Preenchimento

Embora este blueprint apresente uma base sólida, há lacunas que devem ser sanadas na implementação local:

- Limiarização precisa de irrigação (tensão e conteúdo volumétrico) por cultura/solo/sistema: Os valores de decisão (kPa ou %) variam com textura, manejo e fase fenológica; é necessário calibração local e documentação de limiares por talhão[^12][^13][^14].
- Níveis de ação detalhados para mais culturas e pragas além de feijão, milho, algodão e soja: Expandir o catálogo de níveis (ex.: culturas hortícolas, cereais menores), com base em recomendações regionais[^6][^8].
- Detalhamento fenológico por cultura além do feijão (ex.: soja, milho, algodão) com critérios operacionais por estádio: Consolidar escalas e observações por cultura[^5].
- Atributos físicos e químicos de solo requeridos por cultura (além de umidade): Mapear pH, MO, P, K, Ca, Mg, textura e outros por cultivo, integrando amostragem de solo à rotina[^20].
- Padrões de metadados específicos para imagens (camera model, espectros, calibrations, EXIF completo): Definir e documentar perfis de captura e processamento por sensor[^3][^18].
- Políticas de retenção de dados, backup e segurança: Formalizar retenção por tipo de registro, ciclo de backup e acesso, alinhadas a BPA e auditoria[^1].
- Especificação de acurácia GPS por operação (amostragens vs. mapeamento vs. aplicação em taxa variável): Estabelecer requisitos de acurácia (ex.: CE90) por atividade e garantir conformidade[^19].

O plano de implementação deve priorizar essas lacunas em sequência: começar por culturas e operações de maior impacto (soja, milho, feijão, algodão), consolidar sensores e limiares de irrigação, e ampliar catálogos de níveis de ação e fenologia para outras culturas. Ao mesmo tempo, formalizar metadados de imagem, acurácia GPS e políticas de retenção e backup.

---

## Referências

[^1]: Ministério da Agricultura e Pecuária (MAPA). Boas Práticas Agrícolas. https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/boas-praticas-agricolas
[^2]: Embrapa. Manual Prático para o Monitoramento e Controle das Pragas da Lima Ácida Tahiti (Documentos 183). https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/783155/1/documentos183.pdf
[^3]: Embrapa Instrumentação Agropecuária. Monitoramento Agrícola a Partir de Imagens Aéreas e WebMapping (Boletim de Pesquisa e Desenvolvimento 08). https://www.infoteca.cnptia.embrapa.br/bitstream/doc/30164/1/BPD082004.pdf
[^4]: Climate FieldView. GPS Agrícola: O Que É e Quais Benefícios. https://blog.climatefieldview.com.br/gps-agricola
[^5]: Embrapa Arroz e Feijão. Conhecendo a Fenologia do Feijoeiro e Seus Aspectos Fitotécnicos (2ª edição). https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1098515/1/CNPAF2018lv2edrevampfenologiafeijoeiromar2019.pdf
[^6]: Centro de Excelência contra a Fome (WFP). Amostragem e Monitoramento de Pragas e Doenças (2024). https://centrodeexcelencia.org.br/wp-content/uploads/2024/03/amostragem-e-monitoramento-de-pragas_1903.pdf
[^7]: UFSC. Monitoramento de Pragas e Doenças e Vistoria de Lavouras de Soja Destinadas à Produção de Sementes. https://repositorio.ufsc.br/bitstream/handle/123456789/117751/171344.pdf?sequence=1&isAllowed=y
[^8]: Embrapa. Resultados do Manejo Integrado de Pragas da Soja na Safra 2015/16 (Doc 375). https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1053139/1/Doc375MIPOL1.pdf
[^9]: Embrapa. Doenças, Monitoramento e Controle. https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/150589/1/DoencasMonitoramentoeControle.pdf
[^10]: Embrapa. Fungicidas I: Utilização no Controle Químico de Doenças e sua Ação (FOL5993). https://www.infoteca.cnptia.embrapa.br/bitstream/doc/704072/1/FOL59930001.pdf
[^11]: CropLife Brasil. Fungicidas: Proteção dos Alimentos Contra Fungos. https://croplifebrasil.org/fungicidas-conheca-os-produtos-responsaveis-por-proteger-os-alimentos-dos-fungos/
[^12]: Embrapa. Capítulo 5 | Manejo da Água de Irrigação. https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/915574/1/IRRIGACAOeFERTIRRIGACAOcap5.pdf
[^13]: Irrometer. Monitoramento da Irrigação por Meio da Tensão da Água do Solo (Boletim GMS). https://www.irrometer.com/pdf/ext/MONITORAMENTO_DA_IRRIGA%C3%87%C3%83O_POR_MEIO_DA_TENS%C3%83O_DA_%C3%81GUA_DO_SOLO-BoletimGMS_Portuguese.pdf
[^14]: SciELO. Manejo da Irrigação Utilizando Sensor da Umidade do Solo Alternativo. https://www.scielo.br/j/rbeaa/a/YFWmWDkXbKh4TFcVx3DpYnD/
[^15]: EOS Data Analytics. Drones vs. Satélites na Agricultura. https://eos.com/pt/blog/drones-e-satelites-na-agricultura/
[^16]: Mosaic Agrotech. Processamento de Imagens RGB e NIR de Drones. https://mosaicagro.tech/processamento-de-imagens-rgb-e-nir-de-drones-a-revolucao-da-agricultura-de-precisao/
[^17]: Aegro. Imagens de Satélite na Agricultura: Guia Completo. https://aegro.com.br/blog/imagens-de-satelite-na-agricultura/
[^18]: UNIFIA. Monitoramento de Culturas Agrícolas utilizando Visão Artificial. https://portal.unisepe.com.br/unifia/wp-content/uploads/sites/10001/2021/10/MONITORAMENTO-DE-CULTURAS-AGR%C3%8DCOLAS-UTILIZANDO-VIS%C3%83O-ARTIFICIAL-P%C3%A1g-232-%C3%A0-243.pdf
[^19]: Embrapa Satélites de Monitoramento. GPS (Portal). https://www.embrapa.br/satelites-de-monitoramento/missoes/gps
[^20]: IBM Docs. Estrutura do Banco de Dados Relacional. https://www.ibm.com/docs/pt-br/mfci/7.6.2?topic=design-relational-database-structure
[^21]: DevMedia. MER e DER: Modelagem de Bancos de Dados. https://www.devmedia.com.br/mer-e-der-modelagem-de-bancos-de-dados/14332