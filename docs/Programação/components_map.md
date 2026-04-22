# COMPONENTS_MAP.md — Cardappio

## 1. Objetivo do documento

Este documento define o **mapa de componentização do frontend do Cardappio**, conectando:

- páginas
- blocos visuais vindos do Stitch
- componentes reutilizáveis
- componentes por domínio
- componentes administrativos
- componentes de layout e shell

A meta é orientar o Codex a **não copiar HTML tela por tela**, mas sim extrair uma biblioteca consistente de componentes reutilizáveis.

Esse arquivo complementa diretamente:

- `DESIGN.md`
- `SCREENS.md`
- `ROUTES_AND_PAGES.md`
- `CODEX_CARDAPPIO_APP_SPEC.md`

---

## 2. Princípio central

Os HTMLs exportados do Stitch devem ser tratados como:

- **referência visual de blocos**
- **referência de composição**
- **referência de hierarquia visual**

Eles **não devem** ser mantidos como páginas estáticas isoladas dentro do produto final.

A implementação real deve seguir esta ordem:

1. identificar blocos repetidos
2. extrair componentes base
3. extrair componentes de domínio
4. montar páginas a partir desses componentes
5. conectar dados reais
6. aplicar estados e permissões

---

## 3. Estratégia de componentização

A componentização do Cardappio deve ser dividida em 5 camadas:

1. **layout e shell**
2. **ui base**
3. **componentes compartilhados de produto**
4. **componentes por domínio**
5. **componentes administrativos**

---

## 4. Estrutura recomendada de pastas

```txt
src/components/
  ui/
  layout/
  shared/
  public/
  dashboard/
  planning/
  recipes/
  shopping/
  favorites/
  history/
  collections/
  subscriptions/
  notifications/
  admin/
```

---

## 5. Camada 1 — Layout e shell

Esses componentes sustentam a estrutura geral do app.

## 5.1 `PublicHeader`

### Onde usar
- landing
- como funciona
- planos
- FAQ
- contato
- suporte

### Responsabilidade
- logo
- navegação pública
- CTA de login/cadastro

---

## 5.2 `PublicFooter`

### Onde usar
- todas as páginas públicas

### Responsabilidade
- links institucionais
- suporte
- termos/políticas
- branding leve

---

## 5.3 `PublicHero`

### Onde usar
- landing page

### Responsabilidade
- headline principal
- subtítulo
- CTA principal e secundário
- mockup/preview do app

---

## 5.4 `AppShell`

### Onde usar
- toda a área `/app/*`

### Responsabilidade
- estrutura base do dashboard do usuário
- header contextual
- navegação mobile
- sidebar leve desktop
- container principal

---

## 5.5 `AdminShell`

### Onde usar
- toda a área `/admin/*`

### Responsabilidade
- sidebar admin
- header operacional
- área de conteúdo admin

---

## 5.6 `MobileBottomNav`

### Onde usar
- área autenticada do usuário

### Itens sugeridos
- início
- semana
- compras
- favoritos
- perfil

---

## 5.7 `DesktopSidebar`

### Onde usar
- área autenticada desktop

### Responsabilidade
- navegação persistente do usuário

---

## 5.8 `AdminSidebar`

### Onde usar
- admin desktop

### Responsabilidade
- navegação densa por módulos

---

## 5.9 `PageHeader`

### Onde usar
- praticamente todas as páginas internas

### Responsabilidade
- título
- subtítulo curto
- ações principais da página

---

## 6. Camada 2 — UI base

Esses componentes devem ser altamente reutilizáveis e pouco acoplados ao domínio.

## 6.1 Componentes básicos

- `Section`
- `PageContainer`
- `Card`
- `CardHeader`
- `CardContent`
- `CardFooter`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `SuccessState`
- `Badge`
- `Chip`
- `FilterChip`
- `IconButton`
- `ActionButton`
- `PrimaryButton`
- `SecondaryButton`
- `DangerButton`
- `SearchInput`
- `FormField`
- `SelectField`
- `TextareaField`
- `CheckboxRow`
- `ToggleRow`
- `Tabs`
- `Dialog`
- `Drawer`
- `Toast`

