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
        const { organizationId, periodo, tipoAnalise } = await req.json();

        if (!organizationId) {
            throw new Error('organizationId é obrigatório');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuração do Supabase ausente');
        }

        // Obter visitas do período
        const visitasResponse = await fetch(
            `${supabaseUrl}/rest/v1/visitas_tecnicas?organization_id=eq.${organizationId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!visitasResponse.ok) {
            throw new Error('Falha ao buscar visitas');
        }

        const visitas = await visitasResponse.json();

        // Obter clientes
        const clientesResponse = await fetch(
            `${supabaseUrl}/rest/v1/clientes?organization_id=eq.${organizationId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const clientes = await clientesResponse.json();

        // Obter levantamentos
        const levantamentosResponse = await fetch(
            `${supabaseUrl}/rest/v1/visita_levantamentos?organization_id=eq.${organizationId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        const levantamentos = await levantamentosResponse.json();

        // Análise de dados
        const insights = {
            resumo: {
                totalVisitas: visitas.length,
                totalClientes: clientes.length,
                visitasRealizadas: visitas.filter(v => v.status === 'realizada').length,
                visitasPlanejadas: visitas.filter(v => v.status === 'planejada').length,
                visitasCanceladas: visitas.filter(v => v.status === 'cancelada').length,
                totalLevantamentos: levantamentos.length
            },
            visitasPorCliente: {},
            visitasPorMes: {},
            culturasVisitadas: {},
            tiposVisita: {},
            statusDistribuicao: {},
            tendencias: [],
            recomendacoes: [],
            alertas: []
        };

        // Análise por cliente
        visitas.forEach(visita => {
            const clienteId = visita.cliente_id;
            if (!insights.visitasPorCliente[clienteId]) {
                insights.visitasPorCliente[clienteId] = {
                    total: 0,
                    realizadas: 0,
                    planejadas: 0
                };
            }
            insights.visitasPorCliente[clienteId].total++;
            if (visita.status === 'realizada') insights.visitasPorCliente[clienteId].realizadas++;
            if (visita.status === 'planejada') insights.visitasPorCliente[clienteId].planejadas++;
        });

        // Análise por mês
        visitas.forEach(visita => {
            const data = new Date(visita.data_visita);
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            insights.visitasPorMes[mesAno] = (insights.visitasPorMes[mesAno] || 0) + 1;
        });

        // Análise por cultura
        visitas.forEach(visita => {
            if (visita.cultura) {
                insights.culturasVisitadas[visita.cultura] = (insights.culturasVisitadas[visita.cultura] || 0) + 1;
            }
        });

        // Análise por tipo
        visitas.forEach(visita => {
            if (visita.tipo_visita) {
                insights.tiposVisita[visita.tipo_visita] = (insights.tiposVisita[visita.tipo_visita] || 0) + 1;
            }
        });

        // Distribuição de status
        visitas.forEach(visita => {
            insights.statusDistribuicao[visita.status] = (insights.statusDistribuicao[visita.status] || 0) + 1;
        });

        // Gerar tendências
        const visitasOrdenadas = visitas.sort((a, b) => 
            new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime()
        );

        if (visitasOrdenadas.length > 0) {
            const primeiraVisita = new Date(visitasOrdenadas[0].data_visita);
            const ultimaVisita = new Date(visitasOrdenadas[visitasOrdenadas.length - 1].data_visita);
            const diasEntre = Math.floor((ultimaVisita.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
            const mediaVisitasPorMes = diasEntre > 0 ? (visitas.length / (diasEntre / 30)).toFixed(1) : 0;

            insights.tendencias.push({
                tipo: 'frequencia',
                titulo: 'Frequência de Visitas',
                valor: `${mediaVisitasPorMes} visitas/mês`,
                descricao: `Média de ${mediaVisitasPorMes} visitas técnicas por mês`
            });
        }

        // Gerar recomendações baseadas nos dados
        const clientesComPoucasVisitas = Object.entries(insights.visitasPorCliente)
            .filter(([_, data]) => data.total < 2)
            .length;

        if (clientesComPoucasVisitas > 0) {
            insights.recomendacoes.push({
                tipo: 'atencao',
                titulo: 'Clientes com Poucas Visitas',
                descricao: `${clientesComPoucasVisitas} cliente(s) têm menos de 2 visitas registradas. Considere aumentar a frequência.`,
                prioridade: 'media'
            });
        }

        if (insights.resumo.visitasPlanejadas > insights.resumo.visitasRealizadas * 0.5) {
            insights.alertas.push({
                tipo: 'alerta',
                titulo: 'Muitas Visitas Planejadas',
                descricao: 'Há muitas visitas planejadas em relação às realizadas. Acompanhe a execução.',
                prioridade: 'alta'
            });
        }

        // Top 5 clientes mais visitados
        const topClientes = Object.entries(insights.visitasPorCliente)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 5)
            .map(([clienteId, data]) => {
                const cliente = clientes.find(c => c.id === clienteId);
                return {
                    clienteId,
                    nomeCliente: cliente?.nome || 'Desconhecido',
                    totalVisitas: data.total,
                    visitasRealizadas: data.realizadas
                };
            });

        insights.topClientes = topClientes;

        // Retornar análise completa
        return new Response(JSON.stringify({
            data: {
                insights,
                periodo: periodo || 'todos',
                geradoEm: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na análise de dados:', error);

        const errorResponse = {
            error: {
                code: 'ANALISE_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
