# Cardappio — Mapeamento Detalhado das Funcionalidades e Estrutura Técnica (V1.0)

Este documento descreve detalhadamente a infraestrutura física de arquivos, o esquema do banco de dados (esquema relacional, triggers e RLS), as Edge Functions serverless, a árvore de navegação e componentes React, além da lógica operacional e de negócios da plataforma **Cardappio**.

---

## 1. Arquitetura Geral & Pilha Tecnológica (Tech Stack)

A plataforma segue um modelo descentralizado de alta performance, projetado sob os conceitos de PWA (Progressive Web App) mobile-first e computação sem servidor (Serverless):

*   **Apresentação e Cliente (Frontend):**
    *   **SPA:** React 18+ executado sobre o Vite (bundler ultra-rápido).
    *   **Tipagem Estática:** TypeScript para proteção de tipos em tempo de compilação.
    *   **Design System:** Tailwind CSS e variáveis CSS HSL customizadas para um visual moderno e premium (incluindo cores adaptadas, transições suaves de estado e suporte a temas/glassmorfismo).
    *   **Biblioteca de Componentes:** Componentes acessíveis do Radix UI envelopados pelo shadcn/ui.
    *   **Estado Assíncrono:** TanStack React Query (v5) para gerenciamento de chamadas de rede com políticas otimizadas de cache e invalidação.
    *   **Notificações Flutuantes:** Toasts dinâmicos com Sonner.
    *   **Roteador do Cliente:** React Router DOM v6 com suporte a layouts aninhados e guardas de rota (*Guards*).

*   **Infraestrutura e Lógica (Backend & DB):**
    *   **Serviços Integrados:** Supabase Auth (controle de sessões e autenticação).
    *   **Banco de Dados:** PostgreSQL hospedado com controle de esquema via migrations versionadas.
    *   **Segurança Física:** Row Level Security (RLS) habilitado em 100% das tabelas privadas do banco.
    *   **Backend Serverless:** Supabase Edge Functions escritas em TypeScript rodando em Deno Runtime para processos sensíveis, isolando segredos e tokens contra exposição no cliente.
    *   **Storage de Mídia:** Balde (Bucket) no Supabase Storage para armazenar avatares de perfis e capas de receitas.

---

## 2. Estrutura Física de Diretórios (Codebase Map)

A organização das pastas separa as responsabilidades de interface, lógica de negócio local, integrações e banco de dados:

```text
cardappio/
├── docs/                             # Documentação técnica e de design
│   ├── Programação/                  # Especificação de rotas, banco, APIs e handoffs
│   ├── Reports/                      # Relatórios de auditoria e entregas
│   └── Visual/                       # Telas de referência HTML e design system
├── public/                           # Assets estáticos, ícones e manifest.json do PWA
├── src/                              # Código-fonte da aplicação React
│   ├── App.tsx                       # Componente raiz que monta os provedores globais e o roteador
│   ├── index.css                     # Configuração do Tailwind CSS e tokens do design system
│   ├── main.tsx                      # Ponto de entrada de renderização do React na DOM
│   ├── app/                          # Arquitetura de controle de rotas
│   │   ├── guards/                   # Guardas de proteção de rotas (Auth, Admin, Onboarding)
│   │   ├── providers/                # Provedores de contexto React (Auth, QueryClient)
│   │   └── router/                   # Arquivo index.tsx contendo a definição da árvore de rotas
│   ├── components/                   # Componentes organizados por domínio
│   │   ├── admin/                    # Componentes específicos de painéis administrativos
│   │   ├── layout/                   # Layouts estruturais (Headers, Footers, Sidebars, BottomNavs)
│   │   ├── planning/                 # Componentes do planejador (DayPlannerCard, MealSlotCard)
│   │   ├── recipes/                  # Componentes do catálogo (RecipeCard, RecipeHero, etc.)
│   │   ├── shared/                   # Componentes universais (SEO, LoadingState, ErrorState, Logo)
│   │   ├── shopping/                 # Componentes da lista de compras (ShoppingChecklistItem)
│   │   └── ui/                       # Primitivos visuais do shadcn/ui (Button, Dialog, Input, etc.)
│   ├── config/                       # Constantes e variáveis de ambiente
│   ├── domains/                      # Tipagens de dados organizadas por domínio de negócio
│   ├── hooks/                        # Custom Hooks para abstrair chamadas do Supabase
│   ├── integrations/                 # Cliente instanciado do Supabase
│   └── pages/                        # Páginas/Views associadas a rotas
│       ├── admin/                    # Páginas do painel operacional do administrador (14 páginas)
│       ├── app/                      # Páginas da aplicação do usuário final (13 páginas)
│       ├── auth/                     # Páginas de login, cadastro, recuperação e callback (4 páginas)
│       └── public/                   # Páginas públicas/comerciais (6 páginas)
├── supabase/                         # Configuração e código do servidor backend
│   ├── functions/                    # Edge Functions (Deno/TypeScript)
│   │   ├── _shared/                  # Códigos utilitários reutilizados pelas Edge Functions
│   │   ├── admin-reports/            # Geração de estatísticas consolidadas para admin
│   │   ├── admin-users/              # Manipulação administrativa de roles e permissões de usuários
│   │   ├── create-checkout-session/  # Integração com gateway para checkout de assinatura
│   │   ├── dispatch-notifications/   # Fila de despacho de e-mails/alertas
│   │   ├── generate-share-link/      # Geração de tokens temporários de compartilhamento
│   │   ├── rebuild-shopping-list/    # Consolidação matemática e categórica da lista de compras
│   │   ├── send-magic-link/          # Envio de login por link mágico
│   │   └── subscription-webhook/     # Recebimento de notificações de pagamento
│   └── migrations/                   # Arquivos SQL de migração estrutural
└── vite.config.ts                    # Configurações do Vite e plugin PWA (service worker)
```

