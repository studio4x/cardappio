# DATABASE.md — Cardappio

## 1. Objetivo do documento

Este documento define a **estrutura de banco de dados do Cardappio** em nível de implementação orientada a produto e arquitetura.

Ele deve servir como base para o Codex criar:

- migrations SQL versionadas
- tabelas por domínio
- chaves estrangeiras
- índices
- constraints
- políticas RLS
- funções auxiliares
- trilha mínima de auditoria

Este documento não traz SQL pronto, mas especifica com clareza o que precisa existir no banco.

---

## 2. Princípios obrigatórios

A modelagem deve seguir os padrões da base HomeCare Match:

- migrations SQL como fonte oficial da estrutura
- tabelas organizadas por domínio
- `id`, `created_at` e `updated_at` quando aplicável
- status explícitos em fluxos operacionais
- foreign keys claras
- índices em filtros, relacionamentos e busca recorrente
- constraints de integridade no banco
- RLS nas tabelas privadas
- funções e triggers apenas quando houver ganho real de consistência

Esses princípios seguem diretamente os padrões de banco e segurança anexados. fileciteturn2file2 fileciteturn2file6

---

## 3. Estratégia de modelagem

O banco deve ser organizado nos seguintes domínios:

1. identidade e conta
2. preferências do usuário
3. receitas e taxonomias
4. planejamento semanal
5. lista de compras
6. favoritos e histórico de uso
7. coleções e conteúdo editorial
8. assinaturas
9. notificações
10. configurações e auditoria

---

## 4. Convenções gerais

## 4.1 Convenções de colunas

Toda tabela deve considerar, quando fizer sentido:

- `id uuid primary key`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `status text` ou enum equivalente em fluxos operacionais
- `created_by uuid` e `updated_by uuid` em tabelas administrativas, quando útil

## 4.2 Convenções de nomes

- nomes em inglês
- plural consistente por projeto
- nomes descritivos
- slugs para entidades públicas navegáveis

## 4.3 Índices mínimos esperados

Criar índices em:

- foreign keys
- slugs únicos
- status usados em filtro
- `user_id`
- datas de ordenação recorrente
- colunas de busca frequente

## 4.4 Triggers sugeridos

- trigger genérica para atualizar `updated_at`
- trigger de bootstrap mínimo de perfil após criação do usuário, se necessário

---

## 5. Domínio: identidade e conta

## 5.1 Tabela `profiles`

### Objetivo

Armazenar o perfil principal do usuário autenticado.

### Campos

- `id`
- `email`
- `full_name`
- `avatar_url`
- `role`
- `status`
- `last_seen_at`
- `onboarding_completed_at`
- `created_at`
- `updated_at`

### Regras

- `id` deve referenciar o usuário do Supabase Auth
- `email` deve refletir o email principal do auth
- `role` deve suportar no mínimo: `user`, `admin`, `super_admin`
- `status` deve suportar no mínimo: `active`, `inactive`, `suspended`

### Índices

- `unique(email)` quando aplicável
- index em `role`
- index em `status`

### RLS

- usuário lê o próprio perfil
- usuário edita o próprio perfil dentro dos campos permitidos
- admin lê perfis conforme permissão
- escrita administrativa protegida

---

## 5.2 Tabela `user_preferences`

### Objetivo

Guardar preferências funcionais do Cardappio.

### Campos

- `id`
- `user_id`
- `household_size`
- `default_meal_modes`
- `default_plan_days`
- `dietary_preferences`
- `dietary_restrictions`
- `primary_goal`
- `preferred_recipe_contexts`
- `quiet_hours_enabled`
- `created_at`
- `updated_at`

### Observações

Campos como `default_meal_modes`, `dietary_preferences`, `dietary_restrictions` e `preferred_recipe_contexts` podem ser arrays ou JSONB controlado.

### Índices

- `unique(user_id)`
- index em `user_id`

### RLS

- usuário lê/escreve as próprias preferências
- admin com permissão de suporte pode ler

---

