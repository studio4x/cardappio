import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye, EyeOff, BookOpen, Clock, FileText, Image as ImageIcon } from 'lucide-react'
import { useBlogPost, useBlogCategories, useAdminBlogMutations, slugify } from '@/hooks/blog/useBlog'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { toast } from 'sonner'
import type { BlogPostStatus } from '@/types/blog'

export function AdminBlogPostEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'novo'

  const { data: categories } = useBlogCategories()
  const { savePost } = useAdminBlogMutations()

  // For existing post, load details
  const [existingSlug, setExistingSlug] = useState<string | undefined>()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [readTimeMinutes, setReadTimeMinutes] = useState(5)
  const [status, setStatus] = useState<BlogPostStatus>('draft')
  const [contentHtml, setContentHtml] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch post if editing
  const { data: post, isLoading } = useBlogPost(existingSlug)

  useEffect(() => {
    if (!isNew && id) {
      // In Cardappio admin, id can be passed as slug or UUID. If id is UUID, we load by querying supabase directly
      setExistingSlug(id)
    }
  }, [id, isNew])

  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setSlug(post.slug)
      setCategoryId(post.category_id || '')
      setCoverImageUrl(post.cover_image_url || '')
      setSeoDescription(post.seo_description || '')
      setReadTimeMinutes(post.read_time_minutes || 5)
      setStatus(post.status || 'draft')
      setContentHtml(post.content_html || (post.content_text ? post.content_text.map(p => `<p>${p}</p>`).join('') : ''))
    }
  }, [post])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (isNew) {
      setSlug(slugify(val))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('O título do artigo é obrigatório.')
      return
    }

    setIsSaving(true)
    try {
      const selectedCategory = categories?.find(c => c.id === categoryId)

      await savePost.mutateAsync({
        id: isNew ? undefined : post?.id || id,
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        category_id: categoryId || null,
        category_name: selectedCategory?.name || 'Geral',
        seo_description: seoDescription.trim(),
        cover_image_url: coverImageUrl.trim(),
        read_time_minutes: Number(readTimeMinutes) || 5,
        status,
        content_html: contentHtml,
        published_at: status === 'published' ? new Date().toISOString() : null
      })

      toast.success(isNew ? 'Artigo criado com sucesso!' : 'Artigo atualizado!')
      navigate('/admin/blog')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar artigo.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isNew && isLoading) return <LoadingState message="Carregando dados do artigo..." />

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isNew ? 'Novo Artigo do Blog' : 'Editar Artigo'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Preencha os campos para publicar ou salvar em rascunho.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewMode((prev) => !prev)}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isPreviewMode ? 'Modo Edição' : 'Prévia Visual'}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Artigo'}
          </Button>
        </div>
      </div>

      {/* Main Content Area: Editor or Preview */}
      {isPreviewMode ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6 shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              {categories?.find(c => c.id === categoryId)?.name || 'Geral'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">{title || 'Título do Artigo'}</h2>
            <p className="mt-2 text-sm text-slate-500">{seoDescription || 'Resumo SEO do artigo'}</p>
          </div>

          {coverImageUrl && (
            <div className="aspect-[16/7] w-full rounded-2xl overflow-hidden bg-slate-100">
              <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div
            className="prose prose-slate max-w-none pt-4"
            dangerouslySetInnerHTML={{ __html: contentHtml || '<p>Nenhum conteúdo digitado ainda.</p>' }}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Title, Content HTML, SEO */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Title & Slug */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Título do Artigo *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: 5 Dicas para organizar o cardápio da semana"
                  required
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  URL amigável (Slug)
                </label>
                <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
                  <span className="text-slate-400">/blog/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full bg-transparent outline-none font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Conteúdo do Artigo (HTML)
                </label>
                <span className="text-[11px] font-semibold text-slate-400">Suporta tags &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;strong&gt;</span>
              </div>

              <textarea
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                placeholder="<p>Escreva o conteúdo formatado em HTML aqui...</p>"
                rows={16}
                className="w-full rounded-xl border border-slate-200 p-4 text-xs font-mono leading-relaxed text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            {/* SEO Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Resumo SEO / Metadescrição
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Breve resumo explicativo que aparece nos cards e nos buscadores..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* Right Column: Settings, Status, Category, Image */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status & Publication */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Publicação
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="draft">Rascunho (Rascunho)</option>
                  <option value="published">Publicado (Público)</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tempo de Leitura (minutos)</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Categoria
              </h3>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
              >
                <option value="">Selecione uma Categoria...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cover Image URL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Imagem de Capa
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">URL da Imagem</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {coverImageUrl && (
                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={coverImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

          </div>
        </form>
      )}
    </div>
  )
}
