Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { imageData, fileName, visitaId, atividadeId, titulo, descricao, latitude, longitude, tags, organizationId } = await req.json();

        if (!imageData || !fileName || !visitaId || !organizationId) {
            throw new Error('imageData, fileName, visitaId e organizationId são obrigatórios');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuração do Supabase ausente');
        }

        // Extrair dados base64 da data URL
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];

        // Converter base64 para binário
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Gerar caminho de armazenamento com timestamp
        const timestamp = Date.now();
        const storagePath = `${organizationId}/${visitaId}/${timestamp}-${fileName}`;

        // Upload para Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/visitas-fotos/${storagePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Falha no upload: ${errorText}`);
        }

        // Obter URL pública
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/visitas-fotos/${storagePath}`;

        // Obter usuário do header de autenticação
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Header de autorização ausente');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verificar token e obter usuário
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Token inválido');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Salvar metadados da foto no banco de dados
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/visita_fotos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                organization_id: organizationId,
                visita_id: visitaId,
                atividade_id: atividadeId || null,
                titulo: titulo || fileName,
                descricao: descricao || '',
                url: publicUrl,
                file_name: fileName,
                file_size: binaryData.length,
                mime_type: mimeType,
                latitude: latitude || null,
                longitude: longitude || null,
                tags: tags || [],
                uploaded_by: userId
            })
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Falha ao inserir no banco de dados: ${errorText}`);
        }

        const fotoData = await insertResponse.json();

        return new Response(JSON.stringify({
            data: {
                publicUrl,
                foto: fotoData[0]
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no upload de foto:', error);

        const errorResponse = {
            error: {
                code: 'FOTO_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