## 6. Domínio: receitas e taxonomias

## 6.1 Tabela `recipe_categories`

### Objetivo

Organizar as receitas por categoria culinária principal.

### Campos

- `id`
- `name`
- `slug`
- `description`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### Índices

- `unique(slug)`
- index em `is_active`
- index em `sort_order`

### RLS

- leitura pública/autenticada das categorias ativas
- escrita apenas admin

---

## 6.2 Tabela `recipe_tags`

### Objetivo

Permitir classificação adicional por atributos e contexto de uso.

### Campos

- `id`
- `name`
- `slug`
- `tag_type`
- `is_active`
- `created_at`

### Exemplos de `tag_type`

- `diet`
- `difficulty`
- `budget`
- `context`
- `family`

### Índices

- `unique(slug)`
- index em `tag_type`
- index em `is_active`

### RLS

- leitura pública/autenticada das tags ativas
- escrita apenas admin

---

## 6.3 Tabela `recipes`

### Objetivo

Representar a entidade principal de receita do produto.

### Campos

- `id`
- `slug`
- `title`
- `subtitle`
- `cover_image_url`
- `difficulty_level`
- `cost_level`
- `prep_time_minutes`
- `servings`
- `category_id`
- `usage_context`
- `notes`
- `status`
- `is_featured`
- `is_premium`
- `published_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### Regras

- `status` deve suportar no mínimo: `draft`, `published`, `archived`
- `difficulty_level` pode ser controlado em escala curta
- `cost_level` idem
- `is_premium` controla acesso por plano

### Constraints sugeridas

- `title` obrigatório
- `slug` único
- `prep_time_minutes >= 0`
- `servings > 0`

### Índices

- `unique(slug)`
- index em `category_id`
- index em `status`
- index em `is_featured`
- index em `is_premium`
- index composto em `(status, published_at desc)`

### Busca

Prever busca por texto em:

- `title`
- `subtitle`
- eventualmente materialized search/document field em fase posterior

### RLS

- usuários leem apenas receitas `published` compatíveis com seu plano
- admin lê todas
- escrita apenas admin

---

## 6.4 Tabela `recipe_ingredients`

### Objetivo

Armazenar ingredientes estruturados por receita.

### Campos

- `id`
- `recipe_id`
- `name`
- `quantity_label`
- `normalized_name`
- `sort_order`
- `is_optional`
- `created_at`

### Observações

`normalized_name` ajuda na consolidação futura da lista de compras.

### Índices

- index em `recipe_id`
- index em `normalized_name`
- index composto em `(recipe_id, sort_order)`

### RLS

- leitura acompanha permissão da receita
- escrita apenas admin

---

## 6.5 Tabela `recipe_steps`

### Objetivo

Guardar o modo de preparo em passos ordenados.

### Campos

- `id`
- `recipe_id`
- `step_number`
- `content`
- `created_at`

### Índices

- index em `recipe_id`
- index composto em `(recipe_id, step_number)`

### Constraints

- `step_number > 0`

### RLS

- leitura acompanha permissão da receita
- escrita apenas admin

---

## 6.6 Tabela `recipe_tag_links`

### Objetivo

Relacionar receitas e tags.

### Campos

- `id`
- `recipe_id`
- `tag_id`
- `created_at`

### Índices

- `unique(recipe_id, tag_id)`
- index em `tag_id`

### RLS

- leitura acompanha permissão da receita
- escrita apenas admin

---

## 6.7 Tabela `recipe_variations`

### Objetivo

Relacionar versões alternativas ou adaptações de receitas.

### Campos

- `id`
- `parent_recipe_id`
- `variation_title`
- `variation_notes`
- `linked_recipe_id`
- `created_at`
- `updated_at`

### RLS

- leitura acompanha permissão da receita
- escrita apenas admin

---

## 7. Domínio: planejamento semanal

## 7.1 Tabela `meal_plan_weeks`

### Objetivo

Representar uma semana planejada pelo usuário.

### Campos

- `id`
- `user_id`
- `title`
- `week_start_date`
- `week_end_date`
- `status`
- `is_template`
- `source_week_id`
- `created_at`
- `updated_at`

### Regras

- `status` deve suportar: `draft`, `active`, `archived`
- `source_week_id` permite rastrear duplicação/reuso
- `is_template` prepara o terreno para semanas modelo futuras

### Índices

- index em `user_id`
- index em `(user_id, week_start_date desc)`
- index em `status`
- index em `source_week_id`

### RLS

- usuário lê/escreve apenas as próprias semanas
- admin lê por necessidade operacional

---

## 7.2 Tabela `meal_plan_days`

### Objetivo

Representar cada dia pertencente a uma semana planejada.

### Campos

- `id`
- `week_id`
- `day_of_week`
- `date_reference`
- `sort_order`
- `created_at`

### Regras

- `day_of_week` controlado
- uma semana pode ter apenas os dias selecionados pelo usuário

### Índices

- index em `week_id`
- `unique(week_id, day_of_week)`

### RLS

- acompanha a RLS da semana

---

## 7.3 Tabela `meal_plan_slots`

### Objetivo

Representar um slot de refeição dentro de um dia, como almoço ou jantar.

### Campos

- `id`
- `day_id`
- `meal_type`
- `recipe_id`
- `sort_order`
- `created_at`
- `updated_at`

### Regras

- `meal_type` deve suportar no mínimo: `lunch`, `dinner`
- um dia pode ter um ou ambos os tipos

### Índices

- index em `day_id`
- index em `recipe_id`
- `unique(day_id, meal_type)`

### RLS

- acompanha a RLS do dia/semana

---

## 8. Domínio: lista de compras

## 8.1 Tabela `shopping_lists`

### Objetivo

Representar a lista de compras gerada para uma semana.

### Campos

- `id`
- `user_id`
- `week_id`
- `status`
- `generated_at`
- `created_at`
- `updated_at`

### Regras

- `status` pode suportar: `active`, `archived`
- uma semana ativa deve ter no máximo uma lista ativa principal

### Índices

- index em `user_id`
- index em `week_id`
- index em `status`
- `unique(week_id)` se a regra for 1:1

### RLS

- usuário lê/escreve apenas as próprias listas
- admin com permissão operacional pode ler

---

## 8.2 Tabela `shopping_list_items`

### Objetivo

Representar os itens individuais da lista.

### Campos

- `id`
- `shopping_list_id`
- `ingredient_label`
- `normalized_name`
- `quantity_label`
- `source_recipe_count`
- `is_checked`
- `sort_order`
- `created_at`
- `updated_at`

### Observações

- `ingredient_label` guarda a exibição final
- `normalized_name` ajuda em consolidação/reprocessamento
- `source_recipe_count` informa de quantas receitas veio o item

### Índices

- index em `shopping_list_id`
- index em `(shopping_list_id, is_checked)`
- index em `normalized_name`

### RLS

- acompanha a RLS da lista

---

## 9. Domínio: favoritos e recorrência

## 9.1 Tabela `favorite_recipes`

### Objetivo

Guardar favoritos do usuário.

### Campos

- `id`
- `user_id`
- `recipe_id`
- `created_at`

### Índices

- `unique(user_id, recipe_id)`
- index em `user_id`
- index em `recipe_id`

### RLS

- usuário lê/escreve apenas os próprios favoritos
- admin pode ler agregados se necessário

---

## 9.2 Estratégia para histórico

O histórico de semanas pode ser derivado principalmente de `meal_plan_weeks`, sem tabela separada inicialmente.

Em fase futura, se necessário, pode existir uma tabela de analytics de uso.

---

## 10. Domínio: coleções e conteúdo editorial

## 10.1 Tabela `recipe_collections`

### Objetivo

Criar agrupamentos editoriais de receitas.

### Campos

- `id`
- `title`
- `slug`
- `description`
- `cover_image_url`
- `is_active`
- `is_premium`
- `sort_order`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

### Índices

- `unique(slug)`
- index em `is_active`
- index em `is_premium`
- index em `sort_order`

### RLS

- usuários leem coleções ativas compatíveis com seu plano
- escrita apenas admin

---

## 10.2 Tabela `recipe_collection_items`

### Objetivo

Relacionar receitas a coleções.

### Campos

- `id`
- `collection_id`
- `recipe_id`
- `sort_order`
- `created_at`

### Índices

- `unique(collection_id, recipe_id)`
- index em `collection_id`
- index em `(collection_id, sort_order)`

### RLS

- leitura acompanha a coleção/receita
- escrita apenas admin

---

## 10.3 Tabela `editorial_notices`

### Objetivo

Gerir dicas, alertas e conteúdos editoriais leves.

### Campos

- `id`
- `title`
- `body`
- `notice_type`
- `target_audience`
- `is_active`
- `starts_at`
- `ends_at`
- `created_by`
- `created_at`
- `updated_at`

### Exemplos de `notice_type`

- `tip`
- `alert`
- `seasonal`
- `premium`

### Índices

- index em `notice_type`
- index em `is_active`
- index em `starts_at`
- index em `ends_at`

### RLS

- leitura apenas dos notices ativos e adequados ao público
- escrita apenas admin

---

## 11. Domínio: assinaturas

A estrutura deve seguir a base de subscrições anexada, adaptando nomes ao Cardappio. A referência já cobre tiers free/monthly/yearly, histórico de preços, auto-renew, cancelamento e eventos. fileciteturn2file3

## 11.1 Tabela `plans`

### Campos

- `id`
- `name`
- `tier`
- `billing_period`
- `price_amount`
- `currency`
- `description`
- `features_json`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

### Índices

- index em `tier`
- index em `is_active`

---

## 11.2 Tabela `plan_prices`

### Campos

- `id`
- `plan_id`
- `amount`
- `currency`
- `valid_from`
- `valid_until`
- `created_at`

### Índices

- index em `plan_id`
- index em `valid_from`

---

## 11.3 Tabela `user_subscriptions`

### Campos

- `id`
- `user_id`
- `plan_id`
- `subscription_tier`
- `status`
- `subscription_until`
- `auto_renew`
- `cancelled_at`
- `cancel_reason`
- `provider_customer_id`
- `provider_subscription_id`
- `created_at`
- `updated_at`

### Regras

- status mínimo: `active`, `cancelled`, `expired`, `past_due`
- usuário pode ter uma assinatura principal ativa por vez

### Índices

- index em `user_id`
- index em `status`
- index em `subscription_until`
- `unique(user_id)` se houver apenas uma assinatura corrente por usuário

### RLS

- usuário lê a própria assinatura
- escrita sensível apenas backend/admin

---

## 11.4 Tabela `subscription_events`

### Campos

- `id`
- `user_id`
- `subscription_id`
- `event_type`
- `old_tier`
- `new_tier`
- `amount`
- `reference_id`
- `metadata_json`
- `created_at`

### Regras

- eventos mínimos: `upgrade`, `downgrade`, `renew`, `cancel`, `refund`

### Índices

- index em `user_id`
- index em `subscription_id`
- index em `event_type`
- index em `created_at`

### RLS

- usuário lê eventos próprios relevantes
- escrita apenas backend/admin

---

## 12. Domínio: notificações

O modelo deve seguir a referência multi-canal, com fila, logs, preferências e rastreabilidade. fileciteturn1file15

## 12.1 Tabela `notifications`

### Campos

- `id`
- `user_id`
- `title`
- `body`
- `action_url`
- `category`
- `priority`
- `is_actionable`
- `read_at`
- `read_by_channels`
- `created_at`

### Índices

- index em `user_id`
- index em `read_at`
- index em `category`
- index em `created_at`

### RLS

- usuário lê apenas as próprias notificações
- escrita apenas backend/admin

---

## 12.2 Tabela `notification_queue`

### Campos

- `id`
- `user_id`
- `channel`
- `title`
- `body`
- `payload_json`
- `status`
- `attempt_count`
- `last_attempt_at`
- `next_retry_at`
- `final_error`
- `provider_message_id`
- `created_at`
- `updated_at`

### Índices

- index em `user_id`
- index em `channel`
- index em `status`
- index em `next_retry_at`

### RLS

- não precisa leitura direta do usuário por padrão
- leitura/admin/backend operacional

---

## 12.3 Tabela `notification_delivery_logs`

### Campos

- `id`
- `queue_id`
- `channel`
- `attempt_number`
- `status`
- `error_message`
- `response_status_code`
- `retry_attempt`
- `delivered_at`
- `created_at`

### Índices

- index em `queue_id`
- index em `status`
- index em `created_at`

---

## 12.4 Tabela `notification_preferences`

### Campos

- `id`
- `user_id`
- `push_enabled`
- `email_enabled`
- `in_app_enabled`
- `quiet_hours_enabled`
- `quiet_hours_start`
- `quiet_hours_end`
- `timezone`
- `created_at`
- `updated_at`

### Índices

- `unique(user_id)`

### RLS

- usuário lê/escreve as próprias preferências
- admin lê quando necessário

---

## 13. Domínio: configurações e auditoria

## 13.1 Tabela `app_settings`

### Objetivo

Guardar configurações globais do produto.

### Campos

- `id`
- `setting_key`
- `value_json`
- `description`
- `updated_by`
- `updated_at`

### Índices

- `unique(setting_key)`

### RLS

- leitura restrita conforme necessidade
- escrita apenas admin/super_admin

---

## 13.2 Tabela `audit_logs`

### Objetivo

Criar rastreabilidade mínima para operações críticas.

### Campos

- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata_json`
- `created_at`

