# INFRA_CONNECTION_AND_VALIDATION.md — Cardappio

## 1. Objetivo do documento

Este documento define a próxima fase do Cardappio após a conclusão da fase estrutural em código.

A partir daqui, o foco deixa de ser apenas desenvolvimento local e passa a ser:

- conexão da infraestrutura real
- validação das integrações
- publicação controlada
- testes reais de backend, auth, banco, Edge Functions e PWA
- preparação para operação real

Este documento deve ser usado como guia da fase de:

> **conexão + configuração + validação real de ambiente**

---

## 2. Contexto atual obrigatório

Até este momento:

- a fase estrutural do app foi considerada concluída em código
- o app já possui frontend, banco modelado, Edge Functions principais, admin central e PWA configurado em nível de projeto
- porém, isso **não equivale a validação real de produção** enquanto Supabase e Vercel não estiverem vinculados e testados

Portanto, esta fase deve ser tratada como:

- integração real da infraestrutura
- ativação de ambiente
- validação técnica ponta a ponta

---

## 3. Regra crítica de segurança

### 3.1 Sobre credenciais

Este documento pode ter uma seção de organização de credenciais, mas a recomendação correta é:

- **não deixar segredos sensíveis espalhados em documentação compartilhada**
- preferir armazenar segredos em:
  - variáveis de ambiente
  - painel seguro da Vercel
  - secrets do Supabase
  - gerenciador de senhas

### 3.2 O que pode ficar documentado aqui

Este documento pode guardar:

- nomes das variáveis
- descrição do uso de cada variável
- quais ambientes precisam delas
- checklists de preenchimento
- IDs públicos não sensíveis, quando aplicável

### 3.3 O que idealmente não deve ficar exposto aqui

- service role keys
- tokens administrativos
- webhook secrets
- senhas
- credenciais privadas de pagamento

Se você decidir registrar dados sensíveis aqui, faça isso conscientemente e apenas em ambiente privado.

---

## 4. Objetivos da fase atual

A IA responsável pelo projeto deve executar esta fase em 5 blocos:

1. conexão com Supabase
2. conexão com Vercel
3. configuração de variáveis de ambiente
4. publicação e validação técnica
5. checklist final de pré-operação

---

## 5. Bloco 1 — Conexão com Supabase

## 5.1 Objetivo

Vincular o projeto Cardappio a um projeto Supabase real.

## 5.2 O que deve ser feito

- conectar o projeto ao Supabase correto
- validar project URL
- validar anon key
- validar service role key em ambiente seguro
- validar acesso ao banco real
- validar pasta `supabase/`
- preparar execução de migrations no ambiente correto
- preparar deploy das Edge Functions

## 5.3 Checklist

- [ ] Projeto Supabase criado/selecionado
- [ ] Project URL confirmada
- [ ] Anon key confirmada
- [ ] Service role key armazenada de forma segura
- [ ] CLI/configuração local alinhada ao projeto remoto
- [ ] Banco remoto acessível
- [ ] Migrations prontas para execução
- [ ] Edge Functions prontas para deploy

---

## 6. Bloco 2 — Conexão com Vercel

## 6.1 Objetivo

Vincular o frontend do Cardappio ao projeto correto na Vercel.

## 6.2 O que deve ser feito

- conectar repositório/projeto na Vercel
- validar build settings
- validar framework preset
- validar variáveis de ambiente
- validar domínio provisório da Vercel
- preparar deploy inicial de validação

## 6.3 Checklist

- [ ] Projeto Vercel criado/selecionado
- [ ] Repositório vinculado corretamente
- [ ] Build command validado
- [ ] Output directory validado
- [ ] Variáveis de ambiente cadastradas
- [ ] Primeiro deploy de teste preparado
- [ ] URL do ambiente de preview confirmada

---

## 7. Bloco 3 — Variáveis de ambiente e credenciais

## 7.1 Regra geral