### Regra

Esses componentes não devem conter regra de domínio do Cardappio.

---

## 7. Camada 3 — Componentes compartilhados de produto

São componentes que aparecem em múltiplos contextos do app e já carregam semântica do produto.

## 7.1 `WeekSummaryCard`

### Uso
- dashboard
- week detail
- histórico

### Responsabilidade
- resumir uma semana planejada

### Conteúdo típico
- período
- quantidade de refeições
- status da semana
- CTA de abrir/editar

---

## 7.2 `QuickActionCard`

### Uso
- dashboard
- páginas de entrada de módulo

### Responsabilidade
- apresentar atalhos importantes

Exemplos:
- montar semana
- abrir compras
- ver favoritos

---

## 7.3 `InfoBanner`

### Uso
- dashboard
- assinatura
- coleções
- notificações

### Responsabilidade
- avisos suaves
- dicas rápidas
- promoção premium discreta

---

## 7.4 `SectionTitle`

### Uso
- várias páginas

### Responsabilidade
- padronizar títulos de blocos internos

---

## 7.5 `PremiumLockCard`

### Uso
- coleções premium
- filtros premium
- assinatura

### Responsabilidade
- comunicar bloqueio premium com elegância

---

## 8. Camada 4 — Componentes por domínio

---

## 8.1 Domínio: onboarding

### `OnboardingStepCard`

#### Uso
- onboarding

#### Responsabilidade
- encapsular uma etapa do fluxo

#### Conteúdo típico
- pergunta
- opções selecionáveis
- navegação próxima/anterior

### `SelectableOptionCard`

#### Uso
- onboarding
- seleção de objetivos
- preferências

#### Responsabilidade
- representar opção clicável em formato visual amigável

---

## 8.2 Domínio: dashboard

### `CurrentWeekHero`

#### Uso
- AppHome

#### Responsabilidade
- destacar o estado atual da semana
- CTA principal do dashboard

### `DashboardFavoritesPreview`

#### Uso
- AppHome

#### Responsabilidade
- mostrar poucas favoritas como preview

### `DashboardCollectionsPreview`

#### Uso
- AppHome

#### Responsabilidade
- mostrar coleções/sugestões em destaque

### `DashboardShoppingPreview`

#### Uso
- AppHome

#### Responsabilidade
- mostrar estado resumido da lista de compras atual

---

## 8.3 Domínio: planejamento semanal

### `DayPlannerCard`

#### Uso
- WeeklyPlanner
- WeekDetail

#### Responsabilidade
- representar um dia da semana com slots

### `MealSlotCard`

#### Uso
- WeeklyPlanner
- WeekDetail

#### Responsabilidade
- mostrar slot de almoço ou jantar
- suportar estado vazio e preenchido

#### Ações típicas
- adicionar receita
- trocar receita
- remover receita

### `MealSlotEmptyState`

#### Uso
- dentro do `MealSlotCard`

#### Responsabilidade
- estado vazio claro para adicionar receita

### `SelectedRecipeMiniCard`

#### Uso
- dentro do `MealSlotCard`

#### Responsabilidade
- mostrar resumo da receita selecionada

### `WeekPlannerToolbar`

#### Uso
- WeeklyPlanner
- WeekDetail

#### Responsabilidade
- ações globais da semana

Exemplos:
- salvar
- revisar compras
- duplicar semana (futuro)

### `DaySelectorBar`

#### Uso
- WeeklyPlanner

#### Responsabilidade
- navegação rápida entre dias ou resumo de dias ativos

---

## 8.4 Domínio: receitas

### `RecipeCard`

#### Uso
- picker
- favoritos
- coleções
- dashboard preview

#### Responsabilidade
- card principal de receita

