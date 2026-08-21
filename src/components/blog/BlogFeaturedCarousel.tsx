import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, BookOpen } from 'lucide-react'
import type { BlogPost } from '@/types/blog'
import { useBlogCarouselSettings } from '@/hooks/blog/useBlog'
import { fixMojibakeText } from '@/lib/blog-utils'

interface BlogFeaturedCarouselProps {
  posts: BlogPost[]
}

export function BlogFeaturedCarousel({ posts }: BlogFeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Fetch custom main carousel settings
  const { data: customCarousel } = useBlogCarouselSettings()
  const customSlides = customCarousel?.slides || []

  // Fallback to featured articles if no custom slides exist
  const hasCustomSlides = customSlides.length > 0
  const totalSlides = hasCustomSlides ? customSlides.length : 0

  const fallbackPosts = posts.filter(p => p.is_featured).length > 0
    ? posts.filter(p => p.is_featured)
    : posts.slice(0, 3)

  const finalSlidesCount = hasCustomSlides ? totalSlides : fallbackPosts.length

  useEffect(() => {
    if (finalSlidesCount <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % finalSlidesCount)
    }, 5000)
    return () => clearInterval(timer)
  }, [finalSlidesCount])

  if (finalSlidesCount === 0) return null

  // Helper to detect if a link is internal
  const isInternalLink = (url: string | undefined) => {
    if (!url) return true
    return url.startsWith('/') && !url.startsWith('//')
  }

  // Render a single custom slide
  if (hasCustomSlides) {
    const currentSlide = customSlides[currentIndex] || customSlides[0]

    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-md group my-8">
        
        {/* Slide Content Container */}
        <div className="relative aspect-[16/7] md:aspect-[1920/520] w-full overflow-hidden">
          
          {/* Background Image */}
          {currentSlide.background_image_url ? (
            currentSlide.slide_type === 'image_only' && currentSlide.link_url ? (
              isInternalLink(currentSlide.link_url) ? (
                <Link to={currentSlide.link_url}>
                  <img
                    src={currentSlide.background_image_url}
                    alt={currentSlide.alt_text || 'Banner Destaque'}
                    className="h-full w-full object-cover object-center transition-all duration-700 brightness-[0.82] hover:scale-102"
                  />
                </Link>
              ) : (
                <a href={currentSlide.link_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={currentSlide.background_image_url}
                    alt={currentSlide.alt_text || 'Banner Destaque'}
                    className="h-full w-full object-cover object-center transition-all duration-700 brightness-[0.82] hover:scale-102"
                  />
                </a>
              )
            ) : (
              <img
                src={currentSlide.background_image_url}
                alt={currentSlide.alt_text || currentSlide.title || 'Banner Destaque'}
                className="h-full w-full object-cover object-center transition-all duration-700 brightness-[0.82]"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-emerald-400">
              <BookOpen className="h-16 w-16 opacity-30" />
            </div>
          )}

          {/* Overlay Dark Gradient */}
          {currentSlide.slide_type === 'text_over_image' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              
              {/* Text Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 text-white max-w-3xl">
                {currentSlide.badge_text && (
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-emerald-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                      {currentSlide.badge_text}
                    </span>
                  </div>
                )}

                {currentSlide.title && (
                  <h2 className="text-xl md:text-3xl font-black leading-tight text-white transition-colors hover:text-emerald-300">
                    {currentSlide.title}
                  </h2>
                )}

                {currentSlide.description && (
                  <p className="mt-2 line-clamp-2 text-xs md:text-sm text-slate-300 font-medium leading-relaxed hidden sm:block">
                    {currentSlide.description}
                  </p>
                )}

                {currentSlide.cta_button_text && currentSlide.cta_link_url && (
                  <div className="mt-4">
                    {isInternalLink(currentSlide.cta_link_url) ? (
                      <Link
                        to={currentSlide.cta_link_url}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all active:scale-95"
                      >
                        {currentSlide.cta_button_text}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a
                        href={currentSlide.cta_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-all active:scale-95"
                      >
                        {currentSlide.cta_button_text}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % totalSlides)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Indicator Dots at Bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {customSlides.map((_: any, idx: number) => (
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

  // Fallback to featured posts if no custom slides exist
  const currentPost = fallbackPosts[currentIndex] || fallbackPosts[0]
  const categoryName = currentPost.category?.name || currentPost.category_name || 'Cardappio'

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-md group my-8">
      {/* Slide Content Container */}
      <div className="relative aspect-[16/7] md:aspect-[1920/520] w-full overflow-hidden">
        {(currentPost.cover_image_url || currentPost.card_image_url) ? (
          <img
            src={currentPost.cover_image_url || currentPost.card_image_url!}
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
      {fallbackPosts.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + fallbackPosts.length) % fallbackPosts.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % fallbackPosts.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicator Dots at Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {fallbackPosts.map((_, idx) => (
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
