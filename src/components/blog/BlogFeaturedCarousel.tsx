import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, Clock, BookOpen } from 'lucide-react'
import type { BlogPost } from '@/types/blog'
import { fixMojibakeText } from '@/lib/blog-utils'

interface BlogFeaturedCarouselProps {
  posts: BlogPost[]
}

export function BlogFeaturedCarousel({ posts }: BlogFeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const featuredPosts = posts.filter(p => p.is_featured).length > 0
    ? posts.filter(p => p.is_featured)
    : posts.slice(0, 3)

  useEffect(() => {
    if (featuredPosts.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredPosts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredPosts.length])

  if (!featuredPosts || featuredPosts.length === 0) return null

  const currentPost = featuredPosts[currentIndex] || featuredPosts[0]
  const formattedDate = currentPost.published_at 
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(currentPost.published_at))
    : ''

  const categoryName = currentPost.category?.name || currentPost.category_name || 'Cardappio'

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-md group my-8">
      {/* Slide Content Container */}
      <div className="relative aspect-[16/7] md:aspect-[1920/520] w-full overflow-hidden">
        {currentPost.cover_image_url ? (
          <img
            src={currentPost.cover_image_url}
            alt={currentPost.title}
            className="h-full w-full object-cover object-center transition-all duration-700 brightness-[0.82]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-emerald-400">
            <BookOpen className="h-16 w-16 opacity-30" />
          </div>
        )}

        {/* Overlay Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Text Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 text-white max-w-3xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-block rounded-full bg-emerald-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
              {categoryName}
            </span>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              {currentPost.read_time_minutes} min de leitura
            </span>
          </div>

          <h2 className="text-xl md:text-3xl font-black leading-tight text-white transition-colors hover:text-emerald-300">
            <Link to={`/blog/${currentPost.slug}`}>
              {fixMojibakeText(currentPost.title)}
            </Link>
          </h2>

          {currentPost.seo_description && (
            <p className="mt-2 line-clamp-2 text-xs md:text-sm text-slate-300 font-medium leading-relaxed hidden sm:block">
              {fixMojibakeText(currentPost.seo_description)}
            </p>
          )}

          <div className="mt-4">
            <Link
              to={`/blog/${currentPost.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all active:scale-95"
            >
              Ler Artigo Completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {featuredPosts.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredPosts.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicator Dots at Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {featuredPosts.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-emerald-500' : 'w-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