#### Conteúdo típico
- imagem
- título
- tempo
- dificuldade
- custo
- tags principais

### `RecipeGrid`

#### Uso
- picker
- favoritos
- coleções

#### Responsabilidade
- organizar receitas em grid/list responsivo

### `RecipeFiltersBar`

#### Uso
- picker
- receitas geral

#### Responsabilidade
- busca
- filtros rápidos
- categorias
- tags

### `RecipeMetaBadges`

#### Uso
- recipe card
- recipe detail

#### Responsabilidade
- exibir tempo, dificuldade, custo, porções

### `FavoriteButton`

#### Uso
- recipe cards
- recipe detail

#### Responsabilidade
- favoritar/desfavoritar receita

### `RecipeIngredientsList`

#### Uso
- recipe detail

#### Responsabilidade
- exibir ingredientes em leitura clara

### `RecipeStepsList`

#### Uso
- recipe detail

#### Responsabilidade
- exibir preparo em passos

### `RecipeContextChips`

#### Uso
- recipe detail
- recipe card

#### Responsabilidade
- mostrar contexto de uso da receita

---

## 8.5 Domínio: compras

### `ShoppingListSummaryCard`

#### Uso
- dashboard
- shopping page

#### Responsabilidade
- resumir estado da lista de compras

### `ShoppingChecklistGroup`

#### Uso
- shopping page

#### Responsabilidade
- agrupar itens por seção lógica

### `ShoppingChecklistItem`

#### Uso
- shopping page

#### Responsabilidade
- representar item individual com checkbox

### `ShoppingActionsBar`

#### Uso
- shopping page

#### Responsabilidade
- compartilhar
- imprimir
- limpar filtros
- reprocessar lista quando aplicável

### `ShoppingProgressBar`

#### Uso
- shopping page

#### Responsabilidade
- mostrar progresso de itens marcados

---

## 8.6 Domínio: favoritos

### `FavoritesGrid`

#### Uso
- FavoritesPage

#### Responsabilidade
- listar favoritas do usuário

### `FavoriteEmptyState`

#### Uso
- FavoritesPage

#### Responsabilidade
- estado vazio amigável

---

## 8.7 Domínio: histórico

### `HistoryWeekCard`

#### Uso
- HistoryPage

#### Responsabilidade
- representar uma semana passada com ações rápidas

### `HistoryList`

#### Uso
- HistoryPage

#### Responsabilidade
- organizar cards de histórico

---

## 8.8 Domínio: coleções

### `CollectionCard`

#### Uso
- CollectionsPage
- dashboard preview

#### Responsabilidade
- representar coleção editorial

### `CollectionHero`

#### Uso
- CollectionDetailPage

#### Responsabilidade
- cabeçalho visual da coleção

### `CollectionRecipeGrid`

#### Uso
- CollectionDetailPage

#### Responsabilidade
- listar receitas da coleção

---

## 8.9 Domínio: assinatura

### `PlanCard`

#### Uso
- PlansPage
- SubscriptionPage

#### Responsabilidade
- representar plano individual

### `PlansComparisonTable`

#### Uso
- PlansPage
- SubscriptionPage

#### Responsabilidade
- comparar recursos entre planos

### `CurrentPlanSummary`

#### Uso
- SubscriptionPage
- ProfilePreferencesPage

#### Responsabilidade
- mostrar plano atual e status

### `UpgradeCTASection`

#### Uso
- SubscriptionPage
- contextos premium bloqueados

#### Responsabilidade
- conduzir upgrade

---

## 8.10 Domínio: notificações

### `NotificationList`

#### Uso
- NotificationsPage

#### Responsabilidade
- listar notificações do usuário

### `NotificationItem`

#### Uso
- NotificationsPage

#### Responsabilidade
- item individual de notificação

### `TipsFeedCard`

#### Uso
- dashboard
- notifications page

#### Responsabilidade
- exibir dica/editorial notice leve

---

