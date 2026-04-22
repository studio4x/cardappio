# API_FUNCTIONS.md — Cardappio

## 1. Objetivo do documento

Este documento define as **Edge Functions, automações, webhooks e contratos de backend serverless** necessários para o Cardappio.

Ele deve ser usado pelo Codex para implementar o backend sensível no padrão:

- Supabase Edge Functions
- validação explícita de entrada
- autenticação e autorização no backend
- uso controlado de service role
- logs úteis
- idempotência em fluxos recorrentes
- rastreabilidade operacional

A estrutura segue o padrão recomendado nos materiais anexados de Edge Functions, automações, notificações e segurança. fileciteturn2file1 fileciteturn2file6 fileciteturn1file15

---

## 2. Princípios obrigatórios

Toda função deve seguir estas regras:

1. uma função por responsabilidade
2. validação explícita de entrada
3. autenticação quando aplicável
4. confirmação de role/permissão antes de operação privilegiada
5. retorno estruturado
6. logs claros e úteis
7. uso de service role apenas dentro da função
8. não confiar em flags vindas do cliente
9. idempotência em fluxos que podem ser repetidos
10. rastreabilidade por logs e/ou tabelas de eventos

Esses princípios seguem diretamente a base de Edge Functions e segurança anexada. fileciteturn2file1 fileciteturn2file6

---

## 3. Estrutura recomendada de pastas

```txt
supabase/
  functions/
    _shared/
      auth.ts
      cors.ts
      env.ts
      errors.ts
      logger.ts
      response.ts
      validation.ts
      permissions.ts
      subscription.ts
      notifications.ts
      storage.ts
      idempotency.ts
      plans.ts
      meal-plans.ts
      shopping.ts
    send-magic-link/
    update-password/
    create-checkout-session/
    subscription-webhook/
    cancel-subscription/
    sync-subscription-status/
    rebuild-shopping-list/
    generate-share-link/
    dispatch-notifications/
    register-push-subscription/
    send-editorial-notice/
    weekly-engagement-cron/
    expiring-subscriptions-cron/
    editorial-suggestions-cron/
    admin-reports/
    admin-reprocess-notification/
    cleanup-orphan-files/
```

A organização em uma função por responsabilidade e helpers compartilhados em `_shared` é o padrão recomendado na referência anexada. fileciteturn2file1

---

## 4. Helpers compartilhados obrigatórios

## 4.1 `_shared/auth.ts`

### Objetivo

Centralizar leitura e validação de sessão.

### Responsabilidades

- ler token do header `Authorization`
- validar sessão do usuário
- recuperar usuário atual
- rejeitar token inválido/ausente

### Regras

- não confiar em user id enviado no body
- o usuário deve ser derivado do token quando a ação é do próprio usuário

---

## 4.2 `_shared/permissions.ts`

### Objetivo

Centralizar checagem de roles e permissões.

### Responsabilidades

- validar `admin`
- validar `super_admin`
- validar combinações de acesso por contexto

---

## 4.3 `_shared/validation.ts`

### Objetivo

Validar payloads de entrada.

### Responsabilidades

- schemas de entrada
- coerção mínima segura
- mensagens de erro padronizadas

---

## 4.4 `_shared/logger.ts`

### Objetivo

Padronizar logs úteis.

### Responsabilidades

- logs de início e fim de execução
- logs de erro
- logs com correlation id / request id quando possível
- logs com entidade afetada e ator

### Regras

- não vazar segredo em log
- não logar dados sensíveis desnecessários

---

## 4.5 `_shared/response.ts`

### Objetivo

Padronizar respostas HTTP.

### Formato sugerido

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