A IA deve organizar as variáveis necessárias por ambiente:

- local
- preview
- production

## 7.2 Estrutura recomendada de documentação

### Variáveis públicas do frontend

Usadas no app web.

Exemplos esperados:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV`
- `VITE_APP_URL`

### Variáveis privadas do backend / integração

Usadas em Edge Functions, webhooks ou serviços protegidos.

Exemplos esperados:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` ou equivalente
- `PUSH_PRIVATE_KEY` ou equivalente

---

## 7.3 Seção pronta para preenchimento

### Supabase — Identificação do Projeto

- **Project Name:** `Cardappio`
- **Project URL:** `https://wkngjvsgafmdwejmckks.supabase.co`
- **Project ID:** `wkngjvsgafmdwejmckks`
- **Region:** `us-east-2`

### Supabase — Frontend Público

- **VITE_SUPABASE_URL:** `https://wkngjvsgafmdwejmckks.supabase.co`
- **VITE_SUPABASE_ANON_KEY:** `sb_publishable_9bExYj14NOYcs6PxzO7N8g_R98iKwLN`

### Supabase — Backend Seguro

- **SUPABASE_SERVICE_ROLE_KEY:** `[REMOVIDO_POR_SEGURANÇA]`
- **SUPABASE_DB_PASSWORD ou equivalente:** `[REMOVIDO_POR_SEGURANÇA]`

### Vercel — Projeto

- **Project Name:** `cardappio`
- **Production URL:** `https://cardappio-mauve.vercel.app/`
- **Token Account:** `[REMOVIDO_POR_SEGURANÇA]`

### Vercel — Build

- **Framework Preset:** `Vite`
- **Build Command:** `'npm run build' or 'vite build'`
- **Output Directory:** `dist`

### Assinatura / Pagamentos

- **Provider:** `[PREENCHER]`
- **Public Price IDs:** `[PREENCHER]`
- **Secret Key:** `[PREENCHER COM CUIDADO]`
- **Webhook Secret:** `[PREENCHER COM CUIDADO]`

### Notificações / E-mail / Push

- **Provider Email:** `[PREENCHER]`
- **Provider Push:** `[PREENCHER]`
- **Keys/Secrets:** `[PREENCHER COM CUIDADO]`

---

## 8. Bloco 4 — Execução técnica da integração

## 8.1 Ordem correta de execução

A IA deve seguir esta ordem:

### Etapa 1 — ambiente local
- configurar `.env.local`
- validar conexão do frontend com Supabase
- validar autenticação básica
- validar queries básicas

### Etapa 2 — banco remoto
- aplicar migrations no projeto real
- validar tabelas criadas
- validar índices
- validar RLS
- validar policies

### Etapa 3 — Edge Functions
- publicar Edge Functions
- validar variáveis privadas das funções
- testar execução individual
- validar logs e respostas

### Etapa 4 — Vercel
- configurar env vars no painel
- executar preview deploy
- validar build
- validar app publicado

### Etapa 5 — integração completa
- validar frontend publicado consumindo backend real
- validar login
- validar planner
- validar lista de compras
- validar premium guard
- validar admin

---

## 9. Bloco 5 — Checklist de validação real

Depois da infraestrutura conectada, a IA deve executar um checklist técnico real.

## 9.1 Auth

- [ ] login funcionando em ambiente real
- [ ] signup funcionando em ambiente real
- [ ] callback funcionando
- [ ] sessão persistindo corretamente
- [ ] logout funcionando

## 9.2 Banco e segurança

- [ ] migrations aplicadas com sucesso
- [ ] tabelas criadas no Supabase real
- [ ] RLS habilitada nas tabelas privadas
- [ ] policies funcionando corretamente
- [ ] admin bloqueado para usuário comum

## 9.3 Planner e compras

- [ ] usuário consegue criar semana
- [ ] usuário consegue editar semana
- [ ] usuário consegue associar receitas
- [ ] lista de compras é gerada corretamente
- [ ] rebuild da lista funciona via Edge Function

