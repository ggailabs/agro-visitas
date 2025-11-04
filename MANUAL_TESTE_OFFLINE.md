# 🧪 Manual de Testes - Modo Offline (Fase 1 MVP Mobile)

## 📋 Informações do Deployment
- **URL**: https://emv2ppkwjk7l.space.minimax.io
- **Data de Deploy**: 2025-11-04 22:37
- **Versão**: Fase 1 - MVP Mobile com Modo Offline Completo

---

## ✅ Funcionalidades Implementadas para Teste

### 1. PWA (Progressive Web App)
- Instalação da aplicação como app nativo
- Ícones personalizados
- Service Worker para cache

### 2. GPS Automático
- Captura de coordenadas geográficas
- Exibição de latitude/longitude com precisão

### 3. Indicadores de Status
- Badge Online/Offline no topo da página
- Banner de status de conexão

### 4. Modo Offline (FOCO PRINCIPAL)
- Salvamento local no IndexedDB quando sem conexão
- Conversão automática de fotos para base64
- Contador de visitas pendentes
- Sincronização automática ao reconectar
- Sincronização manual via botão

---

## 🔬 ROTEIRO DE TESTES DETALHADO

### PRÉ-REQUISITOS
1. Navegador: Chrome, Edge ou Firefox (com DevTools)
2. Fazer login no sistema
3. Ter ao menos 1 cliente e 1 fazenda cadastrados

---

## TESTE 1: Indicadores de Status Online ⭐

**Objetivo**: Verificar se os indicadores visuais de status funcionam

### Passos:
1. Fazer login no sistema
2. Navegar para: **Nova Visita** (menu lateral ou botão)
3. Observar o **canto superior direito** da página

### ✅ Resultado Esperado:
- [ ] Existe um badge verde com texto **"Online"**
- [ ] O badge tem um ícone de nuvem (Cloud)
- [ ] O layout está responsivo e bem posicionado

### 📸 Screenshot:
_Tirar print mostrando o badge "Online"_

---

## TESTE 2: Criar Visita em Modo ONLINE (Baseline) ⭐⭐

**Objetivo**: Confirmar que o fluxo normal ainda funciona

### Passos:
1. Na página **Nova Visita**
2. Preencher formulário:
   - **Cliente**: Selecionar qualquer
   - **Fazenda**: Selecionar qualquer
   - **Título**: "Teste Online - [Seu Nome]"
   - **Data**: Hoje
   - **Objetivo**: "Verificar funcionalidade online"
3. Clicar em **"Salvar"** ou botão de submissão

### ✅ Resultado Esperado:
- [ ] Formulário é enviado sem erros
- [ ] Mensagem de sucesso aparece: **"✅ Visita técnica criada com sucesso!"**
- [ ] Redirecionamento para lista de visitas
- [ ] Visita aparece na lista

### 📸 Screenshot:
_Tirar print da mensagem de sucesso_

---

## TESTE 3: Ativar Modo Offline ⭐⭐⭐

**Objetivo**: Simular perda de conexão

### Passos:
1. Abrir **DevTools** (F12 ou Ctrl+Shift+I)
2. Ir para aba **"Network"** (Rede)
3. No topo da aba Network, localizar dropdown que mostra "No throttling"
4. Clicar no dropdown e selecionar **"Offline"**
5. **IMPORTANTE**: Recarregar a página (F5) para confirmar modo offline
6. Se a página não carregar (esperado), voltar e marcar "Offline" novamente

### ✅ Resultado Esperado após reload:
- [ ] Badge muda de "Online" (verde) para **"Offline"** (laranja/amarelo)
- [ ] Aparece um **alerta laranja** no topo do formulário
- [ ] Alerta contém texto: "Modo Offline Ativo" e ícone de nuvem riscada
- [ ] Texto do alerta explica: "Você está sem conexão. A visita será salva localmente..."

### 📸 Screenshot:
_Tirar print mostrando: badge Offline + alerta laranja_

---

## TESTE 4: Criar Visita em Modo OFFLINE ⭐⭐⭐⭐⭐

**Objetivo**: Testar salvamento local no IndexedDB