---

## 3. Estrutura do Banco de Dados (Detalhamento de Migrations)

A base PostgreSQL do Cardappio possui 15 migrações executadas que definem o ecossistema relacional e garantem segurança de dados:

### 3.1 Tabelas e Domínios Relacionais

*   **`profiles` (Identidade e Contas):**
    *   Vinculada diretamente ao `auth.users` do Supabase.
    *   Campos: `id (UUID, PK)`, `email (TEXT)`, `full_name (TEXT)`, `avatar_url (TEXT)`, `role (TEXT)` (`user`, `admin`), `status (TEXT)`, `onboarding_completed_at (TIMESTAMPTZ)`, `created_at`, `updated_at`.
*   **`user_preferences` (Preferências Alimentares):**
    *   Guarda as escolhas do onboarding.
    *   Campos: `id (UUID, PK)`, `user_id (UUID, FK profiles)`, `household_size (INTEGER)`, `default_meal_modes (TEXT[] / JSONB)`, `default_plan_days (INTEGER)`, `dietary_restrictions (TEXT[])`, `dietary_preferences (TEXT[])`, `primary_goal (TEXT)`.
*   **`recipes` (Catálogo Culinário):**
    *   Armazena as receitas cadastradas na plataforma.
    *   Campos: `id (UUID, PK)`, `title (TEXT)`, `slug (TEXT, Unique)`, `subtitle (TEXT)`, `cover_image_url (TEXT)`, `difficulty_level (TEXT)`, `cost_level (TEXT)`, `prep_time_minutes (INTEGER)`, `servings (INTEGER)`, `category_id (UUID, FK)`, `usage_context (TEXT)`, `is_featured (BOOLEAN)`, `is_premium (BOOLEAN)`, `status (TEXT)` (`draft`, `published`, `archived`), `published_at`, `created_at`, `updated_at`.
*   **`recipe_ingredients` (Ingredientes de Receitas):**
    *   Tabela filha de receitas para estruturar ingredientes individuais.
    *   Campos: `id (UUID, PK)`, `recipe_id (UUID, FK recipes)`, `name (TEXT)`, `quantity_label (TEXT)` (ex: "200g"), `normalized_name (TEXT)` (para consolidação matemática na lista), `sort_order (INTEGER)`, `is_optional (BOOLEAN)`.
*   **`recipe_steps` (Passo a Passo de Preparo):**
    *   Instruções ordenadas das receitas.
    *   Campos: `id (UUID, PK)`, `recipe_id (UUID, FK recipes)`, `step_number (INTEGER)`, `content (TEXT)`.
*   **`recipe_categories` & `recipe_tags` (Taxonomias):**
    *   Classificações temáticas.
    *   Tabela `recipe_tag_links` relaciona receitas a tags (`many-to-many`).
