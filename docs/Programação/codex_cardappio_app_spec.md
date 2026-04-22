# CODEX_CARDAPPIO_APP_SPEC.md

## 1. Objetivo deste documento

Este documento é a especificação mestre para o **Codex** criar o app **Cardappio** no VS Code.

Ele define a **estrutura real do produto**, a organização funcional, a arquitetura recomendada, a separação de áreas, os módulos, as rotas, a modelagem inicial de entidades, as regras de acesso, o painel administrativo, as automações e a ordem lógica de construção.

Este documento **não contém código**, mas deve ser usado como fonte principal para orientar a implementação.

---

## 2. Resumo executivo do produto

O **Cardappio** é um **PWA de planejamento semanal de refeições**, com foco em:

- montar almoço e jantar da semana
- selecionar receitas por dia
- gerar lista de compras automaticamente
- consultar receitas no momento do preparo
- repetir e ajustar semanas futuras
- oferecer uma experiência simples, prática e recorrente

O produto **não deve ser construído como um catálogo genérico de receitas**. O núcleo é:

- planejamento semanal
- cardápio visual
- lista de compras
- rotina da casa

A ideia original do app já prevê seleção de dias, receitas por dia, almoço/jantar, calendário semanal, lista de compras, impressão, biblioteca inicial de receitas, área administrativa, push, áreas de receitas, variações, dicas e alertas. O suporte institucional também já aparece como parte do ecossistema. fileciteturn2file19

---

## 3. Stack padrão obrigatória

Seguir o padrão HomeCare Match como base arquitetural:

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Roteamento:** React Router
- **Estado remoto:** TanStack React Query
- **Backend serverless:** Supabase
- **Banco:** PostgreSQL com migrations SQL versionadas
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Lógica sensível / integrações / automações:** Supabase Edge Functions
- **Deploy do frontend:** Vercel
- **Formato do produto:** PWA

Esse é o mesmo padrão estrutural recomendado na base de arquitetura anexada. fileciteturn2file5

---

## 4. Princípios arquiteturais obrigatórios

### 4.1 Separação macro do sistema

O sistema deve ser dividido em:

1. **área pública**
2. **área autenticada do usuário**
3. **painel administrativo**

Essa separação segue diretamente o padrão da base arquitetural e das referências de dashboard/admin. fileciteturn2file5 fileciteturn2file15 fileciteturn2file18

### 4.2 Segurança em camadas

Toda implementação deve seguir:

- autenticação obrigatória em áreas privadas
- autorização por role e permissões
- RLS nas tabelas privadas
- validação de frontend e backend em fluxos críticos
- operações sensíveis em Edge Functions
- segredos nunca expostos no frontend

Esse é o padrão de segurança obrigatório nos materiais anexados. fileciteturn2file6

### 4.3 Fonte oficial da estrutura de dados

A estrutura do banco deve ser mantida em **migrations SQL versionadas**, nunca dependente de ajustes manuais isolados. As tabelas devem prever chaves estrangeiras, índices, timestamps, constraints, status explícitos e suporte a auditoria quando necessário. fileciteturn2file2

### 4.4 Backend sensível em Edge Functions

Operações administrativas, pagamentos, webhooks, e-mail, push, integrações externas e automações recorrentes devem ficar em Edge Functions com validação explícita de entrada, autenticação, permissão, logs e idempotência. fileciteturn2file1

---

## 5. Objetivo de implementação para o Codex

O Codex deve criar um app com:

- experiência mobile-first
- arquitetura escalável
- separação clara por domínio
- design system consistente
- área pública comercial
- dashboard do usuário focado em tarefa
- admin operacional denso
- banco organizado por domínio
- autenticação segura
- regras críticas fora do frontend
- base preparada para assinatura, notificações e expansão futura

---

## 6. Estrutura macro do produto

## 6.1 Área pública

Objetivo:

- apresentar o produto
- explicar a proposta de valor
- converter visitantes em cadastro
- explicar planos
- oferecer FAQ e suporte

### Páginas públicas previstas

- `/`
- `/como-funciona`
- `/planos`
- `/faq`
- `/contato`
- `/quem-somos`
- `/suporte`
- `/auth/login`
- `/auth/cadastro`

---

## 6.2 Área autenticada do usuário

Objetivo:

- concentrar a jornada principal
- montagem da semana
- consulta do cardápio
- lista de compras
- receita detalhada
- favoritos
- histórico
- preferências
- assinatura

### Páginas autenticadas previstas