## 9. Camada 5 — Componentes administrativos

Esses componentes devem ficar isolados da área do usuário.

## 9.1 Componentes estruturais admin

### `AdminPageHeader`

#### Uso
- todas as páginas admin

#### Responsabilidade
- título
- descrição
- ação principal

### `AdminMetricCard`

#### Uso
- AdminDashboard
- relatórios

#### Responsabilidade
- exibir indicador resumido

### `AdminFiltersBar`

#### Uso
- listagens admin

#### Responsabilidade
- busca
- filtros
- ordenação

### `AdminDataTable`

#### Uso
- receitas
- usuários
- assinaturas
- logs

#### Responsabilidade
- listagem operacional reutilizável

---

## 9.2 Componentes admin de domínio

### `AdminRecipeTable`

#### Uso
- AdminRecipesPage

#### Responsabilidade
- listar receitas com ações

### `RecipeEditorForm`

#### Uso
- AdminRecipeEditorPage

#### Responsabilidade
- criação/edição de receita

### `CategoryManagerPanel`

#### Uso
- AdminCategoriesPage

#### Responsabilidade
- CRUD de categorias

### `TagManagerPanel`

#### Uso
- AdminTagsPage

#### Responsabilidade
- CRUD de tags

### `CollectionManagerPanel`

#### Uso
- AdminCollectionsPage

#### Responsabilidade
- CRUD de coleções

### `EditorialNoticeManager`

#### Uso
- AdminNoticesPage

#### Responsabilidade
- CRUD de dicas e alertas

### `PlansManagerPanel`

#### Uso
- AdminPlansPage

#### Responsabilidade
- gestão de planos

### `SubscriptionsTable`

#### Uso
- AdminSubscriptionsPage

#### Responsabilidade
- visão operacional de assinaturas

### `AuditLogsTable`

#### Uso
- AdminLogsPage

#### Responsabilidade
- rastreabilidade operacional

---

## 10. Mapeamento página → componentes

## 10.1 LandingPage

### Componentes principais
- `PublicHeader`
- `PublicHero`
- `SectionTitle`
- `QuickActionCard` adaptado para benefícios, se útil
- `PlanCard`
- `PublicFooter`

---

## 10.2 Login / Signup

### Componentes principais
- `PageContainer`
- `Card`
- `FormField`
- `PrimaryButton`
- `SecondaryButton`

---

## 10.3 OnboardingPage

### Componentes principais
- `OnboardingStepCard`
- `SelectableOptionCard`
- `PrimaryButton`
- `SecondaryButton`

---

## 10.4 AppHomePage

### Componentes principais
- `AppShell`
- `PageHeader`
- `CurrentWeekHero`
- `DashboardShoppingPreview`
- `DashboardFavoritesPreview`
- `DashboardCollectionsPreview`
- `TipsFeedCard`
- `QuickActionCard`

---

## 10.5 WeeklyPlannerPage / WeekDetailPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `DaySelectorBar`
- `WeekPlannerToolbar`
- `DayPlannerCard`
- `MealSlotCard`
- `SelectedRecipeMiniCard`
- `MealSlotEmptyState`

---

## 10.6 RecipePickerPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `RecipeFiltersBar`
- `RecipeGrid`
- `RecipeCard`
- `EmptyState`

---

## 10.7 RecipeDetailPage

### Componentes principais
- `AppShell`
- `PageHeader` ou hero de receita
- `RecipeMetaBadges`
- `FavoriteButton`
- `RecipeIngredientsList`
- `RecipeStepsList`
- `RecipeContextChips`
- `PrimaryButton`

---

## 10.8 ShoppingListPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `ShoppingListSummaryCard`
- `ShoppingProgressBar`
- `ShoppingChecklistGroup`
- `ShoppingChecklistItem`
- `ShoppingActionsBar`

---

## 10.9 FavoritesPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `FavoritesGrid`
- `RecipeCard`
- `FavoriteEmptyState`