*   **`meal_plan_weeks` (Planejamento Semanal):**
    *   Cabeçalho de um planejamento semanal.
    *   Campos: `id (UUID, PK)`, `user_id (UUID, FK profiles)`, `title (TEXT)`, `week_start_date (DATE)`, `week_end_date (DATE)`, `status (TEXT)` (`active`, `archived`), `source_week_id (UUID)`.
*   **`meal_plan_days` (Dias Planejados):**
    *   Vincula os dias da semana a um plano principal.
    *   Campos: `id (UUID, PK)`, `week_id (UUID, FK meal_plan_weeks)`, `day_of_week (INTEGER)`, `date_reference (DATE)`.
*   **`meal_plan_slots` (Refeições por Dia):**
    *   Slots de refeições programadas (ex: almoço, jantar).
    *   Campos: `id (UUID, PK)`, `day_id (UUID, FK meal_plan_days)`, `meal_type (TEXT)` (`lunch`, `dinner`), `recipe_id (UUID, FK recipes)`.
*   **`shopping_lists` (Lista de Compras Ativa):**
    *   Referência de lista de compras da semana.
    *   Campos: `id (UUID, PK)`, `user_id (UUID, FK profiles)`, `week_id (UUID, FK meal_plan_weeks)`, `status (TEXT)` (`active`, `archived`).
*   **`shopping_list_items` (Itens de Compras):**
    *   Ingredientes consolidados na lista.
    *   Campos: `id (UUID, PK)`, `shopping_list_id (UUID, FK shopping_lists)`, `ingredient_label (TEXT)`, `normalized_name (TEXT)`, `quantity_label (TEXT)`, `source_recipe_count (INTEGER)`, `is_checked (BOOLEAN)`.
*   **`favorite_recipes` (Favoritos):**
    *   Relação `user_id` <-> `recipe_id` para marcar receitas salvas.
*   **`recipe_collections` & `recipe_collection_items` (Conteúdo Editorial):**
    *   Pastas/Coleções criadas por administradores (públicas) ou usuários (privadas) para agrupar receitas.
*   **`user_subscriptions` & `plans` (Financeiro & Monetização):**
    *   Controla planos e status de assinaturas (`premium`, `free`), controlando os prazos de expiração (`subscription_until`).
*   **`editorial_notices` (Avisos e Dicas):**
    *   Informativos cadastrados pelo admin para exibição na home do usuário.

### 3.2 Triggers Automatizados no PostgreSQL
*   **`update_updated_at_column`:** Função executada em triggers `BEFORE UPDATE` para atualizar o campo `updated_at` automaticamente em todas as tabelas principais.
*   **`on_auth_user_created`:** Trigger acionada assim que um novo registro entra na tabela de autenticação nativa do Supabase (`auth.users`), inserindo imediatamente o correspondente na tabela `public.profiles` e criando automaticamente as preferências em `public.user_preferences` com valores default.

### 3.3 Row Level Security (RLS) e Políticas
1.  **Isolamento de Usuário:** Tabelas como `user_preferences`, `meal_plan_weeks`, `shopping_lists` e `favorite_recipes` possuem regras estritas que comparam `auth.uid() = user_id` para qualquer operação de leitura, atualização ou exclusão.
2.  **Políticas de Administração:** Usuários que possuem `role = 'admin'` em seu perfil têm permissão explícita para contornar restrições RLS, permitindo ler e escrever em todas as tabelas.
3.  **Acesso Público Limitado:** Tabelas como `recipes` (apenas com `status = 'published'`), `recipe_categories`, `recipe_tags` e `editorial_notices` possuem políticas de leitura pública liberadas para todos os usuários autenticados, enquanto a gravação é bloqueada para qualquer um que não seja admin.

---

## 4. Estrutura do Frontend (Layouts, Páginas e Guards)

O ecossistema React Router é dividido em 4 layouts estruturais protegidos por barreiras lógicas (*guards*):

### 4.1 Layouts de Apresentação
*   **`PublicLayout` (`/`):** Contém cabeçalho e rodapé comerciais, projetado para páginas institucionais com ênfase em SEO técnico e chamadas para conversão de planos.
*   **`AuthLayout` (`/auth/*`):** Design minimalista sem distrações externas, focado em formulários rápidos (Login, Cadastro e Recuperação).
*   **`UserLayout` (`/app/*`):** Menu inferior fixo (*Mobile Bottom Nav*) e cabeçalho tátil com acesso fácil às ações de planejamento, compras e favoritos. Projetado especificamente para uso mobile-first.
*   **`AdminLayout` (`/admin/*`):** Painel operacional robusto com menu lateral denso (*Sidebar*), filtros avançados de busca, listagens de dados em tabela e botões de controle de recursos.