- `/app`
- `/app/semana`
- `/app/semana/nova`
- `/app/semana/:weekId`
- `/app/receitas`
- `/app/receitas/:recipeSlug`
- `/app/compras`
- `/app/favoritos`
- `/app/historico`
- `/app/colecoes`
- `/app/perfil`
- `/app/assinatura`
- `/app/notificacoes`

---

## 6.3 Área administrativa

Objetivo:

- gerir conteúdo
- operar planos
- monitorar uso
- controlar notificações
- administrar configurações globais

### Páginas admin previstas

- `/admin`
- `/admin/receitas`
- `/admin/receitas/nova`
- `/admin/receitas/:id`
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

Os padrões de dashboard do usuário e painel admin devem seguir a lógica das referências anexadas: dashboard mais acolhedor e orientado à tarefa, admin mais denso, modular e operacional. fileciteturn2file15 fileciteturn2file18

---

## 7. Perfis do sistema

## 7.1 user

Usuário final autenticado.

Pode:

- montar semana
- selecionar receitas
- gerar lista de compras
- favoritar receitas
- consultar histórico
- gerir preferências
- gerir assinatura própria

## 7.2 admin

Operador do sistema.

Pode:

- criar, editar e arquivar receitas
- gerir categorias, tags e coleções
- publicar dicas e alertas
- operar notificações
- gerir planos e visão operacional de usuários
- consultar relatórios, métricas e logs

## 7.3 super_admin (opcional)

Perfil reservado para:

- configurações globais sensíveis
- reprocessamento operacional
- ajustes sistêmicos
- visão completa de auditoria

---

## 8. Módulos de negócio obrigatórios

## 8.1 Módulo de autenticação e conta

### Escopo

- cadastro
- login
- recuperação de acesso
- manutenção de sessão
- perfil básico

### Direção recomendada

Usar Supabase Auth e adotar o padrão de autenticação por magic link / OTP como opção principal, com possibilidade de fallback para senha depois. A base anexada detalha esse fluxo e seus pontos de segurança. fileciteturn2file7

### Entidades principais

- profile
- auth identity (Supabase)
- user_preferences

---

## 8.2 Módulo de onboarding

### Escopo

Coletar os dados mínimos para personalização inicial:

- quantidade de pessoas na casa
- almoço, jantar ou ambos
- quantos dias por semana deseja planejar
- restrições ou preferências alimentares
- objetivo principal de uso

### Regra

Onboarding curto, editável depois.

---

## 8.3 Módulo de planejamento semanal

### Escopo

É o núcleo do produto.

Permite:

- escolher dias da semana
- definir almoço, jantar ou ambos
- atribuir receitas a cada slot
- editar semana
- substituir refeições
- salvar semana
- gerar cardápio visual

### Entidades principais

- meal_plan_weeks
- meal_plan_days
- meal_plan_slots

### Regras

- semana pode ser parcial
- edição posterior obrigatória
- alterações impactam lista de compras
- usuário pode duplicar ou repetir semanas em versões futuras

---

## 8.4 Módulo de receitas

### Escopo

Biblioteca de receitas do app.

### Estrutura mínima de receita

A receita deve suportar pelo menos os campos originalmente previstos e os campos adicionais necessários para uso real:

- título
- subtítulo
- slug
- imagem principal
- dificuldade
- custo estimado
- tempo de preparo
- rendimento/porções
- ingredientes
- modo de preparo
- observações
- categoria principal
- tags
- contexto de uso
- status

A ideia original já traz título, subtítulo, dificuldade, custo, ingredientes, preparo, observações, foto e áreas de receitas. fileciteturn2file19

### Recursos do módulo

- busca por receita
- filtro por categoria
- filtro por contexto de uso
- favoritos
- coleções editoriais
- variações de receita

---

## 8.5 Módulo de lista de compras

### Escopo

Gerar a lista automaticamente a partir das receitas da semana.

### Requisitos funcionais

- consolidar ingredientes repetidos
- preservar ordem coerente
- permitir checklist
- permitir remoção manual
- permitir impressão / compartilhamento
- refletir mudanças do cardápio

### Entidades principais

- shopping_lists
- shopping_list_items

---

## 8.6 Módulo de favoritos

### Escopo

Salvar receitas preferidas para reutilização rápida.

### Entidade principal

- favorite_recipes

---

## 8.7 Módulo de histórico

### Escopo

Permitir:

- consultar semanas passadas
- duplicar semana
- repetir estrutura anterior
- acelerar uso recorrente

---

## 8.8 Módulo de coleções e conteúdo editorial

### Escopo

- coleções temáticas
- destaques da semana
- dicas
- alertas
- conteúdo sazonal

### Entidades principais

- recipe_collections
- recipe_collection_items
- editorial_notices

