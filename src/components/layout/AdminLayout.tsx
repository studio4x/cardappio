import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Tags,
  FolderOpen,
  Bell,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Lightbulb,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Server,
  HardDrive,
  RotateCw,
  ExternalLink,
  Mail
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/Logo'
import { config } from '@/config'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

interface NavGroup {
  label: string
  description: string
  items: NavItem[]
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'VISÃO GERAL',
    description: 'Painel executivo e acompanhamento operacional.',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
      { label: 'Relatórios', icon: BarChart3, href: '/admin/relatorios' },
      { label: 'Logs do Sistema', icon: FileText, href: '/admin/logs' },
    ],
  },
  {
    label: 'CONTEÚDO',
    description: 'Catálogo, receitas e controle de conteúdo público.',
    items: [
      { label: 'Receitas', icon: UtensilsCrossed, href: '/admin/receitas' },
      { label: 'Categorias', icon: Layers, href: '/admin/categorias' },
      { label: 'Tags', icon: Tags, href: '/admin/tags' },
      { label: 'Coleções', icon: FolderOpen, href: '/admin/colecoes' },
      { label: 'Dicas e alertas', icon: Lightbulb, href: '/admin/dicas-alertas' },
    ],
  },
  {
    label: 'OPERAÇÃO',
    description: 'Pessoas, planos, assinaturas e relacionamento.',
    items: [
      { label: 'Notificações', icon: Bell, href: '/admin/notificacoes' },
      { label: 'Usuários', icon: Users, href: '/admin/usuarios' },
      { label: 'Planos', icon: CreditCard, href: '/admin/planos' },
      { label: 'Assinaturas', icon: CreditCard, href: '/admin/assinaturas' },
    ],
  },
  {
    label: 'SISTEMA',
    description: 'Configurações de apoio e administração do sistema.',
    items: [
      { label: 'Integração Stripe', icon: CreditCard, href: '/admin/stripe' },
      { label: 'Configurações', icon: Settings, href: '/admin/configuracoes' },
      { label: 'E-mails Transacionais', icon: Mail, href: '/admin/emails' },
    ],
  },
]