### 4.2 Guardas de Acesso (Guards)
*   **`AuthGuard`:** Valida se o token de sessão do usuário no `AuthProvider` está ativo. Caso contrário, redireciona o usuário para `/auth/login`.
*   **`PublicOnlyGuard`:** Impede que usuários já logados acessem a tela de login ou cadastro, redirecionando-os diretamente para o dashboard (`/app`).
*   **`OnboardingGuard`:** Verifica se o perfil do usuário possui o campo `onboarding_completed_at` preenchido. Caso seja nulo, força o redirecionamento para `/app/onboarding`.
*   **`AdminGuard`:** Lê a role do perfil no banco de dados e bloqueia a navegação a qualquer rota administrativa `/admin/*` se o usuário não for reconhecido como administrador.

---

## 5. Detalhamento de Funcionalidades e Regras de Negócio

### 5.1 Fluxo Detalhado do Onboarding Multietapas
O componente `OnboardingPage.tsx` implementa um questionário interativo dividido em 5 etapas progressivas:
1.  **Household Size:** Define a quantidade de pessoas na residência (opções: de 1 a 5 ou mais). Esse dado calcula os multiplicadores de ingredientes na lista de compras.
2.  **Meal Modes:** Seleção das refeições que farão parte do planejamento (Almoço, Jantar ou ambos).
3.  **Plan Days:** Quantidade de dias desejados no planejador padrão (Segunda a Sexta = 5 dias; Semana inteira = 7 dias; Flexível = 3 dias).
4.  **Dietary Restrictions:** Tags de restrição alimentar (Sem Glúten, Sem Lactose, Vegetariano, Vegano, Low Carb, Sem Frutos do Mar).
5.  **Primary Goal:** Objetivo de uso do usuário (Economizar tempo, Economizar dinheiro, Comer melhor, Organizar a família, Variar cardápio).
*Ao finalizar, a página realiza um `upsert` na tabela `user_preferences` e atualiza a coluna `onboarding_completed_at` do perfil em uma única transação.*

### 5.2 O Planejador Semanal e "Repetir Semana"
O planejador (`WeeklyPlannerPage.tsx`) exibe um painel de abas ou cartões para cada dia selecionado nas preferências.
*   Cada dia contém slots de refeição (`lunch` e `dinner`) representados por `MealSlotCard.tsx`.
*   Ao clicar em um slot vazio, o usuário abre o catálogo de receitas de forma contextualizada para selecionar um prato.
*   **Histórico e Clonagem:** A página `HistoryPage.tsx` exibe os planejamentos arquivados. O recurso **Repetir Semana** chama uma lógica local para clonar a estrutura de dias e slots de uma semana passada para a semana atual, gerando um novo `weekId` sem forçar o usuário a remontar a grade do zero.

### 5.3 A Lista de Compras Inteligente e Regeneração
Sempre que um usuário altera receitas no planejador semanal, a lista de compras correspondente torna-se desatualizada.
*   O usuário clica no botão "Atualizar Lista", que dispara a Edge Function `rebuild-shopping-list`.
*   **Processamento Server-Side:** A Edge Function lê todos os ingredientes das receitas selecionadas nos slots da semana. Ela faz uma normalização dos nomes e soma as quantidades matemáticas e unidades equivalentes (ex: somar 200g + 300g do mesmo ingrediente normalizado para gerar um único item de 500g na lista).
*   Os itens são agrupados por seções de supermercado para facilitar a navegação em loja física.

### 5.4 Compartilhamento Seguro por Tokens Temporários
O Cardappio permite o compartilhamento de listas de compras ou planejamentos com terceiros (ex: enviar a lista de compras para o cônjuge).
*   A Edge Function `generate-share-link` é acionada, inserindo um registro na tabela `shared_resources` contendo um token único gerado aleatoriamente e um prazo de expiração (padrão 24h).
*   O link gerado (`/compartilhar/:token`) aponta para uma rota de leitura pública que contorna a necessidade de login apenas para aquele recurso específico através de políticas RLS programadas.