### Passos:
1. **MANTER** modo offline ativo (Network → Offline)
2. Preencher formulário:
   - **Cliente**: Selecionar qualquer
   - **Fazenda**: Selecionar qualquer
   - **Título**: "Visita Teste Offline"
   - **Data**: Hoje
   - **Objetivo**: "Testar modo offline e IndexedDB"
   - **(Opcional)** Adicionar foto(s) de teste
3. Clicar em **"Salvar"**

### ✅ Resultado Esperado:
- [ ] Formulário é enviado (não trava)
- [ ] **NÃO** aparece erro de rede
- [ ] Mensagem de sucesso específica: **"✅ Visita salva offline! Será sincronizada quando a conexão retornar."**
- [ ] Redirecionamento para lista de visitas

### 🐛 Se der erro:
- Verificar console (F12 → Console) e copiar mensagens de erro
- Reportar erro com print

### 📸 Screenshot:
_Tirar print da mensagem "Visita salva offline"_

---

## TESTE 5: Verificar IndexedDB ⭐⭐⭐⭐

**Objetivo**: Confirmar que a visita foi salva localmente

### Passos:
1. Abrir **DevTools** (F12)
2. Ir para aba **"Application"** (Aplicativo)
3. No menu lateral esquerdo, expandir **"Storage" → "IndexedDB"**
4. Expandir banco: **"agrovisitas-offline"**
5. Expandir object store: **"visitas"**
6. Clicar em "visitas" para ver os registros

### ✅ Resultado Esperado:
- [ ] Existe **1 registro** na tabela "visitas"
- [ ] Registro tem campo `id` começando com **"offline-"**
- [ ] Registro contém os dados preenchidos (titulo, cliente_id, fazenda_id, etc.)
- [ ] Campo `syncStatus` está como **"pending"**
- [ ] Se adicionou foto, campo `photos` tem array com dados base64

### 📸 Screenshot:
_Tirar print mostrando o registro no IndexedDB_

### 🐛 Se não houver registros:
- Verificar aba Console para erros
- Reportar problema

---

## TESTE 6: Contador de Visitas Pendentes ⭐⭐⭐

**Objetivo**: Verificar badge de contagem

### Passos:
1. **DESATIVAR** modo offline:
   - DevTools → Network → Mudar de "Offline" para "No throttling"
2. Navegar novamente para **"Nova Visita"**
3. Observar o **canto superior direito**

### ✅ Resultado Esperado:
- [ ] Badge volta para **"Online"** (verde)
- [ ] Aparece um novo elemento ao lado do badge Online
- [ ] Elemento mostra: ícone WifiOff + badge numérico **"1"**
- [ ] Texto ao lado: **"1 visita pendente"**
- [ ] Aparece um botão verde **"Sincronizar"**

### 📸 Screenshot:
_Tirar print mostrando: Badge Online + "1 visita pendente" + botão Sincronizar_

### 🐛 Se não aparecer o contador:
- Recarregar a página (F5)
- Verificar console para erros

---

## TESTE 7: Sincronização Manual ⭐⭐⭐⭐⭐

**Objetivo**: Testar envio da visita offline para o servidor

### Passos:
1. **Confirmar** que está online (badge verde)
2. **Confirmar** que há "1 visita pendente"
3. Clicar no botão **"Sincronizar"**
4. Observar comportamento

### ✅ Resultado Esperado:
- [ ] Botão muda para **"Sincronizando..."** com spinner
- [ ] Após 2-5 segundos, sincronização completa
- [ ] Contador de visitas pendentes **desaparece** ou vai para **"0"**
- [ ] Badge de visitas pendentes some completamente

### 🔍 Verificação no Console:
Abrir Console (F12 → Console) e verificar logs:
- [ ] `[Sync] Iniciando sincronização...`
- [ ] `[Sync] 1 visitas pendentes`
- [ ] `[Sync] Visita offline-... criada no servidor: [uuid]`
- [ ] `[Sync] Concluído: 1 sucesso, 0 erros`

### 📸 Screenshot:
_Tirar print do console mostrando os logs de sincronização_

### 🐛 Se sincronização falhar:
- Copiar mensagens de erro do console
- Verificar aba Network para requisições HTTP falhadas
- Reportar com prints