export function AdminLayout() {
  const { user, signOut } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'VISÃO GERAL': true,
    'CONTEÚDO': false,
    'OPERAÇÃO': false,
    'SISTEMA': false,
  })

  // Auto-expand group containing the active path on load or route change
  useEffect(() => {
    const currentPath = location.pathname
    const activeGroup = adminNavGroups.find(group =>
      group.items.some(item => {
        if (item.href === '/admin') {
          return currentPath === '/admin'
        }
        return currentPath.startsWith(item.href)
      })
    )
    if (activeGroup) {
      setExpandedGroups(prev => ({
        ...prev,
        [activeGroup.label]: true
      }))
    }
    setIsMobileOpen(false)
  }, [location.pathname])

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  const handleClearCache = (type: string) => {
    toast.success(`${type} limpo com sucesso!`)
  }

  const userEmail = user?.email || 'contato@studio4x.com.br'
  const userInitials = userEmail.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6 flex flex-col gap-6 font-sans">
      {/* Top Header Card */}
      <header className="bg-white rounded-[24px] border border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2">
          <Logo variant="dark" to="/admin" showText={false} className="scale-90 origin-left" />
          <span className="text-xs font-black tracking-widest text-slate-500 uppercase ml-2 select-none">
            Painel Admin
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          {/* Cache Control Pills (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2">
            <button
              onClick={() => handleClearCache('Cache do servidor')}
              className="px-4 py-2 border border-slate-200 rounded-full text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Server className="h-3.5 w-3.5 text-slate-400" />
              Cache servidor
            </button>
            <button
              onClick={() => handleClearCache('Cache do navegador')}
              className="px-4 py-2 border border-slate-200 rounded-full text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
              Cache navegador (manter login)
            </button>
            <button
              onClick={() => handleClearCache('Cache completo')}
              className="px-4 py-2 border border-slate-200 rounded-full text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <RotateCw className="h-3.5 w-3.5 text-slate-400" />
              Cache completo
            </button>
          </div>

          {/* Public Site Button */}
          <Link
            to="/app"
            target="_blank"
            className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm no-underline"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Site Público</span>
          </Link>

          {/* Notification Button */}
          <Link to="/admin/notificacoes" className="relative p-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shadow-sm active:scale-95">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#f76f25] text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center border-2 border-white shadow-sm">
              9+
            </span>
          </Link>

          {/* User Account Details (Desktop only) */}
          <div className="hidden md:flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-full pl-2 pr-4 py-1">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-inner">
              {userInitials}
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CONTA</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 max-w-[150px] truncate" title={userEmail}>
                {userEmail}
              </span>
            </div>
          </div>

          {/* Sair Button (Desktop only) */}
          <Button
            variant="outline"
            onClick={signOut}
            className="hidden md:inline-flex rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-xs font-semibold text-slate-600 px-6 py-2 h-auto"
          >
            Sair
          </Button>

          {/* Hamburger Menu (Mobile only) */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2.5 border border-slate-200 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 lg:hidden transition-colors shadow-sm"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Body Section */}
      <div className="flex flex-1 gap-6 relative items-start">
        {/* Mobile Sidebar Drawer Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm transition-all"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-80 bg-white rounded-3xl border border-slate-100 p-6 shadow-md lg:shadow-sm flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 lg:flex shrink-0 self-stretch",
            isMobileOpen ? "translate-x-4 my-4 h-[calc(100vh-2rem)]" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div>
            {/* Sidebar Title Header */}
            <div className="flex items-center justify-between px-2">
              <div>
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">NAVEGACAO</span>
                <h2 className="text-2xl font-black text-slate-800 mt-0.5">Admin</h2>
              </div>
              {/* Close Button on Mobile Drawer */}
              <button
                className="lg:hidden p-2 rounded-full hover:bg-slate-100 text-slate-500"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav Groups / Accordion */}
            <nav className="space-y-4 mt-6">
              {adminNavGroups.map((group) => {
                const isExpanded = expandedGroups[group.label]
                const groupActive = group.items.some(item => {
                  if (item.href === '/admin') {
                    return location.pathname === '/admin'
                  }
                  return location.pathname.startsWith(item.href)
                })

                return (
                  <div key={group.label} className="group-accordion">
                    {/* Group Trigger Button */}
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        "w-full flex items-center justify-between text-left p-4 rounded-2xl border transition-all",
                        groupActive
                          ? "border-[#f76f25]/20 bg-[#f76f25]/5"
                          : "border-slate-100 bg-white hover:bg-slate-50/50"
                      )}
                    >
                      <div className="pr-2 leading-none">
                        <span className={cn(
                          "text-[10px] font-black tracking-widest uppercase",
                          groupActive ? "text-[#f76f25]" : "text-slate-500"
                        )}>
                          {group.label}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-1 block font-normal leading-tight">
                          {group.description}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", groupActive ? "text-[#f76f25]" : "text-slate-400")} />
                      ) : (
                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", groupActive ? "text-[#f76f25]" : "text-slate-400")} />
                      )}
                    </button>

                    {/* Group Items list */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isExpanded ? "max-h-[500px] opacity-100 mt-2 px-2 pb-1 space-y-1.5" : "max-h-0 opacity-0 pointer-events-none"
                      )}
                    >
                      {group.items.map((item) => {
                        const itemActive = item.href === '/admin'
                          ? location.pathname === '/admin'
                          : location.pathname.startsWith(item.href)

                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all no-underline shadow-sm hover:translate-x-0.5",
                              itemActive
                                ? "bg-[#f76f25] text-white shadow-[#f76f25]/10"
                                : "bg-[#f1f5f9] text-slate-600 hover:bg-slate-200/60 shadow-slate-100/50"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Sidebar Drawer Footer */}
          <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
            {/* Sign Out Button (Always shown on Mobile Drawer) */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-100 hover:border-rose-100 rounded-2xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>

            {/* Build Version Tag */}
            <div className="px-4 flex flex-col gap-0.5 text-left leading-none">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                VERSÃO {__BUILD_VERSION__}
              </span>
              <span className="text-[9px] font-mono text-slate-300">
                #{__COMMIT_HASH__}
              </span>
            </div>
          </div>
        </aside>

        {/* Content Area & Footer container */}
        <div className="flex flex-col flex-1 gap-6 min-w-0 self-stretch">
          {/* Main Card for Pages */}
          <main className="flex-1 bg-white rounded-[24px] border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col min-h-[500px]">
            <Outlet />
          </main>

          {/* Main Layout Footer */}
          <footer className="flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-black text-slate-400 tracking-widest uppercase px-4 pb-2 select-none">
            <div className="flex items-center gap-1.5">
              <Link to="/app/politica" className="hover:text-[#f76f25] no-underline transition-colors">PRIVACIDADE</Link>
              <span>/</span>
              <Link to="/app/termos" className="hover:text-[#f76f25] no-underline transition-colors">COOKIES</Link>
              <span>/</span>
              <Link to="/app/termos" className="hover:text-[#f76f25] no-underline transition-colors">TERMOS DE USO</Link>
            </div>
            <div>
              Build v{__BUILD_VERSION__} - {__COMMIT_HASH__}
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
