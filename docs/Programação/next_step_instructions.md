# NEXT_STEP_INSTRUCTIONS.md — Cardappio

## 1. Objetivo deste documento

Este documento define a **próxima etapa obrigatória** do trabalho no Cardappio.

Ele existe para orientar o agente/IA responsável pela implementação sobre:

- o que já parece existir
- o que ainda não foi feito ou não foi comprovado
- o que precisa ser validado tecnicamente
- o que precisa ser corrigido para voltar ao plano original
- a ordem correta da próxima execução

Este documento deve ser lido junto com a base principal do projeto, especialmente:

- `IMPLEMENTATION_HANDOFF.md`
- `CODEX_CARDAPPIO_APP_SPEC.md`
- `CODEX_CARDAPPIO_EXECUTION_PLAN.md`
- `DATABASE.md`
- `API_FUNCTIONS.md`
- `ROUTES_AND_PAGES.md`
- `COMPONENTS_MAP.md`

---

## 2. Contexto da situação atual

Foi entregue um relatório de auditoria técnica V1 informando que o Cardappio já possui:

- frontend React + TypeScript + Vite
- Tailwind + shadcn/ui + Radix
- Supabase como backend
- 7 migrations organizadas por lotes
- área pública básica
- área autenticada com dashboard, planner, receitas, compras, favoritos, histórico, perfil e notificações
- admin inicial com dashboard, lista de receitas e editor
- PWA configurado

Esse relatório indica que a base do app já existe, mas ainda **não comprova** que toda a arquitetura planejada foi concluída ou validada integralmente. fileciteturn4file0

---

## 3. Regra principal da próxima etapa

A próxima etapa **não é sair criando novas features às cegas**.

A próxima etapa deve ser dividida em 2 blocos obrigatórios:

### Bloco A — validação profunda do que já foi feito
Antes de continuar construindo, o agente deve provar o estado real da implementação.

### Bloco B — fechamento das lacunas do plano original
Depois da validação, o agente deve implementar o que ainda está faltando para alinhar o app com a documentação-base.

---

## 4. O que parece já ter sido feito

Com base no relatório atual, os seguintes itens **parecem implementados**, mas alguns ainda precisam de validação real:

### 4.1 Fundação do app
- setup do frontend
- stack principal ativa
- organização por domínios
- React Query
- Supabase integrado
- PWA inicial

### 4.2 Fluxo principal do usuário
- autenticação
- onboarding
- dashboard
- planner semanal
- receitas
- lista de compras
- favoritos
- histórico
- perfil

### 4.3 Admin inicial
- dashboard admin
- lista de receitas
- editor de receita

### 4.4 Banco de dados
- 7 migrations em lotes lógicos

Esses pontos constam no relatório V1 e são um bom sinal de avanço. fileciteturn4file0

---

## 5. O que ainda não foi comprovado e precisa ser validado

Os itens abaixo **não podem ser considerados concluídos apenas com base no relatório**.

O agente deve validar e responder objetivamente cada ponto.

## 5.1 Segurança e autorização

Validar:

- quais tabelas privadas já estão com RLS habilitada
- quais policies existem por tabela
- quais rotas admin estão protegidas por role no frontend
- quais operações admin estão protegidas no backend
- se existe separação real entre user, admin e super_admin

### Resultado esperado

Checklist por item:
- implementado
- parcialmente implementado
- não implementado

---

## 5.2 Edge Functions e backend sensível

Validar se já existem de fato, com nome por nome:

- functions de auth relevantes
- function de rebuild da lista de compras
- function de geração de share link
- functions de assinatura
- webhook de assinatura
- functions de notificações
- functions admin
- cron jobs

### Observação

Se essas functions não existirem, o projeto ainda está incompleto no padrão arquitetural definido.

---

## 5.3 Monetização ponta a ponta

Validar:

- se `plans` está implementado de forma real
- se `user_subscriptions` está funcional
- se existe checkout real
- se existe webhook funcional
- se status de assinatura é atualizado automaticamente
- se cancelamento existe
- se existe bloqueio real por feature premium
- se existe admin de planos/assinaturas

### Resultado esperado

Classificar cada item como:
- implementado
- parcialmente implementado
- não implementado

