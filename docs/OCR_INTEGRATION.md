# Integração OCR - Google Cloud Vision API

## Visão Geral
A Edge Function `process-soil-report` processa laudos de análise de solo através de OCR usando Google Cloud Vision API.

## Configuração da API

### 1. Obter Chave da API
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API "Cloud Vision API"
4. Vá em "Credentials" → "Create Credentials" → "API Key"
5. Copie a chave gerada

### 2. Configurar na Aplicação
Adicione a variável de ambiente no Supabase:
```bash
GOOGLE_VISION_API_KEY=sua-chave-aqui
```

## Funcionalidade

### Com Google Vision API Configurada
- **Extração Automática**: OCR processa texto do laudo
- **Identificação de Parâmetros**: pH, P, K, Ca, Mg, MO automaticamente
- **Interpretação**: Classifica valores como baixo/médio/alto
- **Metadados**: Extrai laboratório e data da análise

### Sem API Configurada (Fallback)
- **Modo Manual**: Sistema aceita upload mas requer revisão humana
- **Dados Padrão**: Cria estrutura básica para preenchimento posterior
- **Notificação**: Usuario é informado que extração automática não está disponível

## Padrões de Extração

### Parâmetros Suportados
- **pH**: Formato `pH: 6.2` ou `pH = 6.2`
- **Fósforo (P)**: `P: 15.5` em mg/dm³ ou ppm
- **Potássio (K)**: `K: 85.0` em mg/dm³
- **Cálcio (Ca)**: `Ca: 3.5` em cmolc/dm³
- **Magnésio (Mg)**: `Mg: 1.2` em cmolc/dm³
- **Matéria Orgânica (MO)**: `M.O.: 2.8%`

### Formatos de Data Reconhecidos
- `DD/MM/YYYY`
- `DD-MM-YYYY`
- `DD.MM.YYYY`

### Laboratórios
Padrões: "Laboratório:", "Lab.:", "Lab:"

## Faixas de Interpretação

### pH
- **Baixo**: < 5.5
- **Ideal**: 5.5 - 6.5
- **Alto**: > 6.5

### Fósforo (P) - mg/dm³
- **Baixo**: < 10
- **Médio**: 10 - 30
- **Alto**: > 30

### Potássio (K) - mg/dm³
- **Baixo**: < 40
- **Médio**: 40 - 120
- **Alto**: > 120

### Matéria Orgânica (MO) - %
- **Baixo**: < 2.0
- **Médio**: 2.0 - 4.0
- **Alto**: > 4.0

## API Response Format

```json
{
  "data": {
    "success": true,
    "activityId": "uuid",
    "publicUrl": "https://...",
    "samplesCreated": 1,
    "extractedData": {
      "dataColeta": "2025-11-05",
      "laboratorio": "AgroLab Análises",
      "samples": [
        {
          "identificador": "AMOSTRA-001",
          "profundidade": 20,
          "parametros": [
            {
              "key": "pH",
              "valor": 6.2,
              "interpretacao": "ideal"
            }
          ]
        }
      ]
    },
    "ocrMethod": "google_vision" | "regex_patterns"
  }
}
```

## Melhorias Futuras

### Expansão de Parâmetros
- Micronutrientes (B, Cu, Fe, Mn, Zn)
- Análise granulométrica (Argila, Silte, Areia)
- CTC, SB, V%, m%

### IA/ML
- Treinamento de modelo customizado para laudos agrícolas brasileiros
- Reconhecimento de tabelas estruturadas
- Validação cruzada de valores

### Validação
- Alertas para valores fora do esperado
- Sugestões de correção para erros de OCR
- Comparação com histórico do talhão
