import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Calendar, ArrowRight, Utensils, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBlogLayoutSettings } from '@/hooks/blog/useBlog'
import type { BlogSidebarBlock, BlogSidebarTextSlide, BlogSidebarImageSlide } from '@/types/blog'

export function BlogSidebar() {
  const { data: layoutSettings } = useBlogLayoutSettings()
  const blocks = layoutSettings?.sidebar_blocks || []

  if (!blocks || blocks.length === 0) {
    return <DefaultSidebarFallback />
  }

  return (
    <aside className="space-y-6">
      {blocks.map((block) => (
        <SidebarBlockItem key={block.id} block={block} />
      ))}
    </aside>
  )
}

function SidebarBlockItem({ block }: { block: BlogSidebarBlock }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const slides = block.slides || []
  const hasMultipleSlides = block.mode === 'carousel' && slides.length > 1

  useEffect(() => {
    if (!hasMultipleSlides) return
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [hasMultipleSlides, slides.length])

  if (slides.length === 0) return null

  const currentSlide = slides[currentSlideIndex] || slides[0]

  if (block.block_type === 'image') {
    const imgSlide = currentSlide as BlogSidebarImageSlide
    return (
      <div className="relative aspect-[7/10] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-lg group">
        <a
          href={imgSlide.linkUrl || '#'}
          target={imgSlide.linkUrl?.startsWith('http') ? '_blank' : '_self'}
          rel="noreferrer"
          className="block h-full w-full"
        >
          <img
            src={imgSlide.url}
            alt={imgSlide.alt || 'Banner Blog'}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </a>

        {hasMultipleSlides && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx ? 'w-5 bg-emerald-400' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Otherwise: Text Card Slider (Cardappio Pro Style)
  const textSlide = currentSlide as BlogSidebarTextSlide
  const theme = textSlide.theme || 'dark'

  const bgClasses = theme === 'emerald'
    ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 border-emerald-400/30'
    : theme === 'light'
    ? 'bg-gradient-to-br from-slate-50 via-white to-emerald-50 border-slate-200 text-slate-900 shadow-md'
    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border-emerald-500/20 text-white'

  const textColor = theme === 'light' ? 'text-slate-900' : 'text-white'
  const subTextColor = theme === 'light' ? 'text-slate-600' : 'text-slate-300'
  const badgeClasses = theme === 'emerald'
    ? 'bg-white/20 text-white border-white/30'
    : theme === 'light'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'

  return (
    <div className={`relative aspect-[7/10] min-h-[460px] w-full overflow-hidden rounded-3xl p-6 shadow-lg flex flex-col justify-between border ${bgClasses}`}>
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Top Header & Badge */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest border ${badgeClasses}`}>
            <Sparkles className="h-3 w-3" />
            {textSlide.badge_text || 'CARDAPPIO PRO'}
          </div>

          {hasMultipleSlides && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold opacity-70">
                {currentSlideIndex + 1}/{slides.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <h3 className={`text-xl font-black leading-tight ${textColor} transition-all duration-300`}>
          {textSlide.title}
        </h3>

        {textSlide.description && (
          <p className={`text-xs leading-relaxed font-medium ${subTextColor} transition-all duration-300`}>
            {textSlide.description}
          </p>
        )}
      </div>

      {/* Bullet Points & CTA Button */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-white/10">
        {textSlide.bullet_points && textSlide.bullet_points.length > 0 && (
          <div className="space-y-2 text-xs font-semibold">
            {textSlide.bullet_points.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  {idx === 0 ? <Calendar className="h-3.5 w-3.5" /> : <Utensils className="h-3.5 w-3.5" />}
                </div>
                <span className={subTextColor}>{pt}</span>
              </div>
            ))}
          </div>
        )}

        {textSlide.cta_button_text && (
          <Link
            to={textSlide.cta_link_url || '/auth/cadastro'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {textSlide.cta_button_text}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {/* Carousel Progress Dots */}
        {hasMultipleSlides && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DefaultSidebarFallback() {
  return (
    <aside className="space-y-6">
      <div className="relative aspect-[7/10] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-lg flex flex-col justify-between border border-emerald-500/20">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            Cardappio Pro
          </div>

          <h3 className="text-xl font-black leading-tight text-white">
            Organize sua semana alimentar sem complicação
          </h3>

          <p className="text-xs leading-relaxed text-slate-300 font-medium">
            Crie seu cardápio semanal personalizado, gere listas de compras automáticas e economize tempo na cozinha.
          </p>
        </div>

        <div className="relative z-10 space-y-3 pt-6 border-t border-white/10">
          <div className="space-y-2 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3" />
              </div>
              <span>Planejador semanal inteligente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Utensils className="h-3 w-3" />
              </div>
              <span>Centenas de receitas fáceis</span>
            </div>
          </div>

          <Link
            to="/auth/cadastro"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
          >
            Começar Grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