ou

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "..."
  },
  "meta": {}
}
```

---

## 4.6 `_shared/idempotency.ts`

### Objetivo

Ajudar funções recorrentes e webhooks a não processar o mesmo evento duas vezes.

### Estratégias possíveis

- checagem por `provider_event_id`
- checagem por tabela de eventos já processados
- chave única por recurso/operação

---

## 4.7 `_shared/subscription.ts`

### Objetivo

Centralizar lógicas auxiliares de assinatura.

### Responsabilidades

- mapear provider -> plano interno
- calcular status final
- atualizar assinatura do usuário com segurança
- registrar `subscription_events`

---

## 4.8 `_shared/notifications.ts`

### Objetivo

Ajudar no enfileiramento e despacho de notificações.

### Responsabilidades

- inserir em `notifications`
- inserir em `notification_queue`
- aplicar preferências do usuário
- respeitar quiet hours

---

## 4.9 `_shared/shopping.ts`

### Objetivo

Centralizar o rebuild da lista de compras.

### Responsabilidades

- ler slots da semana
- montar itens a partir de ingredientes
- consolidar nomes normalizados
- atualizar `shopping_lists` e `shopping_list_items`

---

## 5. Funções de autenticação

## 5.1 `send-magic-link`

### Objetivo

Iniciar login/cadastro por magic link.

### Quando usar

- login
- signup
- reenvio de acesso

### Input esperado

```json
{
  "email": "user@example.com",
  "redirect_to": "https://app.../auth/callback"
}
```

### Output esperado

```json
{
  "success": true,
  "data": {
    "message": "Magic link sent"
  }
}
```

### Permissão

- público

### Regras

- rate limit por e-mail/IP
- sanitizar redirect permitido
- não revelar excessivamente se a conta já existe ou não, se isso for decisão de segurança

### Logs

- tentativa enviada
- falha de envio

---

## 5.2 `update-password`

### Objetivo

Permitir atualização de senha se o fallback por senha for mantido.

### Input esperado

```json
{
  "new_password": "..."
}
```

### Permissão

- usuário autenticado

### Regras

- token obrigatório
- política mínima de senha

---

## 6. Funções de assinatura

A lógica de assinatura deve seguir a estrutura funcional da spec de planos e subscrições anexada, adaptada ao Cardappio. fileciteturn2file3

## 6.1 `create-checkout-session`

### Objetivo

Criar sessão de checkout no gateway de pagamento.

### Input esperado

```json
{
  "plan_id": "uuid",
  "billing_period": "monthly"
}
```

### Permissão

- usuário autenticado

### Regras

- obter usuário via token
- validar se o plano está ativo
- não aceitar preço confiando no cliente
- retornar URL ou sessão do checkout

### Output esperado

```json
{
  "success": true,
  "data": {
    "checkout_url": "https://..."
  }
}
```

### Logs

- usuário
- plano solicitado
- sucesso/falha

---

## 6.2 `subscription-webhook`

### Objetivo

Receber eventos do provedor de pagamento.

### Permissão

- webhook externo autenticado por assinatura do provider

### Eventos esperados

- checkout completed
- subscription updated
- subscription renewed
- payment failed
- subscription cancelled
- refund issued

### Regras obrigatórias

- verificar assinatura do webhook
- idempotência por event id
- mapear evento para estado interno
- atualizar `user_subscriptions`
- registrar `subscription_events`
- disparar notificações quando aplicável

### Logs

- provider event id
- tipo do evento
- usuário afetado
- resultado do processamento

---

## 6.3 `cancel-subscription`

### Objetivo

Permitir que o usuário solicite cancelamento.

### Input esperado

```json
{
  "reason": "optional text"
}
```

### Permissão

- usuário autenticado

### Regras

- cancelar no provider quando aplicável
- refletir no banco
- registrar evento

---

## 6.4 `sync-subscription-status`

### Objetivo

Reconciliar assinaturas em caso de divergência.

### Permissão

- admin ou cron interno

### Uso

- reconciliação manual
- manutenção programada

---

## 7. Funções de planejamento e compras

## 7.1 `rebuild-shopping-list`

### Objetivo

Reprocessar a lista de compras de uma semana.

### Input esperado

```json
{
  "week_id": "uuid"
}
```

### Permissão

- usuário autenticado para a própria semana
- admin para suporte operacional

### Regras

- validar que a semana pertence ao usuário, salvo admin
- ler receitas e ingredientes dos slots
- consolidar ingredientes
- atualizar lista existente ou recriar de forma segura
- manter idempotência funcional

### Output esperado

```json
{
  "success": true,
  "data": {
    "shopping_list_id": "uuid",
    "items_count": 12
  }
}
```

### Logs

- usuário/ator
- week_id
- quantidade de itens gerados

---

## 7.2 `generate-share-link`

### Objetivo

Gerar link compartilhável temporário para semana ou lista.

### Input esperado

```json
{
  "resource_type": "week",
  "resource_id": "uuid",
  "expires_in_hours": 24
}
```

### Permissão

- usuário autenticado dono do recurso
- admin se necessário

### Regras

- gerar link seguro e temporário
- registrar se necessário para rastreio
- evitar exposição pública permanente sem necessidade

---

## 8. Funções de notificações

O módulo deve respeitar o padrão multi-canal de fila, retries, logs e preferências descrito na spec anexada. fileciteturn1file15

## 8.1 `dispatch-notifications`

### Objetivo

Processar itens pendentes da `notification_queue`.

### Permissão

- cron interno / admin

### Regras

- buscar pendentes elegíveis
- respeitar preferências e quiet hours
- enviar por canal
- registrar tentativas em `notification_delivery_logs`
- atualizar `status`, `attempt_count`, `next_retry_at`
- marcar falha final quando necessário

### Canais previstos

- in-app
- push
- e-mail

### Logs

- queue_id
- canal
- status final
- erro quando houver

---

## 8.2 `register-push-subscription`

### Objetivo

Registrar subscription de push do navegador/PWA.

### Input esperado

```json
{
  "subscription": {
    "endpoint": "...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

### Permissão

- usuário autenticado

### Regras

- vincular ao usuário atual
- atualizar/substituir subscription anterior se necessário

### Observação

Pode exigir tabela adicional como `push_subscriptions` se o produto seguir por esse caminho.

---

## 8.3 `send-editorial-notice`

### Objetivo

Permitir envio controlado de dica/alerta editorial.

### Input esperado

```json
{
  "notice_id": "uuid",
  "channels": ["in-app", "push"]
}
```

### Permissão

- admin

### Regras

- validar notice ativo
- montar público-alvo
- enfileirar notificações
- não enviar duplicado indevidamente

---

## 9. Funções administrativas

## 9.1 `admin-reports`

### Objetivo

Retornar visões consolidadas para o painel admin.

### Permissão

- admin ou super_admin

### Possíveis relatórios

- receitas mais escolhidas
- categorias mais usadas
- semanas criadas por período
- taxa de retorno semanal
- usuários free x premium
- coleções com mais uso

### Input esperado

```json
{
  "report_type": "top_recipes",
  "date_from": "2026-01-01",
  "date_to": "2026-01-31"
}
```

### Regras

- não expor dados privados além do necessário
- usar queries consolidadas / RPCs quando fizer sentido

---

## 9.2 `admin-reprocess-notification`

### Objetivo

Permitir reprocessamento manual de item falho da fila.

### Input esperado

```json
{
  "queue_id": "uuid"
}
```

### Permissão

- admin

### Regras

- verificar estado atual
- evitar duplicação indevida
- registrar tentativa adicional

---

## 9.3 `cleanup-orphan-files`

### Objetivo

Limpar arquivos órfãos no storage.

### Permissão

- cron interno ou super_admin

### Regras

- identificar arquivos sem referência válida
- aplicar política segura de remoção
- logar tudo

---

## 10. Cron jobs

A referência de automações anexada exige cron, prevenção de duplicidade, logs, retry seguro e rastreabilidade. fileciteturn2file1

## 10.1 `weekly-engagement-cron`

### Objetivo

Estimular retorno semanal.

### Ações possíveis

- notificar usuário que ainda não montou a semana
- sugerir nova coleção da semana
- lembrar de revisar lista de compras

### Periodicidade sugerida

- semanal

### Regras

- respeitar preferências de notificação
- não enviar repetidamente para o mesmo contexto sem janela de cooldown

---

## 10.2 `expiring-subscriptions-cron`

### Objetivo

Avisar sobre assinaturas próximas do vencimento ou com falha.

### Ações possíveis

- notificar usuário sobre vencimento próximo
- notificar falha de renovação
- enfileirar alertas administrativos quando houver erro sistêmico

### Periodicidade sugerida

- diária

---

## 10.3 `editorial-suggestions-cron`

### Objetivo

Publicar ou disparar sugestões editoriais planejadas.

### Ações possíveis

- ativar notices programados
- enfileirar push de nova coleção

### Periodicidade sugerida

- diária

---

## 11. Webhooks externos

## 11.1 Webhook de pagamento

Já coberto em `subscription-webhook`.

### Regras obrigatórias

- validar assinatura do provider
- idempotência por event id
- log persistente
- atualização transacional quando possível

## 11.2 Webhooks futuros opcionais

Se houver integrações futuras com e-mail, analytics ou automação externa:

- cada webhook em função própria
- mesma disciplina de validação e logs

---

## 12. Tabelas auxiliares recomendadas para backend

Além do `DATABASE.md`, considerar tabelas extras se necessário para robustez operacional.

## 12.1 `processed_webhook_events`

### Objetivo

Garantir idempotência de webhooks.

### Campos

- `id`
- `provider`
- `event_id`
- `event_type`
- `processed_at`
- `status`
- `metadata_json`

### Índices

- `unique(provider, event_id)`

---

## 12.2 `push_subscriptions`

### Objetivo

Guardar subscriptions Web Push por usuário/dispositivo.

### Campos

- `id`
- `user_id`
- `endpoint`
- `p256dh`
- `auth_key`
- `user_agent`
- `is_active`
- `last_used_at`
- `created_at`
- `updated_at`

### Índices

- index em `user_id`
- `unique(endpoint)`

---

## 12.3 `cron_execution_logs`

### Objetivo

Registrar execuções de rotinas automáticas.

### Campos

- `id`
- `job_name`
- `started_at`
- `finished_at`
- `status`
- `processed_count`
- `error_summary`
- `metadata_json`

---

## 13. Contratos de resposta

Toda função deve responder em formato consistente.

## 13.1 Sucesso

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "request_id": "..."
  }
}
```

## 13.2 Erro

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  },
  "meta": {
    "request_id": "..."
  }
}
```

