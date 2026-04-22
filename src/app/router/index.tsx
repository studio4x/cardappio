import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { UserLayout } from '@/components/layout/UserLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'

// Guards
import { AuthGuard } from '@/app/guards/AuthGuard'
import { OnboardingGuard } from '@/app/guards/OnboardingGuard'
import { AdminGuard } from '@/app/guards/AdminGuard'
import { PublicOnlyGuard } from '@/app/guards/PublicOnlyGuard'

// Public pages
import { LandingPage } from '@/pages/public/LandingPage'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { RecoverAccessPage } from '@/pages/auth/RecoverAccessPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'

// App pages
import { OnboardingPage } from '@/pages/app/OnboardingPage'
import { AppHomePage } from '@/pages/app/AppHomePage'
import { WeeklyPlannerPage } from '@/pages/app/WeeklyPlannerPage'
import { RecipePickerPage } from '@/pages/app/RecipePickerPage'
import { RecipeDetailPage } from '@/pages/app/RecipeDetailPage'
import { ShoppingListPage } from '@/pages/app/ShoppingListPage'
import { FavoritesPage } from '@/pages/app/FavoritesPage'
import { CollectionsPage } from '@/pages/app/CollectionsPage'
import { CollectionDetailPage } from '@/pages/app/CollectionDetailPage'
import { ProfilePreferencesPage } from '@/pages/app/ProfilePreferencesPage'
import { NotificationsPage } from '@/pages/app/NotificationsPage'
import { HistoryPage } from '@/pages/app/HistoryPage'

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminRecipesPage } from '@/pages/admin/AdminRecipesPage'
import { AdminRecipeEditorPage } from '@/pages/admin/AdminRecipeEditorPage'

export const router = createBrowserRouter([
  // ==========================================
  // AREA PÚBLICA
  // ==========================================
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      // TODO: Fase posterior
      // { path: '/como-funciona', element: <HowItWorksPage /> },
      // { path: '/planos', element: <PlansPage /> },
      // { path: '/faq', element: <FaqPage /> },
      // { path: '/contato', element: <ContactPage /> },
      // { path: '/quem-somos', element: <AboutPage /> },
      // { path: '/suporte', element: <SupportPage /> },
    ],
  },

  // ==========================================
  // AREA DE AUTENTICAÇÃO
  // ==========================================
  {
    element: <PublicOnlyGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/auth/login', element: <LoginPage /> },
          { path: '/auth/cadastro', element: <SignupPage /> },
          { path: '/auth/recuperar', element: <RecoverAccessPage /> },
        ],
      },
    ],
  },
  // Callback fica fora do PublicOnlyGuard — precisa processar tokens
  {
    element: <AuthLayout />,
    children: [
      { path: '/auth/callback', element: <AuthCallbackPage /> },
    ],
  },

  // ==========================================
  // AREA AUTENTICADA DO USUÁRIO
  // ==========================================
  {
    element: <AuthGuard />,
    children: [
      // Onboarding — sem OnboardingGuard (o próprio onboarding precisa estar acessível)
      {
        element: <UserLayout />,
        children: [
          { path: '/app/onboarding', element: <OnboardingPage /> },
        ],
      },
      // App principal — com OnboardingGuard (exige onboarding completo)
      {
        element: <OnboardingGuard />,
        children: [
          {
            element: <UserLayout />,
            children: [
              { path: '/app', element: <AppHomePage /> },

              // Fase 3 - Núcleo do produto
              { path: '/app/semana', element: <WeeklyPlannerPage /> },
              { path: '/app/semana/nova', element: <WeeklyPlannerPage /> },
              { path: '/app/semana/:weekId', element: <WeeklyPlannerPage /> },
              { path: '/app/receitas', element: <RecipePickerPage /> },
              { path: '/app/receitas/:recipeSlug', element: <RecipeDetailPage /> },
              { path: '/app/compras', element: <ShoppingListPage /> },
              { path: '/app/semana/:weekId/compras', element: <ShoppingListPage /> },

              // Fase 4 - Retenção
              { path: '/app/favoritos', element: <FavoritesPage /> },
              { path: '/app/historico', element: <HistoryPage /> },
              { path: '/app/colecoes', element: <CollectionsPage /> },
              { path: '/app/colecoes/:slug', element: <CollectionDetailPage /> },

              // Fase 5 - Perfil e monetização
              { path: '/app/perfil', element: <ProfilePreferencesPage /> },
              // { path: '/app/assinatura', element: <SubscriptionPage /> },
              { path: '/app/notificacoes', element: <NotificationsPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // AREA ADMINISTRATIVA
  // ==========================================
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AdminGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              // Fase 7 - Administração
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/receitas', element: <AdminRecipesPage /> },
              { path: '/admin/receitas/nova', element: <AdminRecipeEditorPage /> },
              { path: '/admin/receitas/:id', element: <AdminRecipeEditorPage /> },
              // { path: '/admin/categorias', element: <AdminCategoriesPage /> },
              // { path: '/admin/tags', element: <AdminTagsPage /> },
              // { path: '/admin/colecoes', element: <AdminCollectionsPage /> },
              // { path: '/admin/dicas-alertas', element: <AdminNoticesPage /> },
              // { path: '/admin/notificacoes', element: <AdminNotificationsPage /> },
              // { path: '/admin/usuarios', element: <AdminUsersPage /> },
              // { path: '/admin/planos', element: <AdminPlansPage /> },
              // { path: '/admin/assinaturas', element: <AdminSubscriptionsPage /> },
              // { path: '/admin/configuracoes', element: <AdminSettingsPage /> },
              // { path: '/admin/relatorios', element: <AdminReportsPage /> },
              // { path: '/admin/logs', element: <AdminLogsPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // CATCH-ALL
  // ==========================================
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
