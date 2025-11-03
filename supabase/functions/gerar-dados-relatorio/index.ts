Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { visitaId, organizationId, tipoRelatorio } = await req.json();

        if (!visitaId || !organizationId) {
            throw new Error('visitaId e organizationId são obrigatórios');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuração do Supabase ausente');
        }

        // Buscar dados da visita
        const visitaResponse = await fetch(
            `${supabaseUrl}/rest/v1/visitas_tecnicas?id=eq.${visitaId}&organization_id=eq.${organizationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!visitaResponse.ok) {
            throw new Error('Falha ao buscar visita');
        }

        const visitas = await visitaResponse.json();
        if (visitas.length === 0) {
            throw new Error('Visita não encontrada');
        }

        const visita = visitas[0];

        // Buscar cliente
        const clienteResponse = await fetch(
            `${supabaseUrl}/rest/v1/clientes?id=eq.${visita.cliente_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const clientes = await clienteResponse.json();
        const cliente = clientes[0] || {};

        // Buscar fazenda (se houver)
        let fazenda = {};
        if (visita.fazenda_id) {
            const fazendaResponse = await fetch(
                `${supabaseUrl}/rest/v1/fazendas?id=eq.${visita.fazenda_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const fazendas = await fazendaResponse.json();
            fazenda = fazendas[0] || {};
        }

        // Buscar talhão (se houver)
        let talhao = {};
        if (visita.talhao_id) {
            const talhaoResponse = await fetch(
                `${supabaseUrl}/rest/v1/talhoes?id=eq.${visita.talhao_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const talhoes = await talhaoResponse.json();
            talhao = talhoes[0] || {};
        }

        // Buscar atividades
        const atividadesResponse = await fetch(
            `${supabaseUrl}/rest/v1/visita_atividades?visita_id=eq.${visitaId}&order=ordem.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const atividades = await atividadesResponse.json();

        // Buscar fotos
        const fotosResponse = await fetch(
            `${supabaseUrl}/rest/v1/visita_fotos?visita_id=eq.${visitaId}&order=ordem.asc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const fotos = await fotosResponse.json();

        // Buscar levantamentos
        const levantamentosResponse = await fetch(
            `${supabaseUrl}/rest/v1/visita_levantamentos?visita_id=eq.${visitaId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const levantamentos = await levantamentosResponse.json();

        // Buscar geolocalização
        const geolocalizacaoResponse = await fetch(
            `${supabaseUrl}/rest/v1/visita_geolocalizacao?visita_id=eq.${visitaId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const geolocalizacao = await geolocalizacaoResponse.json();

        // Buscar dados da organização
        const organizationResponse = await fetch(
            `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const organizations = await organizationResponse.json();
        const organization = organizations[0] || {};

        // Buscar técnico responsável
        let tecnico = {};
        if (visita.tecnico_responsavel_id) {
            const tecnicoResponse = await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${visita.tecnico_responsavel_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            const tecnicos = await tecnicoResponse.json();
            tecnico = tecnicos[0] || {};
        }

        // Estruturar dados do relatório
        const relatorioData = {
            informacoes: {
                titulo: visita.titulo,
                dataVisita: visita.data_visita,
                horaInicio: visita.hora_inicio,
                horaFim: visita.hora_fim,
                status: visita.status,
                tipoVisita: visita.tipo_visita,
                clima: visita.clima,
                temperatura: visita.temperatura,
                geradoEm: new Date().toISOString()
            },
            organizacao: {
                nome: organization.name,
                cnpj: organization.cnpj,
                email: organization.email,
                telefone: organization.phone,
                logoUrl: organization.logo_url
            },
            cliente: {
                nome: cliente.nome,
                cpfCnpj: cliente.cpf_cnpj,
                telefone: cliente.telefone,
                email: cliente.email,
                cidade: cliente.cidade,
                estado: cliente.estado
            },
            fazenda: fazenda.nome ? {
                nome: fazenda.nome,
                areaTotal: fazenda.area_total,
                unidadeArea: fazenda.unidade_area,
                cidade: fazenda.cidade,
                estado: fazenda.estado
            } : null,
            talhao: talhao.nome ? {
                nome: talhao.nome,
                area: talhao.area,
                culturaAtual: talhao.cultura_atual,
                safraAtual: talhao.safra_atual
            } : null,
            tecnico: {
                nome: tecnico.full_name,
                email: tecnico.email,
                telefone: tecnico.phone
            },
            conteudo: {
                objetivo: visita.objetivo,
                resumo: visita.resumo,
                recomendacoes: visita.recomendacoes,
                proximosPassos: visita.proximos_passos,
                cultura: visita.cultura,
                safra: visita.safra,
                estagioCultura: visita.estagio_cultura
            },
            atividades: atividades.map(ativ => ({
                tipo: ativ.tipo,
                titulo: ativ.titulo,
                descricao: ativ.descricao,
                observacoes: ativ.observacoes,
                horaAtividade: ativ.hora_atividade,
                dadosJson: ativ.dados_json
            })),
            fotos: fotos.map(foto => ({
                titulo: foto.titulo,
                descricao: foto.descricao,
                url: foto.url,
                thumbnailUrl: foto.thumbnail_url,
                tags: foto.tags,
                isDestaque: foto.is_destaque
            })),
            levantamentos: levantamentos.map(lev => ({
                tipo: lev.tipo,
                titulo: lev.titulo,
                categoria: lev.categoria,
                dados: lev.dados,
                unidade: lev.unidade,
                valorNumerico: lev.valor_numerico,
                valorTexto: lev.valor_texto,
                metodologia: lev.metodologia,
                observacoes: lev.observacoes
            })),
            localizacao: geolocalizacao.length > 0 ? {
                latitude: geolocalizacao[0].latitude,
                longitude: geolocalizacao[0].longitude,
                altitude: geolocalizacao[0].altitude,
                descricao: geolocalizacao[0].descricao
            } : null,
            estatisticas: {
                totalAtividades: atividades.length,
                totalFotos: fotos.length,
                totalLevantamentos: levantamentos.length,
                duracaoVisita: visita.hora_inicio && visita.hora_fim ? 
                    calcularDuracao(visita.hora_inicio, visita.hora_fim) : null
            }
        };

        return new Response(JSON.stringify({
            data: {
                relatorio: relatorioData,
                tipoRelatorio: tipoRelatorio || 'completo'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao gerar dados do relatório:', error);

        const errorResponse = {
            error: {
                code: 'RELATORIO_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Função auxiliar para calcular duração
function calcularDuracao(horaInicio, horaFim) {
    try {
        const [hInicio, mInicio] = horaInicio.split(':').map(Number);
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const minutosInicio = hInicio * 60 + mInicio;
        const minutosFim = hFim * 60 + mFim;
        const diferencaMinutos = minutosFim - minutosInicio;
        const horas = Math.floor(diferencaMinutos / 60);
        const minutos = diferencaMinutos % 60;
        return `${horas}h ${minutos}min`;
    } catch {
        return null;
    }
}