A ideia original já previa dicas, alertas e áreas de receitas no admin. fileciteturn2file19

---

## 8.9 Módulo de assinatura

### Escopo

- plano free
- plano monthly
- plano yearly
- gestão de acesso premium
- upgrade
- cancelamento
- histórico de eventos de assinatura

A estrutura de tiers free / mensal / anual, com renovação automática, gestão de ciclo de vida, tabela de planos, histórico de preços e eventos de assinatura já está descrita na spec anexada. fileciteturn2file3

### Entidades principais

- plans
- plan_prices
- user_subscriptions
- subscription_events

### Regra de acesso recomendada

#### Free

- planejamento básico
- biblioteca inicial limitada
- lista de compras básica
- favoritos limitados
- histórico limitado

#### Premium

- biblioteca completa
- filtros avançados
- histórico completo
- coleções premium
- recursos futuros de automação

---

## 8.10 Módulo de notificações

### Escopo

- notificações in-app
- push web/PWA
- e-mail em fluxos específicos
- preferências de notificação
- fila e log de entrega

A spec de notificações multi-canal anexada já define arquitetura com fila persistida, retry, logs e preferências por usuário; esse padrão deve ser reaproveitado na adaptação do Cardappio. fileciteturn1file15

### Entidades principais

- notifications
- notification_queue
- notification_delivery_logs
- notification_preferences

---

## 8.11 Módulo PWA

### Escopo

- manifest
- install prompt
- service worker
- shell cache
- offline fallback mínimo
- push notifications
- experiência mobile semelhante a app instalado

A referência de PWA anexada recomenda manifest, service worker, cache versionado, instalação em tela inicial, suporte iOS/Android e push. fileciteturn1file12

---

## 8.12 Módulo admin

### Escopo mínimo

- CRUD de receitas
- CRUD de categorias
- CRUD de tags
- CRUD de coleções
- gestão de dicas e alertas
- envio / agendamento de notificações
- visão de usuários
- visão de assinaturas
- configurações globais
- relatórios básicos

O admin deve seguir o padrão operacional das specs anexadas: sidebar densa, listagens, filtros, indicadores, ações rápidas e separação modular. fileciteturn2file18

---

## 9. Estrutura recomendada de pastas

```txt
src/
  app/
    router/
    providers/
    guards/
  components/
    ui/
    layout/
    shared/
    public/
    dashboard/
    admin/
    recipes/
    planning/
    shopping/
    subscriptions/
    notifications/
  pages/
    public/
    auth/
    app/
    admin/
  hooks/
    auth/
    recipes/
    planning/
    shopping/
    subscriptions/
    notifications/
  lib/
    constants/
    utils/
    validators/
    formatters/
    permissions/
    tracking/
    pwa/
  domains/
    auth/
    profiles/
    recipes/
    planning/
    shopping/
    favorites/
    collections/
    subscriptions/
    notifications/
    admin/
  integrations/
    supabase/
  styles/
  types/
  config/

supabase/
  migrations/
  seed/
  functions/
    _shared/
    send-magic-link/
    subscription-webhook/
    checkout-session/
    dispatch-notifications/
    send-editorial-notice/
    generate-share-link/
    admin-reports/
    cleanup-orphan-files/
  tests/

public/
  manifest.webmanifest
  sw.js
  offline.html
  icons/
```

Essa estrutura segue a orientação geral da base arquitetural, que separa pages, components, hooks, lib, integrations e backend serverless com functions e migrations. fileciteturn2file5

---

## 10. Rotas e layouts

## 10.1 Layouts necessários

### PublicLayout

Usado em:

- home
- como funciona
- planos
- FAQ
- suporte

### AuthLayout

Usado em:

- login
- cadastro
- recuperação
- callback

### UserLayout

Usado em:

- dashboard do app
- planejamento
- compras
- favoritos
- histórico
- perfil
- assinatura

Deve seguir a lógica de dashboard acolhedor, orientado à tarefa e com boa experiência mobile. fileciteturn2file15

### AdminLayout

Usado em:

- todas as rotas admin

Deve seguir a lógica de painel mais operacional, denso e modular. fileciteturn2file18

---

## 11. Modelagem inicial de dados

## 11.1 Tabelas principais do domínio Cardappio

### profiles

Campos mínimos sugeridos:

- id
- full_name
- email
- avatar_url
- role
- status
- created_at
- updated_at

### user_preferences

- id
- user_id
- household_size
- plan_days_default
- plan_meal_modes
- dietary_preferences
- dietary_restrictions
- primary_goal
- created_at
- updated_at

### recipe_categories

