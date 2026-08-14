import { Link } from 'react-router-dom'
import { ArrowRight, Clock, BookOpen } from 'lucide-react'
import type { BlogPost } from '@/types/blog'

interface BlogPostCardProps {
  post: BlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const formattedDate = post.published_at 
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(post.published_at))
    : ''

  const categoryName = post.category?.name || post.category_name || 'Cardappio'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {post.cover_image_url ? (
          <img 
            src={post.cover_image_url} 
            alt={post.title} 
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
            loading="lazy" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-amber-500/10 text-emerald-600">
            <BookOpen className="h-12 w-12 opacity-40" />
          </div>
        )}
        
        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-block rounded-full bg-emerald-600/90 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex min-h-[320px] flex-1 flex-col p-6">
        {/* Meta Info: Read time & Date */}
        <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            {post.read_time_minutes} min de leitura
          </span>
          {formattedDate && (
            <>
              <span>·</span>
              <span>{formattedDate}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-600">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Description / Summary */}
        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-slate-600">
          {post.seo_description || 'Confira este artigo exclusivo do Blog Cardappio com dicas práticas para o seu dia a dia.'}
        </p>

        {/* CTA Link */}
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <Link 
            to={`/blog/${post.slug}`} 
            className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Leia mais
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}