---

## 5.4 Área administrativa completa

O relatório só comprovou:

- `/admin`
- `/admin/receitas`
- `/admin/receitas/nova`

O agente precisa validar se já existem ou não:

- `/admin/categorias`
- `/admin/tags`
- `/admin/colecoes`
- `/admin/dicas-alertas`
- `/admin/notificacoes`
- `/admin/usuarios`
- `/admin/planos`
- `/admin/assinaturas`
- `/admin/configuracoes`
- `/admin/relatorios`
- `/admin/logs`

Se não existirem, isso é lacuna direta em relação ao plano base.

---

## 5.5 Área pública completa

O relatório citou apenas:

- `/`
- `/entrar`
- `/cadastrar`
- `/recuperar-senha`

O agente precisa validar se já existem ou não:

- `/como-funciona`
- `/planos`
- `/faq`
- `/contato`
- `/quem-somos`
- `/suporte`

Se não existirem, registrar explicitamente como pendência.

---

## 5.6 Notificações reais

Validar:

- se notificações estão só modeladas ou realmente operacionais
- se existem notificações in-app reais
- se push web está funcionando
- se existe fila de envio
- se existe log de entrega
- se existem preferências granulares por usuário

---

## 5.7 PWA real

Validar:

- se manifest está correto
- se service worker está ativo
- se instalação funciona em mobile
- se offline fallback está funcional
- se update flow foi validado
- se push em PWA já funciona ou ainda não

---

## 5.8 Componentização e uso dos HTMLs do Stitch

Validar:

- se os HTMLs do Stitch foram tratados como referência visual
- se as páginas foram recriadas em React
- se existe componentização real
- se há repetição excessiva de JSX/HTML
- se o `COMPONENTS_MAP.md` foi seguido ou ignorado

---

## 6. O que provavelmente ainda falta fazer

Com base no plano inicial e na auditoria recebida, os itens abaixo provavelmente ainda faltam ou ainda não foram comprovados como concluídos:

### 6.1 Backend sensível no padrão definido
- Edge Functions reais
- webhooks
- cron jobs
- logs operacionais
- idempotência

### 6.2 Segurança completa
- RLS confirmada nas tabelas privadas
- policies completas
- validação backend de ações sensíveis

### 6.3 Admin completo
- categorias
- tags
- coleções
- notices/alertas
- usuários
- planos
- assinaturas
- relatórios
- logs

### 6.4 Área pública completa
- como funciona
- planos
- FAQ
- contato
- quem somos
- suporte

### 6.5 Monetização completa
- checkout real
- webhook real
- controle de acesso premium por feature
- tela/admin de planos mais completa

### 6.6 Notificações maduras
- fila
- logs de entrega
- preferências
- push
- disparos editoriais

---

## 7. Próxima entrega obrigatória do agente

Antes de continuar implementando, o agente deve entregar um **complemento de auditoria técnica detalhada**.

Esse complemento deve responder objetivamente os itens abaixo.

## 7.1 Resposta obrigatória em formato checklist

Para cada item abaixo, responder com:

- implementado
- parcialmente implementado
- não implementado

### Grupo A — rotas
1. Quais rotas públicas existem exatamente hoje?
2. Quais rotas autenticadas existem exatamente hoje?
3. Quais rotas admin existem exatamente hoje?

### Grupo B — banco e segurança
4. Quais tabelas já existem exatamente hoje?
5. Quais tabelas têm RLS habilitada?
6. Quais policies existem por tabela?

### Grupo C — backend
7. Quais Edge Functions já existem? Listar nome por nome.
8. Quais cron jobs/automações já existem?
9. Quais webhooks já existem?

### Grupo D — monetização
10. O fluxo de assinatura está funcional ponta a ponta?
11. Quais partes do premium já bloqueiam/liberam recursos de verdade?

### Grupo E — notificações
12. O sistema de notificações já envia de fato? Por quais canais?
13. Existe fila de notificação?
14. Existe log de entrega?

### Grupo F — frontend e componentização
15. As páginas foram recriadas em React a partir dos HTMLs ou os HTMLs foram reaproveitados diretamente?
16. Quais componentes globais já foram extraídos?
17. O que ainda está muito acoplado a páginas?

