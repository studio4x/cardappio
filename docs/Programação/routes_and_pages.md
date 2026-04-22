# ROUTES_AND_PAGES.md — Cardappio

## 1. Objetivo do documento

Este documento define a **estrutura de rotas e páginas do Cardappio**, conectando:

- o mapa funcional do produto
- a navegação real do app
- a separação entre área pública, área autenticada e admin
- os arquivos HTML exportados do Stitch
- a futura implementação em React + TypeScript + React Router

Este arquivo deve orientar o Codex a transformar as telas já criadas visualmente em páginas reais do produto, com rotas consistentes, layouts corretos, guardas de acesso, estados e dependências claras.

---

## 2. Fonte de referência para as telas

A lista de arquivos HTML já exportados do Stitch define a base visual atual do projeto e deve ser usada como referência de origem das páginas. Os arquivos listados incluem landing page, login/signup, onboarding, dashboard, planner semanal, picker de receitas, detalhe de receita, compras, favoritos, histórico, perfil, assinatura, coleções, notificações e telas administrativas. fileciteturn3file0

---

## 3. Regra estrutural obrigatória

A navegação do Cardappio deve ser separada em 3 áreas:

1. **área pública**
2. **área autenticada do usuário**
3. **área administrativa**

Essa separação segue o padrão arquitetural e de dashboard/admin adotado como base do projeto. A área pública é comercial e institucional; a área autenticada é orientada à tarefa; e o admin é operacional e modular. fileciteturn2file5 fileciteturn2file15 fileciteturn2file18

---

## 4. Mapeamento entre HTML do Stitch e páginas reais

## 4.1 Área pública

### Arquivo HTML de origem
- `LandingPage.html`

### Página React sugerida
- `src/pages/public/LandingPage.tsx`

### Rota principal
- `/`

### Rotas secundárias deriváveis da mesma base visual
- `/como-funciona`
- `/planos`
- `/faq`
- `/contato`
- `/quem-somos`
- `/suporte`

### Observação

Mesmo que hoje exista apenas uma landing exportada, o Codex deve estruturar a área pública já preparada para múltiplas páginas institucionais.

---

## 4.2 Autenticação

### Arquivo HTML de origem
- `Login-Signup.html`

