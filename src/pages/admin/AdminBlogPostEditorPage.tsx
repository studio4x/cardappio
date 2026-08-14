import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Save, Eye, EyeOff, BookOpen, Clock, FileText, Image as ImageIcon,
  Sparkles, Calendar, Search, Globe, Share2, Smartphone, Monitor, CheckCircle2, Code
} from 'lucide-react'
import { useBlogPost, useBlogCategories, useAdminBlogMutations, slugify } from '@/hooks/blog/useBlog'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
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

  const [existingSlug, setExistingSlug] = useState<string | undefined>()

  // Active Tab: 'content' | 'seo' | 'publishing' | 'preview'
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'publishing' | 'preview'>('content')
  const [contentEditorMode, setContentEditorMode] = useState<'visual' | 'code'>('visual')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Form Fields State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [cardImageUrl, setCardImageUrl] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [readTimeMinutes, setReadTimeMinutes] = useState(5)
  const [status, setStatus] = useState<BlogPostStatus>('draft')
  const [scheduledPublishAt, setScheduledPublishAt] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [contentHtml, setContentHtml] = useState('')

  // Advanced SEO Fields State
  const [focusKeyword, setFocusKeyword] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState('')
  const [seoRobots, setSeoRobots] = useState('index, follow')
  const [seoOgTitle, setSeoOgTitle] = useState('')
  const [seoOgDescription, setSeoOgDescription] = useState('')
  const [seoOgImageUrl, setSeoOgImageUrl] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false)

  // Fetch post if editing
  const { data: post, isLoading } = useBlogPost(existingSlug)

  useEffect(() => {
    if (!isNew && id) {
      setExistingSlug(id)
    }
  }, [id, isNew])

  useEffect(() => {
    if (post) {
      setTitle(post.title || '')
      setSlug(post.slug || '')
      setCategoryId(post.category_id || '')
      setCoverImageUrl(post.cover_image_url || '')
      setCardImageUrl(post.card_image_url || '')
      setSeoDescription(post.seo_description || '')
      setReadTimeMinutes(post.read_time_minutes || 5)
      setStatus(post.status || 'draft')
      setScheduledPublishAt(post.scheduled_publish_at ? new Date(post.scheduled_publish_at).toISOString().slice(0, 16) : '')
      setIsFeatured(Boolean(post.is_featured))
      setContentHtml(post.content_html || (post.content_text ? post.content_text.map(p => `<p>${p}</p>`).join('') : ''))

      // Advanced SEO
      setFocusKeyword(post.focus_keyword || '')
      setSeoTitle(post.seo_title || '')
      setSeoCanonicalUrl(post.seo_canonical_url || '')
      setSeoRobots(post.seo_robots || 'index, follow')
      setSeoOgTitle(post.seo_og_title || '')
      setSeoOgDescription(post.seo_og_description || '')
      setSeoOgImageUrl(post.seo_og_image_url || '')
    }
  }, [post])

  // Calculate estimated reading time & word count dynamically
  const wordCount = contentHtml
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

  useEffect(() => {
    if (wordCount > 0) {
      const estimatedMin = Math.max(1, Math.ceil(wordCount / 180))
      setReadTimeMinutes(estimatedMin)
    }
  }, [wordCount])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (isNew) {
      setSlug(slugify(val))
    }
  }

  // AI SEO Generator Assistant simulation/helper
  const handleGenerateAiSeo = () => {
    if (!title.trim()) {
      toast.error('Digite o título do artigo primeiro para gerar os dados SEO.')
      return
    }

    setIsGeneratingSeo(true)
    setTimeout(() => {
      const generatedTitle = `${title.trim()} | Blog Cardappio`
      const plainText = contentHtml.replace(/<[^>]*>/g, ' ').slice(0, 155).trim()
      const generatedDesc = seoDescription || plainText || `Confira este artigo completo sobre ${title.trim()} no Blog Cardappio.`
      const mainWords = title.split(/\s+/).filter(w => w.length > 3)
      const generatedKeyword = mainWords.length ? mainWords.slice(0, 2).join(' ').toLowerCase() : title.toLowerCase()

      setSeoTitle(generatedTitle)
      setSeoDescription(generatedDesc)
      setFocusKeyword(generatedKeyword)
      setSeoOgTitle(generatedTitle)
      setSeoOgDescription(generatedDesc)
      if (coverImageUrl) setSeoOgImageUrl(coverImageUrl)

      setIsGeneratingSeo(false)
      toast.success('Metadados SEO gerados automaticamente com base no conteúdo!')
    }, 600)
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
        cover_image_url: coverImageUrl.trim() || null,
        card_image_url: cardImageUrl.trim() || null,
        read_time_minutes: Number(readTimeMinutes) || 5,
        status,
        scheduled_publish_at: status === 'scheduled' && scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : null,
        is_featured: isFeatured,
        content_html: contentHtml,
        published_at: status === 'published' ? (post?.published_at || new Date().toISOString()) : null,

        // Advanced SEO
        focus_keyword: focusKeyword.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_canonical_url: seoCanonicalUrl.trim() || null,
        seo_robots: seoRobots || 'index, follow',
        seo_og_title: seoOgTitle.trim() || null,
        seo_og_description: seoOgDescription.trim() || null,
        seo_og_image_url: seoOgImageUrl.trim() || null
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
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isNew ? 'Novo Artigo do Blog' : 'Editar Artigo'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {wordCount} palavras · {readTimeMinutes} min de leitura estimados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab(activeTab === 'preview' ? 'content' : 'preview')}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            {activeTab === 'preview' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {activeTab === 'preview' ? 'Voltar para Edição' : 'Prévia Visual'}
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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'content', label: 'Conteúdo & Imagens', icon: FileText },
          { id: 'seo', label: 'SEO & Redes Sociais', icon: Search },
          { id: 'publishing', label: 'Publicação & Status', icon: Calendar },
          { id: 'preview', label: 'Prévia Visual em Tempo Real', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab 1: Content & Basic Info */}
      {activeTab === 'content' && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8 cols): Title, Content Editor, SEO Summary */}
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
                  placeholder="Ex: 5 Passos para planejar o cardápio da semana inteira"
                  required
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  URL Amigável (Slug)
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

            {/* Rich Content Editor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Conteúdo do Artigo
                </label>

                <div className="flex items-center gap-3">
                  {/* Mode Switcher Buttons */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setContentEditorMode('visual')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        contentEditorMode === 'visual'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Editor Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentEditorMode('code')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        contentEditorMode === 'code'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Code className="h-3.5 w-3.5" />
                      Código HTML
                    </button>
                  </div>

                  <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-slate-400 border-l border-slate-200 pl-3">
                    <span>{wordCount} palavras</span>
                    <span>·</span>
                    <span>{readTimeMinutes} min de leitura</span>
                  </div>
                </div>
              </div>

              {contentEditorMode === 'visual' ? (
                <RichTextEditor
                  value={contentHtml}
                  onChange={setContentHtml}
                  placeholder="Escreva e formate o artigo do blog aqui com títulos, negrito, listas e links..."
                  minHeight="320px"
                />
              ) : (
                <textarea
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder="<p>Insira ou edite o código HTML bruto aqui...</p>"
                  rows={16}
                  className="w-full rounded-2xl border border-slate-800 p-4 text-xs font-mono leading-relaxed bg-slate-900 text-emerald-400 outline-none focus:border-emerald-500 shadow-inner"
                />
              )}
            </div>

            {/* Summary / Meta Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Resumo do Artigo (Exibido no Card e nos Buscadores)
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Resumo claro e atrativo do artigo..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* Right Column (4 cols): Category & Dual Images */}
          <div className="lg:col-span-4 space-y-6">
            
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

            {/* Cover Image (Post Page Banner 1920x500) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Capa do Artigo (Banner do Topo)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">URL da Imagem de Capa</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {coverImageUrl && (
                <div className="aspect-[16/7] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Card Thumbnail Image (Grid 4:3) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Imagem da Miniatura (Card na Listagem)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">URL da Miniatura (opcional - usa a capa se vazio)</label>
                <input
                  type="url"
                  value={cardImageUrl}
                  onChange={(e) => setCardImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {cardImageUrl && (
                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={cardImageUrl} alt="Card Miniatura" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

          </div>

        </form>
      )}

      {/* Tab 2: Advanced SEO & OpenGraph */}
      {activeTab === 'seo' && (
        <div className="space-y-6 max-w-4xl">
          
          {/* AI Generator Header */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-1">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Assistente de Inteligência Artificial para SEO
              </div>
              <p className="text-xs text-emerald-900 font-medium">
                Gere automaticamente as meta tags SEO, palavra-chave e compartilhamento de redes sociais com base no artigo.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleGenerateAiSeo}
              disabled={isGeneratingSeo}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2 shrink-0 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingSeo ? 'Gerando SEO...' : 'Gerar SEO com IA'}
            </Button>
          </div>

          {/* General Search Engine Meta */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              Meta Tags para Motores de Busca (Google)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Palavra-chave Foco</label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="Ex: planejamento alimentar"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meta Robots</label>
                <select
                  value={seoRobots}
                  onChange={(e) => setSeoRobots(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="index, follow">index, follow (Permite indexação)</option>
                  <option value="noindex, follow">noindex, follow (Oculta dos buscadores)</option>
                  <option value="noindex, nofollow">noindex, nofollow (Bloqueia totalmente)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título SEO (&lt;title&gt;)</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Título otimizado para o Google (máx 60 caracteres)..."
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL Canônica (Canonical Link)</label>
              <input
                type="url"
                value={seoCanonicalUrl}
                onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                placeholder="https://cardappio.app/blog/seu-artigo"
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Social Media OpenGraph Meta */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-emerald-600" />
              OpenGraph (WhatsApp, Facebook, LinkedIn, Twitter)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título de Compartilhamento (og:title)</label>
              <input
                type="text"
                value={seoOgTitle}
                onChange={(e) => setSeoOgTitle(e.target.value)}
                placeholder="Título exibido nas prévias do WhatsApp e redes..."
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descrição de Compartilhamento (og:description)</label>
              <textarea
                value={seoOgDescription}
                onChange={(e) => setSeoOgDescription(e.target.value)}
                placeholder="Texto explicativo para redes sociais..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem de Prévia (og:image)</label>
              <input
                type="url"
                value={seoOgImageUrl}
                onChange={(e) => setSeoOgImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Publishing & Scheduling */}
      {activeTab === 'publishing' && (
        <div className="space-y-6 max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Status & Agendamento
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status da Publicação</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
              >
                <option value="draft">Rascunho (Visível apenas para admins)</option>
                <option value="scheduled">Agendado (Publica automaticamente na data)</option>
                <option value="published">Publicado (Visível no blog público)</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            {status === 'scheduled' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <label className="block text-xs font-bold text-amber-900">
                  Data e Hora do Agendamento *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledPublishAt}
                  onChange={(e) => setScheduledPublishAt(e.target.value)}
                  required={status === 'scheduled'}
                  className="w-full h-10 rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-amber-800">
                  O artigo será tornado público automaticamente quando a data selecionada for atingida.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isFeaturedToggle"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isFeaturedToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                Marcar como Artigo em Destaque na Home do Blog
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live Viewport Preview (Desktop & Mobile) */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Testar Prévia de Visualização
            </span>

            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  previewDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="h-4 w-4" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  previewDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-slate-100 p-6 rounded-3xl border border-slate-200">
            <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-300 ${
              previewDevice === 'mobile' ? 'w-[380px] min-h-[700px]' : 'w-full max-w-4xl'
            }`}>
              <div className="p-6 md:p-8 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                    {categories?.find(c => c.id === categoryId)?.name || 'Geral'}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                    {title || 'Título do Artigo'}
                  </h2>
                  <p className="mt-2 text-xs md:text-sm text-slate-500 font-medium">
                    {seoDescription || 'Resumo explicativo do artigo...'}
                  </p>
                </div>

                {coverImageUrl && (
                  <div className="aspect-[16/7] w-full rounded-2xl overflow-hidden bg-slate-100">
                    <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div
                  className="prose prose-slate prose-sm max-w-none pt-2"
                  dangerouslySetInnerHTML={{ __html: contentHtml || '<p>Conteúdo do artigo...</p>' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