- id
- name
- slug
- description
- sort_order
- is_active
- created_at
- updated_at

### recipe_tags

- id
- name
- slug
- type
- created_at

### recipes

- id
- slug
- title
- subtitle
- cover_image_url
- difficulty_level
- cost_level
- prep_time_minutes
- servings
- category_id
- usage_context
- notes
- status
- is_featured
- is_premium
- created_by
- created_at
- updated_at

### recipe_ingredients

- id
- recipe_id
- name
- quantity_label
- sort_order
- is_optional

### recipe_steps

- id
- recipe_id
- step_number
- content

### recipe_tag_links

- id
- recipe_id
- tag_id

### recipe_variations

- id
- parent_recipe_id
- variation_title
- variation_notes
- linked_recipe_id nullable

### meal_plan_weeks

- id
- user_id
- title
- week_start_date
- week_end_date
- status
- is_template
- created_at
- updated_at

### meal_plan_days

- id
- week_id
- day_of_week
- date_reference nullable
- sort_order

### meal_plan_slots

- id
- day_id
- meal_type
- recipe_id
- sort_order

### shopping_lists

- id
- user_id
- week_id
- status
- generated_at
- created_at
- updated_at

### shopping_list_items

- id
- shopping_list_id
- ingredient_label
- normalized_name
- quantity_label
- source_recipe_count
- is_checked
- sort_order

### favorite_recipes

- id
- user_id
- recipe_id
- created_at
- UNIQUE(user_id, recipe_id)

### recipe_collections

- id
- title
- slug
- description
- cover_image_url
- is_active
- is_premium
- sort_order
- created_at
- updated_at

### recipe_collection_items

- id
- collection_id
- recipe_id
- sort_order

### editorial_notices

- id
- title
- body
- notice_type
- target_audience
- is_active
- starts_at
- ends_at
- created_at

### app_settings

- id
- key
- value_json
- updated_at

### audit_logs

- id
- actor_user_id
- action
- entity_type
- entity_id
- metadata_json
- created_at

## 11.2 Tabelas de monetização

Basear o módulo de assinatura na referência anexada:

- plans
- prices (ou plan_prices)
- user_subscriptions / colunas em profiles
- subscription_events

A spec anexada já sugere estrutura para tiers, histórico de preço e eventos. fileciteturn2file3

## 11.3 Tabelas de notificação

Basear-se no padrão existente:

- notifications
- notification_queue
- notification_delivery_logs
- notification_preferences

A spec de notificações já define status, retries, logs e preferências. fileciteturn1file15

---

## 12. RLS, roles e autorização

## 12.1 Regras obrigatórias

Seguir o padrão de segurança dos anexos:

- áreas privadas exigem autenticação
- autorização nunca depende só do frontend
- dados privados protegidos por RLS
- leitura e escrita separadas por caso de uso
- ações críticas em Edge Functions

fileciteturn2file6

## 12.2 Regras por tabela

### Usuário final pode ler/escrever

- próprio profile
- próprias preferences
- próprias semanas
- próprias listas de compras
- próprios favoritos
- próprias notificações
- própria assinatura e eventos visíveis relevantes

### Usuário final pode ler publicamente

- receitas ativas liberadas para seu plano
- categorias ativas
- tags ativas
- coleções liberadas para seu plano
- conteúdos editoriais públicos ou segmentados

### Admin pode

- ler e escrever módulos administrativos
- operar conteúdo
- acessar visão consolidada
- acionar Edge Functions administrativas

### Super admin pode

- operar configurações globais
- ver logs sensíveis
- reprocessar automações

---

## 13. Edge Functions necessárias

Criar uma função por responsabilidade, conforme a referência de Edge Functions e automações. fileciteturn2file1

## 13.1 Auth

- `send-magic-link`
- `refresh-session` (se necessário)
- `update-password` (se fallback por senha existir)

## 13.2 Subscrição

- `create-checkout-session`
- `subscription-webhook`
- `cancel-subscription`
- `sync-subscription-status`

## 13.3 Notificações

- `dispatch-notifications`
- `send-editorial-notice`
- `register-push-subscription`

## 13.4 Compartilhamento / exportação

- `generate-share-link`
- `render-printable-plan` (se PDF/HTML render seguro for necessário)

## 13.5 Admin

- `admin-reports`
- `admin-rebuild-shopping-list`
- `admin-reprocess-notification`

## 13.6 Automações

- `cron-expiring-subscriptions`
- `cron-weekly-engagement`
- `cron-editorial-suggestions`
- `cleanup-orphan-files`

### Regras obrigatórias para todas as funções