### 5.5 Segurança Editorial e Bloqueio Premium
A monetização é aplicada em duas camadas:
1.  **Frontend (Visual):** Ao renderizar `RecipeDetailPage.tsx`, se a receita contiver o sinalizador `is_premium = true` e o usuário possuir assinatura gratuita (`free`), o componente `PremiumGuard` bloqueia a exibição dos ingredientes detalhados e do passo a passo, exibindo um banner promocional estimulando o upgrade de plano.
2.  **Backend (Banco de Dados):** A RLS impede que queries diretas feitas pelo cliente retornem os campos de passo a passo (`recipe_steps`) e ingredientes detalhados de receitas marcadas como premium caso a assinatura do perfil do usuário esteja expirada ou seja do tipo gratuita.

### 5.6 Painel de Relatórios Administrativos
O dashboard administrativo (`/admin`) consome a Edge Function `admin-reports`, que computa métricas agregadas da base de dados sem expor as tabelas de perfil ou dados pessoais dos usuários. Ele retorna:
*   Usuários cadastrados no período.
*   Receitas mais adicionadas a planejamentos na última semana.
*   Taxa de retenção do planejador semanal.
*   Estatísticas financeiras de planos e assinaturas ativas.

---

## 6. Checklist de Arquivos do Frontend por Rota

*   **Páginas Públicas (`src/pages/public/`):**
    *   `LandingPage.tsx` - Apresentação principal da plataforma.
    *   `HowItWorksPage.tsx` - Jornada visual interativa.
    *   `PublicPlansPage.tsx` - Visualização pública de tabelas de preços.
    *   `FaqPage.tsx` - Perguntas frequentes.
    *   `ContactPage.tsx` - Canal de contato do usuário com a plataforma.
    *   `SupportPage.tsx` - Atendimento a dúvidas.
*   **Páginas de Autenticação (`src/pages/auth/`):**
    *   `LoginPage.tsx` - Entrada com e-mail/senha ou Magic Link.
    *   `SignupPage.tsx` - Criação de conta.
    *   `RecoverAccessPage.tsx` - Formulário de redefinição de senha.
    *   `AuthCallbackPage.tsx` - Captura de tokens do Supabase e redirecionamento.
*   **Páginas da Aplicação (`src/pages/app/`):**
    *   `AppHomePage.tsx` - Dashboard do usuário.
    *   `OnboardingPage.tsx` - Setup de dados do perfil inicial.
    *   `WeeklyPlannerPage.tsx` - Lousa de controle semanal.
    *   `RecipePickerPage.tsx` - Lista de receitas com busca e categorização.
    *   `RecipeDetailPage.tsx` - Ficha técnica de preparo com interações.
    *   `ShoppingListPage.tsx` - Checklist de supermercado categorizada.
    *   `FavoritesPage.tsx` - Favoritos do usuário.
    *   `CollectionsPage.tsx` - Visualização das coleções criadas.
    *   `CollectionDetailPage.tsx` - Receitas pertencentes a uma coleção.
    *   `ProfilePreferencesPage.tsx` - Gerenciamento de dados cadastrais.
    *   `NotificationsPage.tsx` - Central de alertas do app.
    *   `HistoryPage.tsx` - Lista de planejamentos passados.
    *   `SubscriptionPage.tsx` - Visualização e faturamento da assinatura.
*   **Páginas de Administração (`src/pages/admin/`):**
    *   `AdminDashboardPage.tsx` - Painel analítico de KPI.
    *   `AdminRecipesPage.tsx` - Listagem e filtros das receitas cadastradas.
    *   `AdminRecipeEditorPage.tsx` - Formulário completo para gerenciar receitas.
    *   `AdminCategoriesPage.tsx` & `AdminTagsPage.tsx` - Cadastro de taxonomias.
    *   `AdminCollectionsPage.tsx` - Organização de coleções editoriais públicas.
    *   `AdminNoticesPage.tsx` - Editor de dicas e avisos da home.
    *   `AdminUsersPage.tsx` - Listagem e gerenciamento de perfis e permissões.
    *   `AdminPlansPage.tsx` - Tabela de planos comerciais da plataforma.
    *   `AdminSubscriptionsPage.tsx` - Registro de assinaturas ativas na plataforma.
    *   `AdminNoticesPage.tsx` & `AdminNotificationsPage.tsx` - Fila e monitoramento de disparos.
    *   `AdminSettingsPage.tsx`, `AdminReportsPage.tsx` & `AdminLogsPage.tsx` - Utilitários de controle do sistema.