### Grupo G — aderência ao plano
18. O que falta para alinhar o projeto ao `APP_SPEC`?
19. O que falta para alinhar ao `DATABASE.md`?
20. O que falta para alinhar ao `API_FUNCTIONS.md`?
21. O que falta para alinhar ao `ROUTES_AND_PAGES.md`?
22. O que falta para alinhar ao `COMPONENTS_MAP.md`?

---

## 8. Depois da auditoria: ordem obrigatória da continuação

Depois de responder o checklist acima, o agente deve seguir esta ordem:

## Fase A — fechar lacunas estruturais críticas

Prioridade máxima:

1. validar e corrigir RLS/policies
2. validar e corrigir separação de rotas e guards
3. validar e corrigir componentização das páginas principais
4. validar se planner + compras estão realmente sólidos

## Fase B — completar backend sensível

5. implementar Edge Functions faltantes
6. implementar webhook de assinatura se faltar
7. implementar cron jobs prioritários
8. implementar logs operacionais mínimos

## Fase C — completar módulos estratégicos faltantes

9. completar admin ausente
10. completar páginas públicas ausentes
11. completar monetização ponta a ponta
12. completar notificações reais

## Fase D — refinamento final

13. revisar PWA real
14. revisar UX do fluxo principal
15. revisar performance, estados e consistência visual

---

## 9. O que o agente não deve fazer agora

Não fazer nesta próxima etapa:

- sair criando novas features sem antes validar o estado real
- priorizar estética antes de validar arquitetura
- expandir o app para features secundárias antes de fechar planner + compras + segurança
- implementar novas páginas decorativas sem fechar lacunas funcionais
- responder genericamente sem checklist objetivo

---

## 10. Critério de sucesso da próxima etapa

A próxima etapa só será considerada bem executada quando houver:

1. auditoria técnica objetiva e verificável
2. confirmação do que já existe de verdade
3. confirmação do que ainda está incompleto
4. plano claro de fechamento das lacunas
5. retomada da implementação alinhada aos documentos-base do projeto

---

## 11. Mensagem sugerida para enviar ao agente agora

Use a mensagem abaixo:

---

Quero que você entre na próxima etapa do Cardappio seguindo estritamente a documentação-base do projeto.

Antes de continuar implementando, você deve primeiro fazer uma auditoria complementar objetiva do estado atual do app.

Use como referência obrigatória:
- IMPLEMENTATION_HANDOFF.md
- CODEX_CARDAPPIO_APP_SPEC.md
- CODEX_CARDAPPIO_EXECUTION_PLAN.md
- DATABASE.md
- API_FUNCTIONS.md
- ROUTES_AND_PAGES.md
- COMPONENTS_MAP.md

Agora me devolva uma resposta em formato checklist, item por item, classificando cada ponto como:
- implementado
- parcialmente implementado
- não implementado

Quero que você responda exatamente estes grupos:

1. rotas públicas, autenticadas e admin que existem hoje
2. tabelas que existem hoje
3. tabelas com RLS ativa
4. policies existentes por tabela
5. Edge Functions já implementadas
6. cron jobs/automações já implementados
7. webhooks já implementados
8. fluxo de assinatura ponta a ponta
9. bloqueios premium reais por feature
10. notificações reais por canal
11. fila de notificação e logs de entrega
12. componentização real vs reaproveitamento direto dos HTMLs do Stitch
13. lacunas em relação ao APP_SPEC
14. lacunas em relação ao DATABASE.md
15. lacunas em relação ao API_FUNCTIONS.md
16. lacunas em relação ao ROUTES_AND_PAGES.md
17. lacunas em relação ao COMPONENTS_MAP.md

Só depois dessa auditoria complementar você deve propor a continuação da implementação.

Não quero resposta genérica. Quero diagnóstico técnico objetivo.

---

## 12. Conclusão

A próxima etapa do Cardappio não é “continuar construindo qualquer coisa”.

A próxima etapa é:

- provar tecnicamente o estado atual
- medir aderência ao plano inicial
- fechar lacunas estruturais e de segurança
- só então continuar a evolução do app

Esse é o único caminho correto para retomar o projeto com controle e alinhamento.