- validação explícita de input
- autenticação quando aplicável
- confirmação de role/permissão
- logs claros
- idempotência em rotinas recorrentes
- service role apenas dentro da função

fileciteturn2file1

---

## 14. Storage

## 14.1 Buckets sugeridos

- `recipe-images`
- `collection-covers`
- `user-avatars`
- `exports-temp`

## 14.2 Regras

- paths sanitizados
- separação por domínio
- referência ao arquivo no banco
- remoção segura de substituições antigas
- acesso público só quando realmente necessário

Esse padrão é recomendado pelo material de segurança. fileciteturn2file6

---

## 15. PWA

## 15.1 Requisitos mínimos

- `manifest.webmanifest`
- `sw.js`
- registro do service worker
- offline fallback mínimo
- ícones 192/512/maskable
- meta tags móveis
- suporte a instalação
- push notifications

A base PWA anexada já documenta esse padrão. fileciteturn1file12

## 15.2 Escopo offline recomendado

- shell da aplicação
- última semana consultada em cache leve
- fallback para tela offline simples

---

## 16. Direção visual para a implementação

## 16.1 Área pública

- mais comercial
- mais espaçada
- storytelling objetivo
- CTA claro

## 16.2 Dashboard do usuário

- clean operational product
- mais acolhedor que o admin
- mais funcional que a home
- foco em cards de ação, status e próximos passos

Esse é o padrão descrito na spec de dashboard autenticado. fileciteturn2file15

## 16.3 Admin

- visual operacional
- tabelas, filtros, badges, dialogs
- pouca ornamentação
- alta clareza e controle

Esse é o padrão descrito na spec de admin. fileciteturn2file18

---

## 17. Componentes obrigatórios

## 17.1 Componentes base

- AppShell
- PublicHeader
- PublicFooter
- UserSidebar / MobileNav
- AdminSidebar
- PageHeader
- EmptyState
- LoadingState
- ErrorState
- SuccessState

## 17.2 Componentes de domínio

- RecipeCard
- RecipeFilters
- RecipeMetaBadges
- DayCard
- MealSlotCard
- WeeklySummaryCard
- ShoppingListCard
- ShoppingChecklistItem
- FavoriteButton
- CollectionCard
- PremiumLockCard
- NotificationCenter

## 17.3 Componentes admin

- AdminDataTable
- AdminFiltersBar
- AdminMetricCards
- RecipeEditorForm
- CategoryManager
- CollectionManager
- NoticeManager
- PlansManager

---

## 18. Ordem lógica de implementação para o Codex

## Fase 1 — fundação

- setup do projeto
- design tokens
- providers globais
- integração Supabase
- autenticação
- layouts
- roteamento base

## Fase 2 — núcleo do usuário

- onboarding
- receitas
- planejamento semanal
- cardápio semanal
- lista de compras

## Fase 3 — retenção

- favoritos
- histórico
- coleções
- notificações

## Fase 4 — monetização

- planos
- tela de upgrade
- fluxo de assinatura
- webhooks

## Fase 5 — admin

- CRUD de receitas
- categorias
- coleções
- dicas/alertas
- visão de usuários e assinaturas

## Fase 6 — PWA e refinamentos

- manifest
- service worker
- offline
- push
- performance

---

## 19. Critérios de aceite obrigatórios

O app será considerado corretamente estruturado quando:

- a área pública, app e admin estiverem separados
- o usuário conseguir montar uma semana completa
- a lista de compras for gerada a partir da semana
- receitas tiverem estrutura operacional completa
- favoritos e histórico estiverem funcionando
- admin conseguir gerir receitas e categorias
- autenticação e autorização estiverem protegidas
- tabelas privadas estiverem com RLS
- operações sensíveis estiverem fora do frontend
- o app puder ser instalado como PWA
- a base suportar assinatura free/monthly/yearly

---

## 20. Anti-padrões proibidos para o Codex

Não fazer:

- lógica crítica apenas no frontend
- painel admin misturado com dashboard do usuário
- banco sem migrations
- tabelas sem RLS quando privadas
- função gigante para várias responsabilidades
- regra de assinatura solta e sem eventos
- notificações sem fila e sem log
- uploads sem organização por domínio
- app orientado a catálogo e não a planejamento

---

## 21. Instrução final para o Codex

Ao implementar o Cardappio:

1. tratar este documento como fonte principal de estrutura
2. respeitar o padrão HomeCare Match para arquitetura, segurança e operação
3. implementar primeiro a fundação e o fluxo principal do usuário
4. só depois expandir para monetização, automações e admin avançado
5. manter separação rigorosa entre apresentação, regra de negócio, dados, automações e área administrativa