---

## TESTE 8: Verificar Visita no Servidor ⭐⭐⭐

**Objetivo**: Confirmar que a visita foi salva no Supabase

### Passos:
1. Navegar para **"Visitas"** no menu
2. Procurar pela visita criada: **"Visita Teste Offline"**

### ✅ Resultado Esperado:
- [ ] Visita **aparece na lista**
- [ ] Dados estão corretos (título, fazenda, data, etc.)
- [ ] Visita tem ID real (não começa com "offline-")
- [ ] Se adicionou foto, foto foi enviada corretamente

### 📸 Screenshot:
_Tirar print da lista de visitas mostrando a visita sincronizada_

---

## TESTE 9: Limpeza do IndexedDB ⭐⭐

**Objetivo**: Confirmar que dados sincronizados foram removidos

### Passos:
1. Voltar ao **DevTools → Application → IndexedDB**
2. Expandir **"agrovisitas-offline" → "visitas"**
3. Verificar registros

### ✅ Resultado Esperado:
- [ ] Store "visitas" está **vazio** (0 registros)
- [ ] Registro offline foi **deletado** após sincronização

### 🐛 Se ainda houver registros:
- Verificar campo `syncStatus` do registro
- Se for "error", reportar o erro

---

## TESTE 10: Captura de GPS (Bonus) ⭐

**Objetivo**: Testar funcionalidade de GPS

### Passos:
1. Na página **Nova Visita**
2. Rolar até a seção de GPS/Geolocalização
3. Clicar no botão **"Capturar GPS"** ou similar
4. **Permitir** acesso à localização quando o navegador solicitar

### ✅ Resultado Esperado:
- [ ] Botão mostra spinner durante captura
- [ ] Após 1-3 segundos, coordenadas aparecem
- [ ] Formato: "Lat: -XX.XXXXX, Lon: -XX.XXXXX"
- [ ] Valor de "Precisão" também é exibido

### 📸 Screenshot:
_Tirar print mostrando as coordenadas capturadas_

---

## 📊 RESUMO DOS RESULTADOS

### Checklist Final:
- [ ] Teste 1: Indicadores Online
- [ ] Teste 2: Criar visita online
- [ ] Teste 3: Ativar modo offline
- [ ] Teste 4: Criar visita offline
- [ ] Teste 5: Verificar IndexedDB
- [ ] Teste 6: Contador de pendentes
- [ ] Teste 7: Sincronização manual
- [ ] Teste 8: Visita no servidor
- [ ] Teste 9: Limpeza IndexedDB
- [ ] Teste 10: Captura GPS

### Status Geral:
- **Testes Passados**: ___/10
- **Testes Falhados**: ___/10
- **Bugs Críticos**: [ ] Sim [ ] Não

---

## 🐛 REPORTAR PROBLEMAS

Se encontrar bugs, fornecer:

### Informações Necessárias:
1. **Número do teste** que falhou
2. **Screenshots** do erro
3. **Console do DevTools** (aba Console) - copiar erros em vermelho
4. **Network do DevTools** (aba Network) - requisições falhadas (em vermelho)
5. **Passos exatos** que causaram o erro

### Template de Bug Report:
```
**TESTE**: #[número]
**DESCRIÇÃO**: [o que aconteceu]
**ESPERADO**: [o que deveria acontecer]
**CONSOLE ERROR**: [copiar erro]
**SCREENSHOT**: [anexar]
```

---

## 🎯 CRITÉRIOS DE SUCESSO

A Fase 1 está **COMPLETA** se:
- ✅ Testes 1-8 passam sem erros críticos
- ✅ Visita criada offline é sincronizada com sucesso
- ✅ IndexedDB funciona corretamente
- ✅ Indicadores visuais aparecem corretamente
- ✅ Nenhum erro JavaScript no console durante fluxo normal

---

## 📞 PRÓXIMOS PASSOS

Após completar os testes:
1. Preencher checklist acima
2. Reportar resultados (passou/falhou)
3. Se houver bugs, fornecer informações detalhadas
4. Se tudo passou, confirmar para avançar para melhorias

---

**Boa sorte com os testes!** 🚀