## 9.4 Receitas e favoritos

- [ ] catálogo carrega corretamente
- [ ] detalhe de receita funciona
- [ ] favoritos funcionam
- [ ] histórico funciona
- [ ] repetir semana funciona

## 9.5 Compartilhamento

- [ ] generate-share-link funciona
- [ ] token temporário é gerado
- [ ] `/compartilhar/:token` funciona
- [ ] recurso compartilhado respeita expiração/regra de acesso

## 9.6 Assinatura

- [ ] checkout session é criada
- [ ] checkout redireciona corretamente
- [ ] webhook é recebido
- [ ] assinatura é atualizada no banco
- [ ] bloqueio premium responde ao status real

## 9.7 Admin

- [ ] admin dashboard carrega
- [ ] admin receitas funciona
- [ ] admin categorias funciona
- [ ] admin tags funciona
- [ ] admin coleções funciona
- [ ] admin dicas/alertas funciona
- [ ] admin usuários funciona
- [ ] admin planos funciona

## 9.8 Notificações

- [ ] notificações in-app carregam
- [ ] dispatch-notifications executa corretamente
- [ ] fila de notificação é processada
- [ ] logs de entrega são gerados

## 9.9 PWA

- [ ] manifest carregando corretamente
- [ ] service worker registrado
- [ ] instalação funcionando
- [ ] update flow funcionando
- [ ] offline fallback funcionando minimamente

## 9.10 Deploy

- [ ] preview deploy saudável
- [ ] production deploy saudável
- [ ] env vars corretas em cada ambiente
- [ ] sem erros críticos de build

---

## 10. O que a IA deve entregar após essa fase

Depois de vincular Supabase e Vercel e executar a validação, a IA deve devolver um novo relatório com 4 partes:

### Parte 1 — Infra conectada
- Supabase vinculado
- Vercel vinculada
- variáveis configuradas

### Parte 2 — Resultado da validação real
- checklist preenchido com sucesso/falha por item

### Parte 3 — Problemas encontrados
- bugs
- falhas de policy
- erros de build
- erros de função
- ajustes necessários

### Parte 4 — Status final da fase
Classificar o projeto como:
- pronto para continuar em desenvolvimento
- pronto para homologação
- pronto para produção
- ainda não pronto

---

## 11. O que a IA não deve fazer nesta fase

Não fazer:

- afirmar que o projeto está pronto para produção sem checklist real concluído
- afirmar que integrações estão validadas sem execução real
- pular a revisão de env vars
- publicar sem validar build e segurança
- tratar a fase de deploy como mero detalhe operacional

---

## 12. Mensagem pronta para enviar à IA

Use a mensagem abaixo:

---

Entramos agora na fase de conexão real de infraestrutura do Cardappio.

Contexto obrigatório:
- a fase estrutural em código já foi concluída
- agora vamos conectar Supabase e Vercel
- só depois disso o app poderá ser validado de verdade

Quero que você use este documento como guia da próxima etapa.

Sua missão agora é:

1. preparar e organizar a conexão com Supabase
2. preparar e organizar a conexão com Vercel
3. estruturar as variáveis de ambiente e credenciais necessárias
4. aplicar/checkar migrations no ambiente real
5. publicar e validar Edge Functions
6. executar checklist real de validação
7. me devolver um relatório final desta fase

Regras obrigatórias:
- não trate o projeto como pronto para produção antes da validação real
- separe claramente “configurado” de “validado”
- registre o que foi conectado, o que foi testado e o que falhou
- use este documento como checklist central

---

## 13. Conclusão

Esta fase é a ponte entre:

- app estruturalmente pronto em código
- app realmente conectado, validado e preparado para operar

O foco agora não é inventar novas features.
O foco é:

- conectar infraestrutura
- validar a base real
- transformar o projeto de “bem montado em código” para “tecnicamente validado em ambiente real”

