import { Link } from 'react-router-dom'
import { CalendarDays, Plus, ShoppingCart, ChefHat, Sparkles, BookOpen, Heart } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuth } from '@/app/providers/AuthProvider'
import { useActiveWeek } from '@/hooks/planning/usePlanning'
import { useCollections, useEditorialNotices } from '@/hooks/recipes/useCollections'
import { DAY_LABELS, type DayOfWeek } from '@/lib/constants/calendar'

export function AppHomePage() {
  const { user } = useAuth()
  const { data: activeWeek, isLoading: weekLoading } = useActiveWeek()
  const { data: notices } = useEditorialNotices()

  const greetingName = user?.full_name ? user.full_name.split(' ')[0] : 'usuário'
  const greeting = `Olá, ${greetingName}! 👋`

  const latestNotice = notices?.[0]

  return (
    <div className="pb-8">
      {/* Welcome Section */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">Dashboard</span>
            <h2 className="text-3xl font-bold text-on-surface">{greeting}</h2>
            <p className="text-text-secondary mt-1">Organize seu cardápio da semana de forma rápida e prática.</p>
          </div>
          <Link
            to={activeWeek ? `/app/semana/${activeWeek.id}` : "/app/semana/nova"}
            className="bg-fresh-green text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-fresh-green/20 flex items-center gap-2 active:scale-95 transition-transform duration-200 no-underline whitespace-nowrap self-start"
            style={{ backgroundColor: 'var(--color-fresh-green)' }}
          >
            <CalendarDays className="h-5 w-5" />
            Criar/Editar Semana
          </Link>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
        {/* Week Summary Card */}
        <div 
          className="md:col-span-8 bg-white border rounded-3xl p-6 shadow-sm overflow-hidden"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Resumo da Semana
            </h3>
            {activeWeek && (
              <Link to={`/app/semana/${activeWeek.id}`} className="text-xs font-bold text-primary hover:underline no-underline">
                Ver todos
              </Link>
            )}
          </div>

          {!activeWeek && !weekLoading ? (
             <div className="py-8 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant">
                <p className="text-sm font-medium text-text-secondary mb-3">Você ainda não planejou sua semana.</p>
                <Link to="/app/semana/nova" className="text-xs font-bold text-primary underline">Começar planejamento</Link>
             </div>
          ) : weekLoading ? (
            <div className="h-24 animate-pulse bg-slate-100 rounded-2xl" />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...(activeWeek?.days ?? [])]
                .sort((a, b) => a.sort_order - b.sort_order)
                .slice(0, 4)
                .map((day) => {
                  const filledCount = (day.slots ?? []).filter(s => s.recipe_id).length
                  const isToday = false // Logic for today later
                  return (
                    <div 
                      key={day.id} 
                      className="p-4 rounded-2xl border flex flex-col gap-2 transition-all hover:bg-surface-container-low"
                      style={{ 
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-surface-container)'
                      }}
                    >
                      <span className="text-[10px] font-bold text-text-secondary uppercase">
                        {DAY_LABELS[day.day_of_week as DayOfWeek].substring(0, 3)}
                        {isToday && " (HOJE)"}
                      </span>
                      <div className="h-1 bg-primary w-full rounded-full opacity-60"></div>
                      <p className="text-xs font-bold truncate mt-1">
                        {filledCount > 0 ? `${filledCount} Planejados` : "Vazio"}
                      </p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Quick Shopping List Card */}
        <div 
          className="md:col-span-4 bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-container-highest)', borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShoppingCart className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
            <ListChecks className="h-5 w-5 text-secondary" />
            Lista de Compras
          </h3>
          
          <ul className="space-y-3 relative z-10">
            {['Rúcula Hidropônica', 'Azeite Extra Virgem', 'Tomate Cereja'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-white/50">
                <div className={`w-5 h-5 rounded-full border-2 ${i === 2 ? 'bg-primary border-primary flex items-center justify-center' : 'border-primary'}`}>
                  {i === 2 && <Plus className="h-3 w-3 text-white rotate-45" />}
                </div>
                <span className={`text-sm font-medium ${i === 2 ? 'text-warm-gray-medium line-through' : ''}`}>{item}</span>
              </li>
            ))}
          </ul>
          
          <Link 
            to={activeWeek ? `/app/semana/${activeWeek.id}/compras` : "/app/compras"}
            className="w-full mt-6 text-primary font-bold text-sm py-2 block text-center no-underline border-b-2 border-transparent hover:border-primary transition-all"
          >
            Ver lista completa
          </Link>
        </div>
      </div>

      {/* Editorial Notices */}
      {latestNotice && (
        <div 
          className="mb-10 p-5 rounded-3xl border flex gap-4 items-start shadow-sm"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--color-primary-container) 10%, transparent)',
            borderColor: 'var(--color-primary-container)'
          }}
        >
          <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: 'white' }}>
            <Sparkles className="h-5 w-5 text-primary" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-primary">
              {latestNotice.notice_type === 'tip' ? 'Dica do Editor' : 'Aviso do Sistema'}
            </h4>
            <p className="text-sm font-bold text-on-surface">
              {latestNotice.body}
            </p>
          </div>
        </div>
      )}

      {/* Inspirations Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Inspirado nos seus Favoritos</h3>
          <Link to="/app/favoritos" className="text-primary font-bold text-sm flex items-center gap-1 no-underline">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for now / Dynamic later */}
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow group cursor-pointer" style={{ borderColor: 'var(--color-outline-variant)' }}>
              <div className="h-44 relative overflow-hidden bg-slate-100">
                <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full backdrop-blur-md shadow-sm z-10">
                  <Star className="h-4 w-4 text-tertiary fill-tertiary" />
                </div>
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                   <RestaurantMenu className="h-12 w-12 opacity-20" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-2">
                  <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Saudável</span>
                  <span className="bg-neutral-100 text-neutral-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">15 min</span>
                </div>
                <h4 className="font-bold text-lg text-on-surface mb-2">Bowl Mediterrâneo de Verão</h4>
                <div className="flex items-center gap-4 text-text-secondary text-[11px] font-medium">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Fácil</span>
                  <span className="flex items-center gap-1"><Savings className="h-3 w-3" />Economize</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