---

## 10.10 HistoryPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `HistoryList`
- `HistoryWeekCard`

---

## 10.11 CollectionsPage / CollectionDetailPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `CollectionCard`
- `CollectionHero`
- `CollectionRecipeGrid`
- `RecipeCard`

---

## 10.12 ProfilePreferencesPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `Card`
- `FormField`
- `SelectField`
- `ToggleRow`
- `CurrentPlanSummary`

---

## 10.13 SubscriptionPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `CurrentPlanSummary`
- `PlanCard`
- `PlansComparisonTable`
- `UpgradeCTASection`
- `PremiumLockCard`

---

## 10.14 NotificationsPage

### Componentes principais
- `AppShell`
- `PageHeader`
- `NotificationList`
- `NotificationItem`
- `TipsFeedCard`

---

## 10.15 AdminDashboardPage

### Componentes principais
- `AdminShell`
- `AdminPageHeader`
- `AdminMetricCard`
- `InfoBanner`

---

## 10.16 AdminRecipesPage

### Componentes principais
- `AdminShell`
- `AdminPageHeader`
- `AdminFiltersBar`
- `AdminRecipeTable`

---

## 10.17 AdminRecipeEditorPage

### Componentes principais
- `AdminShell`
- `AdminPageHeader`
- `RecipeEditorForm`

---

## 11. Blocos do Stitch que provavelmente viram componentes globais

Ao converter os HTMLs, o Codex deve identificar e extrair como componente reutilizável tudo que aparecer repetidamente, como:

- cards de receita
- badges de metadata
- blocos de CTA
- cards de resumo
- filtros visuais
- listas com checkbox
- blocos de dia da semana
- banners de informação
- cabeçalhos de seção
- cards de plano
- listas admin com filtros

---

## 12. O que não deve virar componente global cedo demais

Evitar abstração precoce de blocos muito específicos e pouco repetidos.

Exemplos:
- hero muito específico da landing
- bloco promocional único
- formulário admin extremamente específico antes de estabilizar uso

Regra:

Se ainda não repetiu ou não ficou claro que vai repetir, manter local à página ou ao domínio.

---

## 13. Ordem recomendada de extração de componentes

## Fase 1 — base

- layouts e shells
- UI base
- `PageHeader`
- estados globais

## Fase 2 — fluxo principal

- `RecipeCard`
- `RecipeFiltersBar`
- `MealSlotCard`
- `DayPlannerCard`
- `ShoppingChecklistItem`
- `WeekSummaryCard`

## Fase 3 — retenção e assinatura

- `HistoryWeekCard`
- `CollectionCard`
- `PlanCard`
- `CurrentPlanSummary`
- `NotificationItem`

## Fase 4 — admin

- `AdminPageHeader`
- `AdminFiltersBar`
- `AdminDataTable`
- `RecipeEditorForm`

---

## 14. Regras de qualidade de componentização

O frontend estará bem componentizado quando:

- não houver repetição excessiva de HTML/JSX
- componentes base forem realmente reutilizáveis
- componentes de domínio não misturarem múltiplos contextos sem necessidade
- admin estiver isolado do app do usuário
- páginas forem composição de componentes e não blocos gigantes únicos
- estados vazios/loading/erro forem consistentes

---

## 15. Anti-padrões proibidos

Não fazer:

- copiar o HTML inteiro de cada tela para uma página única sem extração
- componente gigante que faz tudo da página
- componente admin reutilizado no app do usuário sem necessidade
- componente de domínio altamente acoplado usado como UI base
- abstração prematura demais sem repetição real
- múltiplas variações quase iguais de `RecipeCard` sem estratégia clara

---

## 16. Resultado esperado

Ao seguir este documento, o Codex deve conseguir transformar as telas do Stitch em um frontend real que seja:

- consistente
- reutilizável
- escalável
- fácil de manter
- fiel à identidade visual criada
- preparado para integração com dados reais e regras de negócio