### Exemplos de ações

- recipe_created
- recipe_updated
- recipe_archived
- collection_published
- editorial_notice_sent
- subscription_reprocessed

### Índices

- index em `actor_user_id`
- index em `entity_type`
- index em `entity_id`
- index em `created_at`

### RLS

- leitura apenas admin/super_admin
- escrita backend/admin

---

## 14. Relacionamentos principais

## 14.1 Conta e preferências

- `profiles 1:1 user_preferences`
- `profiles 1:N meal_plan_weeks`
- `profiles 1:N shopping_lists`
- `profiles 1:N favorite_recipes`
- `profiles 1:N notifications`
- `profiles 1:1 notification_preferences`
- `profiles 1:1 user_subscriptions` (estrutura corrente)

## 14.2 Receitas

- `recipe_categories 1:N recipes`
- `recipes 1:N recipe_ingredients`
- `recipes 1:N recipe_steps`
- `recipes N:N recipe_tags` via `recipe_tag_links`
- `recipes 1:N recipe_variations`
- `recipes N:N recipe_collections` via `recipe_collection_items`

## 14.3 Planejamento

- `meal_plan_weeks 1:N meal_plan_days`
- `meal_plan_days 1:N meal_plan_slots`
- `meal_plan_slots N:1 recipes`
- `meal_plan_weeks 1:1 shopping_lists`

