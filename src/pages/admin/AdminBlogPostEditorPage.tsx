import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Save, Eye, EyeOff, BookOpen, Clock, FileText, Image as ImageIcon,
  Sparkles, Calendar, Search, Globe, Share2, Smartphone, Monitor, CheckCircle2, Code,
  Upload, Trash2, Info, Tag as TagIcon, Plus
} from 'lucide-react'
import { useBlogPost, useBlogCategories, useBlogTags, useAdminBlogMutations, useAdminBlogTagsMutations, slugify } from '@/hooks/blog/useBlog'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { MediaLibraryModal } from '@/components/shared/MediaLibraryModal'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { toast } from 'sonner'
import type { BlogPostStatus, BlogCategory } from '@/types/blog'

export function AdminBlogPostEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'novo'

  const [existingSlug, setExistingSlug] = useState<string | undefined>()

  // Active Tab: 'content' | 'seo' | 'publishing' | 'preview'
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'publishing' | 'preview'>('content')
  const [contentEditorMode, setContentEditorMode] = useState<'visual' | 'code'>('visual')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [mediaTargetField, setMediaTargetField] = useState<'cover' | 'card'>('cover')

  // Form Fields State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
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

  // Fetch post, categories, tags & mutations
  const { data: post, isLoading } = useBlogPost(existingSlug)
  const { data: categories } = useBlogCategories()
  const { data: tags } = useBlogTags()
  const { savePost } = useAdminBlogMutations()
  const { saveTag } = useAdminBlogTagsMutations()

  useEffect(() => {
    if (!isNew && id) {
      setExistingSlug(id)
    }
  }, [id, isNew])

  function getCategoryPathLabel(cat: BlogCategory, allCategories?: BlogCategory[]): string {
    if (!allCategories) return cat.name
    const path: string[] = [cat.name]
    let currentParentId = cat.parent_id
    const map = new Map(allCategories.map(c => [c.id, c]))
    while (currentParentId) {
      const parent = map.get(currentParentId)
      if (!parent) break
      path.unshift(parent.name)
      currentParentId = parent.parent_id
    }
    return path.join(' > ')
  }

  useEffect(() => {
    if (post) {
      setTitle(post.title || '')
      setSlug(post.slug || '')
      setCategoryId(post.category_id || '')
      setSelectedCategoryIds(post.category_ids || (post.category_id ? [post.category_id] : []))
      setSelectedTagIds(post.tag_ids || [])
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
      const primaryCatId = selectedCategoryIds[0] || categoryId || null
      const selectedCategory = categories?.find(c => c.id === primaryCatId)

      await savePost.mutateAsync({
        id: isNew ? undefined : post?.id || id,
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        category_id: primaryCatId,
        category_ids: selectedCategoryIds,
        tag_ids: selectedTagIds,
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
          {/* Prominent Status Selector in Header */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 pl-2 hidden sm:inline">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
              className={`h-8 rounded-lg px-2 text-xs font-bold border-none outline-none cursor-pointer transition-all ${
                status === 'published'
                  ? 'bg-emerald-600 text-white'
                  : status === 'draft'
                  ? 'bg-amber-500 text-white'
                  : status === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              <option value="published" className="bg-white text-slate-900 font-medium">🟢 Publicado</option>
              <option value="draft" className="bg-white text-slate-900 font-medium">🟡 Rascunho</option>
              <option value="scheduled" className="bg-white text-slate-900 font-medium">🔵 Agendado</option>
              <option value="archived" className="bg-white text-slate-900 font-medium">⚪ Arquivado</option>
            </select>
          </div>

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

          {/* Right Column (4 cols): Status, Category & Dual Images */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status Selection Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Status de Publicação *
              </h3>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                className={`w-full h-11 rounded-xl border px-3 text-xs font-bold outline-none cursor-pointer ${
                  status === 'published'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : status === 'draft'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : status === 'scheduled'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-slate-300 bg-slate-50 text-slate-900'
                }`}
              >
                <option value="published">🟢 Publicado (Visível no Blog)</option>
                <option value="draft">🟡 Rascunho (Oculto / Privado)</option>
                <option value="scheduled">🔵 Agendado (Publica em data futura)</option>
                <option value="archived">⚪ Arquivado</option>
              </select>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {status === 'published'
                  ? 'Este artigo estará imediatamente visível para todos os leitores no blog público.'
                  : status === 'draft'
                  ? 'Salvo como rascunho. Visível apenas para administradores.'
                  : status === 'scheduled'
                  ? 'Será tornado público na data definida no agendamento.'
                  : 'Artigo arquivado.'}
              </p>
            </div>

            {/* Multi-Category Selection Card with Hierarchy */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Categorias do Artigo
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedCategoryIds.length} selecionada(s)
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Selecione uma ou mais categorias para o artigo. A primeira será a principal.
              </p>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                {categories?.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id)
                  const pathLabel = getCategoryPathLabel(cat, categories)
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/60' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds(prev => [...prev, cat.id])
                            if (!categoryId) setCategoryId(cat.id)
                          } else {
                            setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate font-medium">{pathLabel}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Tags Selection Card (Positioned below Category Card) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TagIcon className="h-3.5 w-3.5 text-emerald-600" />
                  Tags do Artigo
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedTagIds.length} selecionada(s)
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Selecione as tags associadas a este artigo para agrupar conteúdos.
              </p>

              {/* Tags Checklist */}
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
                {tags?.map((t) => {
                  const isSelected = selectedTagIds.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTagIds(prev => prev.filter(id => id !== t.id))
                        } else {
                          setSelectedTagIds(prev => [...prev, t.id])
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      #{t.name}
                    </button>
                  )
                })}
              </div>

              {/* Quick Add New Tag Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Criar nova tag..."
                  className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!newTagName.trim()) return
                    try {
                      const created = await saveTag.mutateAsync({ name: newTagName.trim() })
                      setSelectedTagIds(prev => [...prev, created.id])
                      setNewTagName('')
                      toast.success(`Tag #${created.name} criada e selecionada!`)
                    } catch (err: any) {
                      toast.error(err.message || 'Erro ao criar tag.')
                    }
                  }}
                  className="text-xs font-bold shrink-0 rounded-xl border-slate-200 text-slate-800"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Criar
                </Button>
              </div>
            </div>

            {/* Cover Image (Post Page Banner 1920x520 - Aspect 16:9 / 16:7) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Capa do Artigo (Banner do Topo)
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200/60">
                    <Info className="h-3 w-3 text-emerald-600" />
                    Proporção: 16:9 / 16:7
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200/80">
                    Recomendado: 1920 × 520 px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">URL da Imagem de Capa</label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setMediaTargetField('cover'); setMediaModalOpen(true) }}
                  className="w-full rounded-xl text-xs font-bold gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload / Biblioteca de Mídia
                </Button>
              </div>

              {coverImageUrl && (
                <div className="relative aspect-[16/7] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-md"
                    title="Remover imagem de capa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Card Thumbnail Image (Grid 4:3 - Aspect 4:3) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Imagem da Miniatura (Card na Listagem)
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 border border-blue-200/60">
                    <Info className="h-3 w-3 text-blue-600" />
                    Proporção: 4:3
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200/80">
                    Recomendado: 960 × 720 px
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">
                  URL da Miniatura <span className="text-slate-400 font-normal">(opcional - usa a capa se vazio)</span>
                </label>
                <input
                  type="url"
                  value={cardImageUrl}
                  onChange={(e) => setCardImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setMediaTargetField('card'); setMediaModalOpen(true) }}
                  className="w-full rounded-xl text-xs font-bold gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload / Biblioteca de Mídia
                </Button>
              </div>

              {cardImageUrl && (
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={cardImageUrl} alt="Card Miniatura" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCardImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-md"
                    title="Remover miniatura"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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

      {/* Media Library & Image Upload Modal */}
      <MediaLibraryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        title={mediaTargetField === 'cover' ? 'Selecionar Capa do Artigo (Banner)' : 'Selecionar Miniatura (Card da Listagem)'}
        onSelect={(url) => {
          if (mediaTargetField === 'cover') {
            setCoverImageUrl(url)
          } else {
            setCardImageUrl(url)
          }
        }}
      />

    </div>
  )
}
