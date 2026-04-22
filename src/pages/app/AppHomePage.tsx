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
  const { data: collections, isLoading: collLoading } = useCollections()
  const { data: notices } = useEditorialNotices()

  const greeting = user?.full_name
    ? `Olá, ${user.full_name.split(' ')[0]}!`
    : 'Olá!'

  // Get only first 2-3 collections for the home page
  const featuredCollections = collections?.slice(0, 2) ?? []
  const latestNotice = notices?.[0]

  return (
    <div className="pb-8">
      <PageHeader
        title={greeting}
        subtitle="Organize seu cardápio da semana de forma rápida e prática."
      />

      {/* Editorial Notice (Tip/Alert) */}
      {latestNotice && (
        <div 
          className="mb-6 p-4 rounded-2xl border flex gap-3 items-start"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
            borderColor: 'var(--color-primary-container)'
          }}
        >
          <div className="rounded-full p-2" style={{ backgroundColor: 'white' }}>
            <Sparkles className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-primary)' }}>
              {latestNotice.notice_type === 'tip' ? 'Dica do Editor' : 'Aviso'}
            </h4>
            <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
              {latestNotice.body}
            </p>
          </div>
        </div>
      )}

      {/* Week summary */}
      {weekLoading ? (
        <LoadingState message="Carregando semana..." />
      ) : activeWeek ? (
        <div
          className="rounded-2xl border p-5 mb-8"
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderColor: 'var(--color-outline-variant)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
              >
                Semana atual
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {activeWeek.week_start_date} — {activeWeek.week_end_date}
              </p>
            </div>
            <Link
              to={`/app/semana/${activeWeek.id}`}
              className="text-sm font-medium no-underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Ver completa →
            </Link>
          </div>

          {/* Mini day summary */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[...(activeWeek.days ?? [])]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((day) => {
                const filledSlots = (day.slots ?? []).filter((s) => s.recipe_id)
                const totalSlots = (day.slots ?? []).length
                const allFilled = totalSlots > 0 && filledSlots.length === totalSlots

                return (
                  <div
                    key={day.id}
                    className="flex flex-col items-center gap-1 rounded-xl p-2 text-center"
                    style={{
                      backgroundColor: allFilled
                        ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                        : 'var(--color-surface-container-low)',
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase" style={{
                      color: allFilled ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                    }}>
                      {DAY_LABELS[day.day_of_week as DayOfWeek].substring(0, 3)}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      {filledSlots.length}/{totalSlots}
                    </span>
                  </div>
                )
              })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-5">
            <Link
              to={`/app/semana/${activeWeek.id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium no-underline transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--color-outline-variant)',
                color: 'var(--color-on-surface)',
              }}
            >
              <CalendarDays className="h-4 w-4" />
              Editar semana
            </Link>
            <Link
              to={`/app/semana/${activeWeek.id}/compras`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white no-underline transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <ShoppingCart className="h-4 w-4" />
              Lista de compras
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border p-6 mb-8"
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderColor: 'var(--color-outline-variant)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <EmptyState
            icon={<CalendarDays className="h-8 w-8 text-primary" />}
            title="Sua semana está vazia"
            description="Que tal planejar suas refeições agora para economizar tempo e dinheiro?"
            action={
              <Link
                to="/app/semana/nova"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 no-underline"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Plus className="h-4 w-4" />
                Montar minha semana
              </Link>
            }
          />
        </div>
      )}

      {/* Featured Collections */}
      {!collLoading && featuredCollections.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Para você se inspirar
            </h3>
            <Link to="/app/colecoes" className="text-sm font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
              Ver todas
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {featuredCollections.map((coll) => (
              <Link
                key={coll.id}
                to={`/app/colecoes/${coll.slug}`}
                className="relative flex-none w-64 aspect-video rounded-2xl overflow-hidden no-underline group border"
              >
                {coll.cover_image_url && (
                  <img src={coll.cover_image_url} alt={coll.title} className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-end">
                  <h4 className="text-white font-bold">{coll.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions grid */}
      <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Acesso rápido
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Receitas', href: '/app/receitas', icon: BookOpen, color: '#f0fdf4', iconColor: '#166534' },
          { label: 'Favoritos', href: '/app/favoritos', icon: Heart, color: '#fef2f2', iconColor: '#991b1b' },
          { label: 'Minha Semana', href: '/app/semana', icon: CalendarDays, color: '#eff6ff', iconColor: '#1e40af' },
          { label: 'Lista de Compras', href: '/app/compras', icon: ShoppingCart, color: '#fffbeb', iconColor: '#92400e' },
        ].map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md no-underline"
            style={{ 
              backgroundColor: 'var(--color-surface-container-lowest)',
              borderColor: 'var(--color-outline-variant)'
            }}
          >
            <div className="rounded-xl p-2" style={{ backgroundColor: action.color }}>
              <action.icon className="h-5 w-5" style={{ color: action.iconColor }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