## 14.4 Monetização

- `plans 1:N plan_prices`
- `plans 1:N user_subscriptions`
- `user_subscriptions 1:N subscription_events`

## 14.5 Notificações

- `notifications 1:N notification_queue` em casos onde houver replicação por canal, se necessário
- `notification_queue 1:N notification_delivery_logs`

---

## 15. Regras de RLS por domínio

## 15.1 Privadas do usuário

Ativar RLS em:

- `profiles`
- `user_preferences`
- `meal_plan_weeks`
- `meal_plan_days`
- `meal_plan_slots`
- `shopping_lists`
- `shopping_list_items`
- `favorite_recipes`
- `user_subscriptions`
- `subscription_events`
- `notifications`
- `notification_preferences`

## 15.2 Administrativas

Ativar RLS em:

- `app_settings`
- `audit_logs`
- tabelas administrativas quando não forem públicas

## 15.3 Públicas controladas

Leitura pública/autenticada controlada em:

- `recipe_categories`
- `recipe_tags`
- `recipes` publicadas compatíveis com plano
- `recipe_ingredients` e `recipe_steps` por herança funcional
- `recipe_collections` ativas compatíveis com plano
- `editorial_notices` ativos e segmentados

A lógica de RLS e separação entre leitura própria, leitura administrativa e leitura pública é coerente com os padrões anexados. fileciteturn2file6

