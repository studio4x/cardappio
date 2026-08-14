import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, FileText, Send, BookOpen } from 'lucide-react'
import { useBlogPost } from '@/hooks/blog/useBlog'
import { useAuth } from '@/app/providers/AuthProvider'
import { BlogCommentsSection } from '@/components/blog/BlogCommentsSection'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { data: post, isLoading, error, refetch } = useBlogPost(slug)

  if (isLoading) return <LoadingState message="Carregando artigo..." />
  if (error || !post) return <ErrorState onRetry={() => refetch()} />

  const isDraft = post.status !== 'published'
  const formattedDate = post.published_at 
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(post.published_at))
    : ''
  const categoryName = post.category?.name || post.category_name || 'Cardappio'

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-4 md:pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation button */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => navigate('/blog')}
            className="active:scale-95 transition-transform hover:bg-white py-2 px-4 rounded-full cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            Voltar para o Blog
          </button>

          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] uppercase font-extrabold px-3 py-1 rounded-full tracking-wider border border-emerald-200">
            {categoryName}
          </span>
        </div>

        {/* Draft Notice Banner (Admin / Creator) */}
        {isDraft && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Artigo em Modo {post.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                </p>
                <p className="text-xs text-amber-700 font-medium">
                  Este artigo não está visível para visitantes normais no blog público.
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button
                type="button"
                onClick={() => navigate(`/admin/blog/${post.id}`)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0"
              >
                Editar no Admin
              </Button>
            )}
          </div>
        )}

        {/* Article Container */}
        <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          
          {/* Ultra-wide Cover Image (Aspect 1920/500 ~ 4/1) */}
          <div className="relative aspect-[16/7] md:aspect-[1920/500] w-full overflow-hidden bg-slate-900">
            {post.cover_image_url ? (
              <img 
                src={post.cover_image_url} 
                alt={post.title} 
                className="h-full w-full object-cover object-center" 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-emerald-400">
                <BookOpen className="h-16 w-16 opacity-30" />
              </div>
            )}
          </div>

          {/* Article Header & Meta */}
          <div className="p-6 md:p-10 border-b border-slate-100">
            <h1 className="text-2xl md:text-4xl font-black leading-tight text-slate-900">
              {post.title}
            </h1>

            {post.seo_description && (
              <p className="mt-3 text-base md:text-lg font-medium leading-relaxed text-slate-600">
                {post.seo_description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <span className="text-slate-900 font-bold">{post.author_name}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                {post.read_time_minutes} min de leitura
              </span>
              {formattedDate && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    {formattedDate}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Article Main Body Content */}
          <div className="p-6 md:p-10">
            {post.content_html ? (
              <div 
                className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-emerald-600 prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: post.content_html }}
              />
            ) : post.content_text && post.content_text.length > 0 ? (
              <div className="space-y-4 text-base leading-relaxed text-slate-700">
                {post.content_text.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Conteúdo do artigo em elaboração.</p>
            )}
          </div>

        </article>

        {/* Action Buttons Row */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            Voltar para Todos os Artigos
          </Link>

          <Link
            to="/contato"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
          >
            <Send className="h-4 w-4 text-emerald-600" />
            Fale Conosco
          </Link>
        </div>

        {/* Comments Section Component */}
        <BlogCommentsSection postSlug={post.slug} postId={post.id} />

      </div>
    </div>
  )
}