## 13.3 Códigos de erro sugeridos

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTEGRATION_ERROR`
- `INTERNAL_ERROR`

---

## 14. Segurança obrigatória por função

Toda função sensível deve:

- ler e validar token
- confirmar role/permissão
- bloquear cedo
- usar service role somente no trecho necessário
- nunca expor segredo ao cliente
- validar input antes de tocar no banco
- evitar confiar em IDs de usuário vindos do body

Essas regras seguem a base de segurança anexada. fileciteturn2file6

---

## 15. Logs e auditoria

## 15.1 O que logar

- início da execução
- ator (quando houver)
- função executada
- entidade afetada
- sucesso/falha
- resumo do erro
- ids de correlação

## 15.2 O que evitar

- segredos
- payloads sensíveis completos
- dados pessoais além do necessário

## 15.3 Quando persistir auditoria no banco

Persistir em `audit_logs` em ações como:

- criação/edição/arquivamento de receita
- disparo editorial em massa
- reprocessamento manual
- ações administrativas sensíveis

---

## 16. Ordem recomendada de implementação das funções

## Fase 1 — base de helpers

1. `_shared/*`
2. `send-magic-link`
3. `update-password` (se necessário)

## Fase 2 — compras e fluxo principal

4. `rebuild-shopping-list`
5. `generate-share-link`

## Fase 3 — assinatura

6. `create-checkout-session`
7. `subscription-webhook`
8. `cancel-subscription`
9. `sync-subscription-status`

## Fase 4 — notificações

10. `register-push-subscription`
11. `dispatch-notifications`
12. `send-editorial-notice`

## Fase 5 — admin e manutenção

13. `admin-reports`
14. `admin-reprocess-notification`
15. `cleanup-orphan-files`

## Fase 6 — cron jobs

16. `weekly-engagement-cron`
17. `expiring-subscriptions-cron`
18. `editorial-suggestions-cron`

---

## 17. Checklist de qualidade do backend

O backend estará corretamente estruturado quando:

- funções sensíveis não dependerem do frontend para segurança
- webhooks forem idempotentes
- automações tiverem logs e rastreabilidade
- notificações passarem por fila
- assinatura registrar eventos
- lista de compras puder ser reprocessada com segurança
- admin tiver funções próprias e protegidas
- helpers compartilhados reduzirem duplicação

---

## 18. Anti-padrões proibidos

Não fazer:

- função gigante com múltiplas responsabilidades
- provider secret no frontend
- webhook sem verificação de assinatura
- cron sem log
- processamento recorrente sem idempotência
- validação apenas no cliente
- função admin sem checagem de role
- resposta inconsistente entre funções

---

## 19. Resultado esperado

Ao seguir este documento, o Codex deve implementar um backend serverless para o Cardappio que seja:

- seguro
- modular
- rastreável
- preparado para assinaturas
- preparado para notificações
- consistente com Supabase Edge Functions
- alinhado ao padrão HomeCare Match