---

## 16. Functions e RPC sugeridas

Criar funções SQL/RPC apenas onde houver ganho real.

## Sugestões iniciais

### `get_user_plan_access(user_id)`
Retorna tier atual e permissões derivadas.

### `get_active_week_for_user(user_id)`
Retorna a semana mais relevante/ativa.

### `rebuild_shopping_list(week_id)`
Reprocessa a lista de compras da semana.

### `admin_recipe_usage_report(...)`
Consulta consolidada para admin.

### `touch_updated_at()`
Função genérica para trigger de `updated_at`.

---

## 17. Ordem recomendada das migrations

## Lote 1 — Fundação

1. extensões úteis
2. função `touch_updated_at`
3. `profiles`
4. `user_preferences`
5. `app_settings`
6. `audit_logs`
7. triggers base
8. RLS base dessas tabelas

## Lote 2 — Receitas e taxonomias

9. `recipe_categories`
10. `recipe_tags`
11. `recipes`
12. `recipe_ingredients`
13. `recipe_steps`
14. `recipe_tag_links`
15. `recipe_variations`
16. índices
17. RLS

## Lote 3 — Planejamento semanal

18. `meal_plan_weeks`
19. `meal_plan_days`
20. `meal_plan_slots`
21. índices
22. RLS

## Lote 4 — Compras e recorrência