### Páginas React sugeridas
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/SignupPage.tsx`

### Rotas
- `/auth/login`
- `/auth/cadastro`
- `/auth/recuperar`
- `/auth/callback`

### Observação

Mesmo que o Stitch tenha unido login e signup em um único HTML, na implementação real vale separar em componentes ou páginas dedicadas, mantendo a coerência do fluxo.

---

## 4.3 Onboarding

### Arquivo HTML de origem
- `Onboarding.html`

### Página React sugerida
- `src/pages/app/OnboardingPage.tsx`

### Rota
- `/app/onboarding`

### Regra

Rota protegida por autenticação e exibida apenas para usuários que ainda não concluíram onboarding.

---

## 4.4 Dashboard do usuário

### Arquivo HTML de origem
- `Dashboard.html`

### Página React sugerida
- `src/pages/app/AppHomePage.tsx`

### Rota
- `/app`

---

## 4.5 Planejamento semanal

### Arquivo HTML de origem
- `WeeklyPlanner.html`

### Páginas React sugeridas
- `src/pages/app/WeeklyPlannerPage.tsx`
- `src/pages/app/WeekDetailPage.tsx`

### Rotas
- `/app/semana/nova`
- `/app/semana/:weekId`
- `/app/semana`

### Observação

A mesma base visual pode servir tanto para criação quanto para edição/visualização da semana.

---

## 4.6 Seleção de receita

### Arquivo HTML de origem
- `RecipePicker.html`

### Página React sugerida
- `src/pages/app/RecipePickerPage.tsx`

### Rotas possíveis
- `/app/receitas`
- `/app/semana/:weekId/selecionar-receita`

### Observação

O Codex pode reaproveitar o mesmo núcleo visual em dois contextos:

- browsing geral da biblioteca
- seleção de receita para um slot específico

---

## 4.7 Detalhe de receita

### Arquivo HTML de origem
- `RecipeDetail.html`

### Página React sugerida
- `src/pages/app/RecipeDetailPage.tsx`

### Rota
- `/app/receitas/:recipeSlug`

---

## 4.8 Lista de compras

### Arquivo HTML de origem
- `ShoppingList.html`

### Página React sugerida
- `src/pages/app/ShoppingListPage.tsx`

### Rotas
- `/app/compras`
- `/app/semana/:weekId/compras`

### Observação

O ideal é o app suportar tanto uma rota geral da lista ativa quanto a lista contextual de uma semana específica.

---

## 4.9 Favoritos

### Arquivo HTML de origem
- `Favorites.html`

### Página React sugerida
- `src/pages/app/FavoritesPage.tsx`

### Rota
- `/app/favoritos`

---

## 4.10 Histórico

### Arquivo HTML de origem
- `History.html`

### Página React sugerida
- `src/pages/app/HistoryPage.tsx`

### Rota
- `/app/historico`

---

## 4.11 Perfil e preferências

### Arquivo HTML de origem
- `ProfilePreferences.html`

### Página React sugerida
- `src/pages/app/ProfilePreferencesPage.tsx`

### Rota
- `/app/perfil`

---

## 4.12 Assinatura / upgrade

### Arquivo HTML de origem
- `UpgradeSubscription.html`

### Página React sugerida
- `src/pages/app/SubscriptionPage.tsx`

### Rota
- `/app/assinatura`

---

## 4.13 Coleções

### Arquivo HTML de origem
- `Collections.html`

### Páginas React sugeridas
- `src/pages/app/CollectionsPage.tsx`
- `src/pages/app/CollectionDetailPage.tsx`

### Rotas
- `/app/colecoes`
- `/app/colecoes/:collectionSlug`

---

## 4.14 Notificações e dicas

### Arquivo HTML de origem
- `NotificationsTips.html`

### Página React sugerida
- `src/pages/app/NotificationsPage.tsx`

### Rota
- `/app/notificacoes`

---

## 4.15 Admin dashboard

### Arquivo HTML de origem
- `AdminGeralDashboard.html`

### Página React sugerida
- `src/pages/admin/AdminDashboardPage.tsx`

### Rota
- `/admin`

---

## 4.16 Admin recipe list

### Arquivo HTML de origem
- `AdminRecipeList.html`

### Página React sugerida
- `src/pages/admin/AdminRecipesPage.tsx`

### Rotas
- `/admin/receitas`
- `/admin/receitas/lista`

---

## 4.17 Admin recipe editor

### Arquivo HTML de origem
- `AdminRecipeEditor.html`

### Página React sugerida
- `src/pages/admin/AdminRecipeEditorPage.tsx`

### Rotas
- `/admin/receitas/nova`
- `/admin/receitas/:id`

---

## 5. Sitemap funcional recomendado

## 5.1 Área pública

- `/`
- `/como-funciona`
- `/planos`
- `/faq`
- `/contato`
- `/quem-somos`
- `/suporte`
- `/auth/login`
- `/auth/cadastro`
- `/auth/recuperar`
- `/auth/callback`

## 5.2 Área autenticada

- `/app`
- `/app/onboarding`
- `/app/semana`
- `/app/semana/nova`
- `/app/semana/:weekId`
- `/app/semana/:weekId/compras`
- `/app/receitas`
- `/app/receitas/:recipeSlug`
- `/app/compras`
- `/app/favoritos`
- `/app/historico`
- `/app/colecoes`
- `/app/colecoes/:collectionSlug`
- `/app/perfil`
- `/app/assinatura`
- `/app/notificacoes`

## 5.3 Área admin

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

---

## 6. Layouts obrigatórios

## 6.1 `PublicLayout`

### Uso
- páginas institucionais e comerciais

### Páginas associadas
- `/`
- `/como-funciona`
- `/planos`
- `/faq`
- `/contato`
- `/quem-somos`
- `/suporte`

### Estrutura esperada
- header público
- conteúdo central por seções
- footer

---

## 6.2 `AuthLayout`

### Uso
- login
- cadastro
- recuperação
- callback

### Páginas associadas
- `/auth/*`

### Estrutura esperada
- layout limpo
- foco na ação principal
- mínima distração

---

## 6.3 `UserLayout`

### Uso
- toda a área autenticada do usuário

### Páginas associadas
- `/app/*`

### Estrutura esperada
- header contextual
- navegação mobile simples
- sidebar leve em desktop
- acesso rápido a semana, compras, favoritos e perfil

Esse layout deve seguir a lógica de dashboard orientado à tarefa, com visual mais acolhedor que o admin e mais funcional que a área pública. fileciteturn2file15

---

## 6.4 `AdminLayout`

### Uso
- toda a área administrativa

### Páginas associadas
- `/admin/*`

### Estrutura esperada
- sidebar densa
- header operacional
- filtros e indicadores no topo quando necessário
- navegação modular

Esse layout deve seguir a lógica do painel admin operacional descrita nas referências anexadas. fileciteturn2file18

---

## 7. Guardas de rota

## 7.1 `PublicOnlyGuard`

### Uso
Opcional para páginas como login/cadastro quando o usuário já estiver autenticado.

### Regra
- se autenticado, redirecionar para `/app`

---

## 7.2 `AuthGuard`

### Uso
Todas as rotas `/app/*`

### Regra
- se não autenticado, redirecionar para `/auth/login`

---

## 7.3 `OnboardingGuard`

### Uso
Rotas do app que exigem onboarding concluído

### Regra
- se autenticado e onboarding não concluído, redirecionar para `/app/onboarding`

---

## 7.4 `AdminGuard`

### Uso
Todas as rotas `/admin/*`

### Regra
- se não for `admin` ou `super_admin`, bloquear acesso

Esse padrão de autenticação obrigatória, autorização por role e proteção backend/frontend segue a base de segurança do projeto. fileciteturn2file6

---

## 8. Estrutura de páginas por área

## 8.1 Área pública

### `LandingPage.tsx`

#### Rota
- `/`

#### Objetivo
Apresentar o Cardappio e converter o visitante.

#### Blocos principais
- hero
- como funciona
- benefícios
- destaque da lista de compras
- teaser de planos
- FAQ curto
- CTA final

#### Dados necessários
- conteúdo estático ou CMS leve
- planos resumidos
- FAQs resumidos

#### Ações
- entrar
- criar conta
- navegar para planos/como funciona

---

### `HowItWorksPage.tsx`

#### Rota
- `/como-funciona`

#### Objetivo
Explicar o fluxo principal do produto.

---

### `PlansPage.tsx`

#### Rota
- `/planos`

#### Objetivo
Comparar free e premium.

#### Dados necessários
- planos ativos
- benefícios por plano

---

### `FaqPage.tsx`

#### Rota
- `/faq`

#### Objetivo
Reduzir dúvidas e fricção.

---

### `SupportPage.tsx`

#### Rotas
- `/contato`
- `/suporte`

#### Objetivo
Canal de contato e suporte.

---

### `AboutPage.tsx`

#### Rota
- `/quem-somos`

#### Objetivo
Apresentar a marca/produto.

---

## 8.2 Autenticação

### `LoginPage.tsx`

#### Rota
- `/auth/login`

#### Objetivo
Permitir entrada no app.

#### Ações
- login
- ir para cadastro
- recuperar acesso

#### Estados
- vazio
- loading
- erro
- sucesso/redirecionamento

---

### `SignupPage.tsx`

#### Rota
- `/auth/cadastro`

#### Objetivo
Permitir criação de conta.

---

### `RecoverAccessPage.tsx`

#### Rota
- `/auth/recuperar`

#### Objetivo
Recuperar acesso por e-mail.

---

### `AuthCallbackPage.tsx`

#### Rota
- `/auth/callback`

#### Objetivo
Finalizar autenticação e redirecionar corretamente.

---

## 8.3 App do usuário

### `OnboardingPage.tsx`

#### Rota
- `/app/onboarding`

#### Objetivo
Coletar preferências iniciais.

#### Dados manipulados
- household_size
- default_meal_modes
- default_plan_days
- dietary_preferences
- dietary_restrictions
- primary_goal

---

### `AppHomePage.tsx`

#### Rota
- `/app`

#### Objetivo
Ser o ponto central de uso recorrente.

#### Blocos principais
- resumo da semana atual
- CTA para montar/editar semana
- atalho para compras
- favoritos
- sugestões/coleções
- dica do dia/semana

#### Dados necessários
- semana ativa do usuário
- resumo da lista de compras
- favoritos resumidos
- notices ativos
- coleções em destaque

---

### `WeeklyPlannerPage.tsx`

#### Rotas
- `/app/semana`
- `/app/semana/nova`

#### Objetivo
Criar ou iniciar o planejamento semanal.

#### Blocos principais
- seletor de dias
- slots almoço/jantar
- seleção/troca/remoção de receitas
- salvar semana

#### Dados necessários
- preferências do usuário
- receitas resumidas
- categorias/tags/filtros

#### Ações
- adicionar receita
- remover receita
- salvar semana
- ir para picker

---

### `WeekDetailPage.tsx`

#### Rota
- `/app/semana/:weekId`

#### Objetivo
Visualizar e editar uma semana existente.

#### Dados necessários
- semana completa
- dias
- slots
- resumo da compra associada

---

### `RecipePickerPage.tsx`

#### Rotas
- `/app/receitas`
- `/app/semana/:weekId/selecionar-receita`

#### Objetivo
Selecionar uma receita para biblioteca geral ou para um slot específico.

#### Blocos principais
- busca
- filtros
- categorias
- coleções
- lista/grid de receitas

#### Dados necessários
- receitas publicadas compatíveis com o plano
- categorias
- tags
- coleções
- favoritos do usuário

---

### `RecipeDetailPage.tsx`

#### Rota
- `/app/receitas/:recipeSlug`

#### Objetivo
Consultar receita detalhada e adicioná-la à semana.

#### Dados necessários
- receita
- ingredientes
- passos
- tags
- coleção/contexto opcional
- estado de favorito

#### Ações
- favoritar
- adicionar ao plano
- voltar ao picker

---

### `ShoppingListPage.tsx`

#### Rotas
- `/app/compras`
- `/app/semana/:weekId/compras`

#### Objetivo
Mostrar a lista de compras ativa ou da semana específica.

#### Dados necessários
- lista de compras
- itens
- estado checked

#### Ações
- marcar item
- remover item
- compartilhar
- imprimir
- reprocessar lista quando permitido

---

### `FavoritesPage.tsx`

#### Rota
- `/app/favoritos`

#### Objetivo
Listar receitas favoritas para reuso.

#### Dados necessários
- favoritos do usuário
- receitas vinculadas

---

### `HistoryPage.tsx`

#### Rota
- `/app/historico`

#### Objetivo
Listar semanas passadas e permitir duplicação/reuso.

#### Dados necessários
- semanas do usuário ordenadas por data

#### Ações
- abrir semana
- duplicar semana
- reutilizar como base

---

### `CollectionsPage.tsx`

#### Rota
- `/app/colecoes`

#### Objetivo
Listar coleções editoriais disponíveis.

#### Dados necessários
- coleções ativas compatíveis com plano

---

### `CollectionDetailPage.tsx`

#### Rota
- `/app/colecoes/:collectionSlug`

#### Objetivo
Exibir receitas da coleção.

---

### `ProfilePreferencesPage.tsx`

#### Rota
- `/app/perfil`

#### Objetivo
Gerir conta e preferências.

#### Dados necessários
- profile
- user_preferences
- notification_preferences
- resumo de assinatura

---

### `SubscriptionPage.tsx`

#### Rota
- `/app/assinatura`

#### Objetivo
Mostrar plano atual e fluxo de upgrade.

#### Dados necessários
- assinatura do usuário
- planos disponíveis
- benefícios comparativos

---

### `NotificationsPage.tsx`

#### Rota
- `/app/notificacoes`

#### Objetivo
Listar notificações e dicas do usuário.

#### Dados necessários
- notifications
- notices ativos quando aplicável

---

## 8.4 Admin

### `AdminDashboardPage.tsx`

#### Rota
- `/admin`

#### Objetivo
Resumo operacional do produto.

#### Blocos principais
- métricas principais
- cards-resumo
- atalhos admin
- alertas operacionais

---

### `AdminRecipesPage.tsx`

#### Rota
- `/admin/receitas`

#### Objetivo
Listar e gerir receitas.

#### Dados necessários
- receitas
- categorias
- status
- filtros

---

### `AdminRecipeEditorPage.tsx`

#### Rotas
- `/admin/receitas/nova`
- `/admin/receitas/:id`

#### Objetivo
Criar e editar receitas.

#### Dados necessários
- receita editada
- categorias
- tags
- coleções

---

### Páginas admin adicionais obrigatórias

Mesmo sem HTML pronto do Stitch, o Codex deve criar estrutura para:

- `AdminCategoriesPage.tsx` → `/admin/categorias`
- `AdminTagsPage.tsx` → `/admin/tags`
- `AdminCollectionsPage.tsx` → `/admin/colecoes`
- `AdminNoticesPage.tsx` → `/admin/dicas-alertas`
- `AdminNotificationsPage.tsx` → `/admin/notificacoes`
- `AdminUsersPage.tsx` → `/admin/usuarios`
- `AdminPlansPage.tsx` → `/admin/planos`
- `AdminSubscriptionsPage.tsx` → `/admin/assinaturas`
- `AdminSettingsPage.tsx` → `/admin/configuracoes`
- `AdminReportsPage.tsx` → `/admin/relatorios`
- `AdminLogsPage.tsx` → `/admin/logs`

Essas páginas fazem parte da estrutura administrativa prevista, mesmo que ainda não tenham sido desenhadas no Stitch.

---

## 9. Dependências entre páginas

## 9.1 Fluxo principal do usuário

`LandingPage` → `Login/Signup` → `Onboarding` → `AppHome` → `WeeklyPlanner` → `RecipePicker` → `RecipeDetail` → `WeekDetail` → `ShoppingList`

## 9.2 Fluxo recorrente

`AppHome` → `WeekDetail` → `ShoppingList` → `History` → `WeekDetail`

## 9.3 Fluxo premium

`AppHome` ou bloqueio contextual → `SubscriptionPage` → checkout/backend de assinatura

## 9.4 Fluxo admin

`AdminDashboard` → `AdminRecipes` → `AdminRecipeEditor`

---

## 10. Estados obrigatórios por página

Toda página deve prever:

- loading
- empty
- error
- success quando aplicável
- blocked/permission state quando aplicável

### Exemplos importantes

- `AppHome`: semana vazia
- `WeeklyPlanner`: planner vazio/parcial/completo
- `RecipePicker`: sem resultados
- `ShoppingList`: lista vazia/todos marcados
- `Favorites`: sem favoritos
- `History`: sem histórico
- `AdminRecipes`: sem receitas / filtro vazio

---

## 11. Estratégia de migração dos HTML do Stitch

Os arquivos HTML exportados do Stitch devem ser usados como **referência visual**, não como estrutura final do app.

### Regra prática para o Codex

1. identificar o HTML de origem da tela
2. recriar a página em React/TypeScript
3. extrair componentes reutilizáveis
4. ligar a página ao layout correto
5. conectar com dados reais
6. aplicar guardas e estados

### Não fazer

- colar HTML estático bruto sem componentização
- manter naming inconsistente vindo do export
- misturar layouts públicos e privados

---

## 12. Estrutura recomendada de arquivos de páginas

```txt
src/pages/
  public/
    LandingPage.tsx
    HowItWorksPage.tsx
    PlansPage.tsx
    FaqPage.tsx
    ContactPage.tsx
    AboutPage.tsx
    SupportPage.tsx
  auth/
    LoginPage.tsx
    SignupPage.tsx
    RecoverAccessPage.tsx
    AuthCallbackPage.tsx
  app/
    OnboardingPage.tsx
    AppHomePage.tsx
    WeeklyPlannerPage.tsx
    WeekDetailPage.tsx
    RecipePickerPage.tsx
    RecipeDetailPage.tsx
    ShoppingListPage.tsx
    FavoritesPage.tsx
    HistoryPage.tsx
    CollectionsPage.tsx
    CollectionDetailPage.tsx
    ProfilePreferencesPage.tsx
    SubscriptionPage.tsx
    NotificationsPage.tsx
  admin/
    AdminDashboardPage.tsx
    AdminRecipesPage.tsx
    AdminRecipeEditorPage.tsx
    AdminCategoriesPage.tsx
    AdminTagsPage.tsx
    AdminCollectionsPage.tsx
    AdminNoticesPage.tsx
    AdminNotificationsPage.tsx
    AdminUsersPage.tsx
    AdminPlansPage.tsx
    AdminSubscriptionsPage.tsx
    AdminSettingsPage.tsx
    AdminReportsPage.tsx
    AdminLogsPage.tsx
```

---

## 13. Prioridade de implementação das páginas

## P1 — núcleo

- LandingPage
- LoginPage
- SignupPage
- OnboardingPage
- AppHomePage
- WeeklyPlannerPage
- RecipePickerPage
- RecipeDetailPage
- WeekDetailPage
- ShoppingListPage

## P2 — retenção e monetização

- FavoritesPage
- HistoryPage
- ProfilePreferencesPage
- SubscriptionPage
- CollectionsPage
- CollectionDetailPage
- NotificationsPage
- PlansPage
- FaqPage

## P3 — admin e expansão

- AdminDashboardPage
- AdminRecipesPage
- AdminRecipeEditorPage
- demais páginas admin
- páginas institucionais secundárias

---

## 14. Resultado esperado

Ao seguir este arquivo, o Codex deve conseguir:

- mapear os HTMLs do Stitch para páginas reais do app
- estruturar corretamente o roteamento
- separar área pública, app e admin
- aplicar guardas e layouts corretos
- evitar improviso de navegação
- preparar o frontend para integração real com dados, autenticação e regras de negócio