23. `shopping_lists`
24. `shopping_list_items`
25. `favorite_recipes`
26. índices
27. RLS

## Lote 5 — Conteúdo editorial

28. `recipe_collections`
29. `recipe_collection_items`
30. `editorial_notices`
31. índices
32. RLS

## Lote 6 — Assinaturas

33. `plans`
34. `plan_prices`
35. `user_subscriptions`
36. `subscription_events`
37. índices
38. RLS

## Lote 7 — Notificações

39. `notifications`
40. `notification_queue`
41. `notification_delivery_logs`
42. `notification_preferences`
43. índices
44. RLS

## Lote 8 — RPCs e refinamentos

45. RPCs principais
46. policies refinadas
47. seeds iniciais

---

## 18. Seeds mínimos recomendados

Criar seeds para:

- categorias iniciais
- tags iniciais
- planos base (`free`, `monthly`, `yearly`)
- receitas iniciais do produto
- coleções iniciais
- configuração global mínima

---

## 19. Critérios de qualidade do banco

O banco estará bem definido quando:

- cada domínio estiver em tabelas próprias
- relacionamentos estiverem claros
- constraints impedirem inconsistências básicas
- índices cobrirem os principais filtros
- RLS proteger dados privados
- tabelas públicas tiverem leitura controlada
- estrutura suportar admin, assinatura e notificações sem gambiarra
- a lista de compras puder ser reprocessada sem perda de rastreabilidade

---

## 20. Anti-padrões proibidos

Não fazer:

- tabela única para múltiplos domínios sem necessidade
- array solto substituindo relacionamento necessário
- ausência de índices em foreign keys
- status implícito sem coluna de status
- tabelas privadas sem RLS
- escrita administrativa liberada diretamente ao cliente
- lógica complexa de assinatura ou notificação sem tabela de eventos/logs
- dependência de configuração manual fora de migration

---

## 21. Resultado esperado

Ao seguir este documento, o Codex deve conseguir criar uma base de dados para o Cardappio que seja:

- segura
- versionada
- escalável
- coerente com o produto
- pronta para o fluxo principal do app
- compatível com admin, monetização, notificações e PWA

