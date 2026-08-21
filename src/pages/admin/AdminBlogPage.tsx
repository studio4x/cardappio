import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Plus, Edit, Trash2, ExternalLink, Check, X, MessageSquare, BookOpen, Search, Eye,
  Layers, Tag as TagIcon, Save, FolderPlus, Tag, Layout, Sparkles, Upload, ArrowRight,
  ChevronLeft, ChevronRight, Copy, MoveUp, MoveDown, Star, GripVertical
} from 'lucide-react'
import { 
  useBlogPosts, 
  useBlogCategories, 
  useBlogTags, 
  useAdminBlogMutations, 
  useAdminBlogCategoriesMutations, 
  useAdminBlogTagsMutations, 
  useAdminBlogComments,
  useBlogLayoutSettings,
  useSaveBlogLayoutSettings,
  useBlogCarouselSettings,
  useSaveBlogCarouselSettings,
  slugify
} from '@/hooks/blog/useBlog'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { MediaLibraryModal } from '@/components/shared/MediaLibraryModal'
import { toast } from 'sonner'
import type { 
  BlogCategory, 
  BlogTag, 
  BlogLayoutSettings, 
  BlogSidebarBlock, 
  BlogSidebarTextSlide, 
  BlogSidebarImageSlide,
  BlogCarouselSettings,
  BlogCarouselSlide
} from '@/types/blog'

export function AdminBlogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'posts' | 'categories' | 'tags' | 'layout' | 'carousel' | 'comments' | null

  const [selectedTab, setSelectedTab] = useState<'posts' | 'categories' | 'tags' | 'layout' | 'carousel' | 'comments'>(tabFromUrl || 'posts')

  useEffect(() => {
    if (selectedTab) {
      setSearchParams({ tab: selectedTab }, { replace: true })
    }
  }, [selectedTab, setSearchParams])

  // Posts tab state
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled' | 'draft' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Comments tab state
  const [commentReplyId, setCommentReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // Category Modal / Form state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catDesc, setCatDesc] = useState('')
  const [catParentId, setCatParentId] = useState('')
  const [catOrder, setCatOrder] = useState(0)
  const [catActive, setCatActive] = useState(true)

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

  // Tag Modal / Form state
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagSlug, setTagSlug] = useState('')
  const [tagDesc, setTagDesc] = useState('')

  // Media Library state for layout image upload
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [activeMediaTarget, setActiveMediaTarget] = useState<{ blockIndex: number; slideIndex: number } | null>(null)

  // Data Queries
  const { data: postsData, isLoading: isLoadingPosts } = useBlogPosts({
    status: statusFilter,
    search: searchQuery,
    page: 1,
    pageSize: 50
  })

  // Drag & drop and local posts state
  const [localPosts, setLocalPosts] = useState<any[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    if (postsData?.posts) {
      setLocalPosts(postsData.posts)
    }
  }, [postsData])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const reordered = [...localPosts]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, removed)

    setLocalPosts(reordered)
    setDraggedIndex(null)
    setDragOverIndex(null)

    try {
      const orderedIds = reordered.map(p => p.id)
      await updatePostsOrder.mutateAsync(orderedIds)
      toast.success('Nova ordenação salva!')
    } catch (err: any) {
      toast.error('Erro ao salvar nova ordenação.')
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleToggleFeatured = async (post: any) => {
    try {
      const newFeatured = !post.is_featured
      await togglePostFeatured.mutateAsync({ id: post.id, is_featured: newFeatured })
      toast.success(newFeatured ? 'Artigo destacado com sucesso!' : 'Destaque removido.')
    } catch (err: any) {
      toast.error('Erro ao alterar status de destaque.')
    }
  }

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories()
  const { data: tags, isLoading: isLoadingTags } = useBlogTags()
  const { data: comments, isLoading: isLoadingComments } = useAdminBlogComments('all')
  const { data: layoutData, isLoading: isLoadingLayout } = useBlogLayoutSettings()

  // Layout local state
  const [layoutState, setLayoutState] = useState<BlogLayoutSettings>({
    hero_title: 'Blog Cardappio',
    hero_subtitle: 'Dicas, planejamento e receitas para organizar sua rotina na cozinha com praticidade.',
    sidebar_blocks: []
  })

  useEffect(() => {
    if (layoutData) {
      setLayoutState(layoutData)
    }
  }, [layoutData])

  // Carousel Modal / Media Target
  const [carouselMediaModalOpen, setCarouselMediaModalOpen] = useState(false)
  const [activeCarouselSlideIndex, setActiveCarouselSlideIndex] = useState<number | null>(null)

  // Carousel Data Query
  const { data: carouselData, isLoading: isLoadingCarousel } = useBlogCarouselSettings()

  // Carousel local state
  const [carouselState, setCarouselState] = useState<BlogCarouselSettings>({
    slides: []
  })

  useEffect(() => {
    if (carouselData) {
      setCarouselState(carouselData)
    }
  }, [carouselData])

  // Mutations
  const { deletePost, updateCommentStatus, updatePostsOrder, togglePostFeatured } = useAdminBlogMutations()
  const { saveCategory, deleteCategory } = useAdminBlogCategoriesMutations()
  const { saveTag, deleteTag } = useAdminBlogTagsMutations()
  const saveLayoutMutation = useSaveBlogLayoutSettings()
  const saveCarouselMutation = useSaveBlogCarouselSettings()

  // Carousel handlers
  const handleAddCarouselSlide = () => {
    const newSlide: BlogCarouselSlide = {
      id: `carousel-slide-${Date.now()}`,
      slide_type: 'text_over_image',
      background_image_url: 'https://wkngjvsgafmdwejmckks.supabase.co/storage/v1/object/public/system/blog/1787177571003-q9pp3.webp',
      badge_text: 'GERAL',
      title: 'Título do Seu Novo Slide',
      description: 'Esta é uma descrição breve do seu slide em destaque no blog público.',
      cta_button_text: 'Ler Artigo Completo',
      cta_link_url: '/blog'
    }
    setCarouselState(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }))
  }

  const handleRemoveCarouselSlide = (idx: number) => {
    setCarouselState(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== idx)
    }))
  }

  const handleMoveCarouselSlide = (idx: number, direction: 'up' | 'down') => {
    setCarouselState(prev => {
      const slides = [...prev.slides]
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= slides.length) return prev
      const temp = slides[idx]
      slides[idx] = slides[newIdx]
      slides[newIdx] = temp
      return { ...prev, slides }
    })
  }

  const handleSaveCarousel = async () => {
    try {
      await saveCarouselMutation.mutateAsync(carouselState)
      toast.success('Carrossel do blog salvo com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar carrossel do blog.')
    }
  }

  // Article handlers
  const handleDeletePost = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o artigo "${title}"?`)) return
    try {
      await deletePost.mutateAsync(id)
      toast.success('Artigo excluído com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir artigo.')
    }
  }

  // Comment handlers
  const handleCommentStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateCommentStatus.mutateAsync({ id, status })
      toast.success(`Comentário ${status === 'approved' ? 'aprovado' : 'rejeitado'}!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar comentário.')
    }
  }

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return
    try {
      await updateCommentStatus.mutateAsync({
        id,
        status: 'approved',
        admin_response: replyText.trim()
      })
      toast.success('Resposta enviada e comentário aprovado!')
      setCommentReplyId(null)
      setReplyText('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao responder comentário.')
    }
  }

  // Category Form Handlers
  const handleOpenCategoryModal = (cat?: BlogCategory) => {
    if (cat) {
      setEditingCategory(cat)
      setCatName(cat.name)
      setCatSlug(cat.slug)
      setCatDesc(cat.description || '')
      setCatParentId(cat.parent_id || '')
      setCatOrder(cat.sort_order || 0)
      setCatActive(cat.is_active ?? true)
    } else {
      setEditingCategory(null)
      setCatName('')
      setCatSlug('')
      setCatDesc('')
      setCatParentId('')
      setCatOrder(categories ? categories.length + 1 : 1)
      setCatActive(true)
    }
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) {
      toast.error('O nome da categoria é obrigatório.')
      return
    }

    try {
      await saveCategory.mutateAsync({
        id: editingCategory?.id,
        name: catName.trim(),
        slug: catSlug.trim() || slugify(catName),
        description: catDesc.trim() || null,
        parent_id: catParentId || null,
        sort_order: Number(catOrder) || 0,
        is_active: catActive
      })
      toast.success(editingCategory ? 'Categoria atualizada!' : 'Categoria criada com sucesso!')
      setCategoryModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar categoria.')
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) return
    try {
      await deleteCategory.mutateAsync(id)
      toast.success('Categoria excluída com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria.')
    }
  }

  // Tag Form Handlers
  const handleOpenTagModal = (tag?: BlogTag) => {
    if (tag) {
      setEditingTag(tag)
      setTagName(tag.name)
      setTagSlug(tag.slug)
      setTagDesc(tag.description || '')
    } else {
      setEditingTag(null)
      setTagName('')
      setTagSlug('')
      setTagDesc('')
    }
    setTagModalOpen(true)
  }

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagName.trim()) {
      toast.error('O nome da tag é obrigatório.')
      return
    }

    try {
      await saveTag.mutateAsync({
        id: editingTag?.id,
        name: tagName.trim(),
        slug: tagSlug.trim() || slugify(tagName),
        description: tagDesc.trim() || null
      })
      toast.success(editingTag ? 'Tag atualizada!' : 'Tag criada com sucesso!')
      setTagModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar tag.')
    }
  }

  const handleDeleteTag = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a tag "${name}"?`)) return
    try {
      await deleteTag.mutateAsync(id)
      toast.success('Tag excluída com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir tag.')
    }
  }

  // Layout Handlers
  const handleAddBlock = (type: 'card_text' | 'image') => {
    const newBlock: BlogSidebarBlock = {
      id: `block-${Date.now()}`,
      mode: 'carousel',
      block_type: type,
      slides: type === 'card_text' ? [
        {
          id: `slide-${Date.now()}`,
          badge_text: 'CARDAPPIO PRO',
          title: 'Organize sua semana alimentar sem complicação',
          description: 'Crie seu cardápio semanal personalizado, gere listas de compras automáticas e economize tempo na cozinha.',
          bullet_points: ['Planejador semanal inteligente', 'Centenas de receitas fáceis'],
          cta_button_text: 'Começar Grátis',
          cta_link_url: '/auth/cadastro',
          theme: 'dark'
        }
      ] : [
        {
          id: `slide-${Date.now()}`,
          url: '',
          linkUrl: '',
          alt: 'Banner Blog'
        }
      ]
    }

    setLayoutState((prev) => ({
      ...prev,
      sidebar_blocks: [...prev.sidebar_blocks, newBlock]
    }))
  }

  const handleRemoveBlock = (blockIndex: number) => {
    setLayoutState((prev) => ({
      ...prev,
      sidebar_blocks: prev.sidebar_blocks.filter((_, idx) => idx !== blockIndex)
    }))
  }

  const handleAddSlide = (blockIndex: number) => {
    setLayoutState((prev) => {
      const blocks = [...prev.sidebar_blocks]
      const targetBlock = { ...blocks[blockIndex] }
      
      if (targetBlock.block_type === 'card_text') {
        const newSlide: BlogSidebarTextSlide = {
          id: `slide-${Date.now()}`,
          badge_text: 'CARDAPPIO PRO',
          title: 'Novo Titulo do Card Slider',
          description: 'Descreva os benefícios e recursos da sua oferta para os leitores do blog.',
          bullet_points: ['Recurso 1', 'Recurso 2'],
          cta_button_text: 'Conhecer Agora',
          cta_link_url: '/auth/cadastro',
          theme: 'dark'
        }
        targetBlock.slides = [...targetBlock.slides, newSlide]
      } else {
        const newSlide: BlogSidebarImageSlide = {
          id: `slide-${Date.now()}`,
          url: '',
          linkUrl: '',
          alt: 'Banner Blog'
        }
        targetBlock.slides = [...targetBlock.slides, newSlide]
      }

      blocks[blockIndex] = targetBlock
      return { ...prev, sidebar_blocks: blocks }
    })
  }

  const handleRemoveSlide = (blockIndex: number, slideIndex: number) => {
    setLayoutState((prev) => {
      const blocks = [...prev.sidebar_blocks]
      const targetBlock = { ...blocks[blockIndex] }
      targetBlock.slides = targetBlock.slides.filter((_, idx) => idx !== slideIndex)
      blocks[blockIndex] = targetBlock
      return { ...prev, sidebar_blocks: blocks }
    })
  }

  const handleSaveLayout = async () => {
    try {
      await saveLayoutMutation.mutateAsync(layoutState)
      toast.success('Configurações de layout do blog salvas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar layout do blog.')
    }
  }

  const pendingCommentsCount = comments?.filter(c => c.status === 'pending').length || 0

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestão do Blog</h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie artigos, categorias, tags, layout visual e moderação de comentários.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedTab === 'posts' && (
            <Button
              onClick={() => navigate('/admin/blog/novo')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl gap-2 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Novo Artigo
            </Button>
          )}

          {selectedTab === 'categories' && (
            <Button
              onClick={() => handleOpenCategoryModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl gap-2 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          )}

          {selectedTab === 'tags' && (
            <Button
              onClick={() => handleOpenTagModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl gap-2 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Nova Tag
            </Button>
          )}

          {selectedTab === 'layout' && (
            <Button
              onClick={handleSaveLayout}
              disabled={saveLayoutMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl gap-2 shadow-sm shrink-0"
            >
              <Save className="h-4 w-4" />
              {saveLayoutMutation.isPending ? 'Salvando...' : 'Salvar Layout do Blog'}
            </Button>
          )}

          {selectedTab === 'carousel' && (
            <Button
              onClick={handleSaveCarousel}
              disabled={saveCarouselMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl gap-2 shadow-sm shrink-0"
            >
              <Save className="h-4 w-4" />
              {saveCarouselMutation.isPending ? 'Salvando...' : 'Salvar Carrossel do Blog'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Internal Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTab('posts')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'posts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Artigos ({postsData?.count || 0})
        </button>

        <button
          onClick={() => setSelectedTab('categories')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'categories'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          Categorias ({categories?.length || 0})
        </button>

        <button
          onClick={() => setSelectedTab('tags')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'tags'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Tag className="h-4 w-4" />
          Tags ({tags?.length || 0})
        </button>

        <button
          onClick={() => setSelectedTab('layout')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'layout'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layout className="h-4 w-4" />
          Layout & Sliders
        </button>

        <button
          onClick={() => setSelectedTab('carousel')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'carousel'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Carrossel do Blog
        </button>

        <button
          onClick={() => setSelectedTab('comments')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'comments'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Comentários
          {pendingCommentsCount > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {pendingCommentsCount} pendentes
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Posts Management */}
      {selectedTab === 'posts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artigos..."
                className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'published', 'scheduled', 'draft', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status === 'all' ? 'Todos' : status === 'published' ? 'Publicados' : status === 'scheduled' ? 'Agendados' : status === 'draft' ? 'Rascunhos' : 'Arquivados'}
                </button>
              ))}
            </div>
          </div>

          {isLoadingPosts ? (
            <LoadingState message="Carregando artigos..." />
          ) : !localPosts || localPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum artigo encontrado</p>
              <Button onClick={() => navigate('/admin/blog/novo')} size="sm" className="bg-emerald-600 text-white font-bold text-xs">
                Criar Primeiro Artigo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {(!searchQuery && statusFilter === 'all') ? (
                <p className="text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 inline-block">
                  💡 <strong>Dica:</strong> Arraste e solte as linhas usando o controle lateral para reordenar a prioridade dos artigos na página principal do blog. Artigos destacados ficam fixados no topo.
                </p>
              ) : (
                <p className="text-[11px] text-amber-600 font-medium bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 inline-block">
                  ⚠️ <strong>Atenção:</strong> A reordenação via arrastar e soltar (drag & drop) está desativada enquanto houver busca ou filtros de status aplicados.
                </p>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold tracking-wider">
                    <tr>
                      {(!searchQuery && statusFilter === 'all') && <th className="p-4 w-10"></th>}
                      <th className="p-4">Destaque</th>
                      <th className="p-4">Artigo</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Leitura</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {localPosts.map((post, idx) => (
                      <tr 
                        key={post.id} 
                        draggable={!searchQuery && statusFilter === 'all'}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onDragLeave={() => setDragOverIndex(null)}
                        className={`hover:bg-slate-50/80 transition-all duration-150
                          ${draggedIndex === idx ? 'opacity-30 bg-slate-100' : ''}
                          ${dragOverIndex === idx && draggedIndex !== null ? (draggedIndex > idx ? 'border-t-2 border-t-emerald-500 bg-emerald-50/30' : 'border-b-2 border-b-emerald-500 bg-emerald-50/30') : ''}
                        `}
                      >
                        {(!searchQuery && statusFilter === 'all') && (
                          <td className="p-4 align-middle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600">
                            <GripVertical className="h-4 w-4" />
                          </td>
                        )}

                        <td className="p-4 align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(post)}
                            className="p-1 rounded-full transition-colors duration-150 hover:bg-slate-100 cursor-pointer"
                            title={post.is_featured ? 'Remover destaque' : 'Destacar artigo'}
                          >
                            <Star 
                              className={`h-4.5 w-4.5 ${
                                post.is_featured 
                                  ? 'text-amber-500 fill-amber-500' 
                                  : 'text-slate-300 hover:text-amber-500'
                              }`} 
                            />
                          </button>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {post.cover_image_url ? (
                              <img src={post.cover_image_url} alt="" className="h-10 w-14 rounded-lg object-cover bg-slate-100" />
                            ) : (
                              <div className="h-10 w-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <BookOpen className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 line-clamp-1">{post.title}</p>
                                {post.is_featured && (
                                  <span className="rounded bg-amber-100 text-amber-800 font-extrabold text-[9px] px-1 py-0.5 uppercase tracking-wide">
                                    Fixo
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">/blog/{post.slug}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-[11px]">
                            {post.category?.name || post.category_name || 'Geral'}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : post.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : post.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : post.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                          </span>
                        </td>

                        <td className="p-4 text-slate-500 font-semibold">
                          {post.read_time_minutes} min
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              title="Visualizar post público"
                              className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/blog/${post.id}`)}
                              title="Editar post"
                              className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id, post.title)}
                              title="Excluir post"
                              className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Categories CRUD */}
      {selectedTab === 'categories' && (
        <div className="space-y-6">
          {isLoadingCategories ? (
            <LoadingState message="Carregando categorias..." />
          ) : !categories || categories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <Layers className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhuma categoria cadastrada</p>
              <Button onClick={() => handleOpenCategoryModal()} size="sm" className="bg-emerald-600 text-white font-bold text-xs">
                Criar Primeira Categoria
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold tracking-wider">
                  <tr>
                    <th className="p-4">Nome da Categoria</th>
                    <th className="p-4">URL Amigável (Slug)</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4">Ordem</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <span>{getCategoryPathLabel(cat, categories)}</span>
                        {cat.parent_id && (
                          <span className="ml-2 inline-block rounded-md bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 text-[10px]">
                            Subcategoria
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        /blog/categoria/{cat.slug}
                      </td>
                      <td className="p-4 text-slate-500">
                        {cat.description || '—'}
                      </td>
                      <td className="p-4 font-semibold text-slate-600">
                        #{cat.sort_order}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cat.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            title="Editar categoria"
                            className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            title="Excluir categoria"
                            className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Tags CRUD */}
      {selectedTab === 'tags' && (
        <div className="space-y-6">
          {isLoadingTags ? (
            <LoadingState message="Carregando tags..." />
          ) : !tags || tags.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <Tag className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhuma tag cadastrada</p>
              <Button onClick={() => handleOpenTagModal()} size="sm" className="bg-emerald-600 text-white font-bold text-xs">
                Criar Primeira Tag
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold tracking-wider">
                  <tr>
                    <th className="p-4">Nome da Tag</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-emerald-600" />
                          {tag.name}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        #{tag.slug}
                      </td>
                      <td className="p-4 text-slate-500">
                        {tag.description || '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenTagModal(tag)}
                            title="Editar tag"
                            className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            title="Excluir tag"
                            className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Layout & Sliders (tab=layout) */}
      {selectedTab === 'layout' && (
        <div className="space-y-8">
          {isLoadingLayout ? (
            <LoadingState message="Carregando configurações de layout..." />
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              
              {/* Left Column (7 cols): Hero & Sidebar Blocks Config */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Hero Header Section Config */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                      Cabeçalho Principal do Blog (Hero)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Configure o título e subtítulo exibidos no topo da página <code>/blog</code>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Título do Hero *</label>
                      <input
                        type="text"
                        value={layoutState.hero_title}
                        onChange={(e) => setLayoutState(prev => ({ ...prev, hero_title: e.target.value }))}
                        placeholder="Ex: Blog Cardappio"
                        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo do Hero</label>
                      <textarea
                        value={layoutState.hero_subtitle}
                        onChange={(e) => setLayoutState(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                        placeholder="Descreva o propósito do blog..."
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar Blocks & Sliders Manager */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                        Blocos & Sliders da Barra Lateral (Sidebar)
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Gerencie os cards e carrosséis da barra lateral direita do blog público.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => handleAddBlock('card_text')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        + Slider de Texto Card
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddBlock('image')}
                        className="text-xs font-bold gap-1.5 rounded-xl border-slate-200"
                      >
                        <Plus className="h-4 w-4" />
                        + Banner Imagem
                      </Button>
                    </div>
                  </div>

                  {/* Render Blocks List */}
                  {layoutState.sidebar_blocks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center space-y-3">
                      <Layout className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Nenhum bloco lateral configurado</p>
                      <div className="flex justify-center gap-2 pt-1">
                        <Button size="sm" onClick={() => handleAddBlock('card_text')} className="bg-emerald-600 text-white text-xs font-bold">
                          Adicionar Slider Cardappio Pro
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {layoutState.sidebar_blocks.map((block, blockIndex) => (
                        <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4 shadow-sm relative">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-900 text-white text-[10px] font-black px-2.5 py-0.5">
                                Bloco {blockIndex + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {block.block_type === 'card_text' ? '🎨 Card de Texto (Pro Style)' : '🖼️ Banner de Imagem'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Display Mode Selector */}
                              <select
                                value={block.mode}
                                onChange={(e) => {
                                  const mode = e.target.value as 'single' | 'carousel'
                                  setLayoutState(prev => {
                                    const blocks = [...prev.sidebar_blocks]
                                    blocks[blockIndex] = { ...blocks[blockIndex], mode }
                                    return { ...prev, sidebar_blocks: blocks }
                                  })
                                }}
                                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none"
                              >
                                <option value="carousel">🔄 Slider Carrossel Automático</option>
                                <option value="single">📌 Imagem/Card Único</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleRemoveBlock(blockIndex)}
                                className="p-1 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                                title="Excluir bloco"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Render Slides inside Block */}
                          <div className="space-y-4">
                            {block.slides.map((slide: any, slideIndex: number) => (
                              <div key={slide.id || slideIndex} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                                    Slide {slideIndex + 1} {block.slides.length > 1 ? `de ${block.slides.length}` : ''}
                                  </span>

                                  {block.slides.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlide(blockIndex, slideIndex)}
                                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                                    >
                                      Remover Slide
                                    </button>
                                  )}
                                </div>

                                {/* Form Fields for CARD_TEXT Slide */}
                                {block.block_type === 'card_text' ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge (Selo Topo)</label>
                                        <input
                                          type="text"
                                          value={slide.badge_text || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].badge_text = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="Ex: CARDAPPIO PRO"
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Tema Visual</label>
                                        <select
                                          value={slide.theme || 'dark'}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].theme = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
                                        >
                                          <option value="dark">🌑 Escuro (Dark Slate / Emerald)</option>
                                          <option value="emerald">🟢 Verde Emerald Pro</option>
                                          <option value="light">⚪ Claro (Clean Light)</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Título Principal *</label>
                                      <input
                                        type="text"
                                        value={slide.title || ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setLayoutState(prev => {
                                            const blocks = [...prev.sidebar_blocks]
                                            blocks[blockIndex].slides[slideIndex].title = val
                                            return { ...prev, sidebar_blocks: blocks }
                                          })
                                        }}
                                        placeholder="Ex: Organize sua semana alimentar sem complicação"
                                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Descrição Breve</label>
                                      <textarea
                                        value={slide.description || ''}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setLayoutState(prev => {
                                            const blocks = [...prev.sidebar_blocks]
                                            blocks[blockIndex].slides[slideIndex].description = val
                                            return { ...prev, sidebar_blocks: blocks }
                                          })
                                        }}
                                        placeholder="Ex: Crie seu cardápio semanal personalizado, gere listas..."
                                        rows={2}
                                        className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-emerald-500"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Item 1 (Ícone Calendário)</label>
                                        <input
                                          type="text"
                                          value={slide.bullet_points?.[0] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              const pts = [...(blocks[blockIndex].slides[slideIndex].bullet_points || [])]
                                              pts[0] = val
                                              blocks[blockIndex].slides[slideIndex].bullet_points = pts
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="Planejador semanal inteligente"
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Item 2 (Ícone Utensílios)</label>
                                        <input
                                          type="text"
                                          value={slide.bullet_points?.[1] || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              const pts = [...(blocks[blockIndex].slides[slideIndex].bullet_points || [])]
                                              pts[1] = val
                                              blocks[blockIndex].slides[slideIndex].bullet_points = pts
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="Centenas de receitas fáceis"
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto do Botão CTA</label>
                                        <input
                                          type="text"
                                          value={slide.cta_button_text || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].cta_button_text = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="Ex: Começar Grátis"
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Link de Destino (URL)</label>
                                        <input
                                          type="text"
                                          value={slide.cta_link_url || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].cta_link_url = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="Ex: /auth/cadastro"
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Form Fields for IMAGE Slide */
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">URL da Imagem Banner</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="url"
                                          value={slide.url || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].url = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="https://..."
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setActiveMediaTarget({ blockIndex, slideIndex })
                                            setMediaModalOpen(true)
                                          }}
                                          className="text-xs font-bold shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        >
                                          <Upload className="h-3.5 w-3.5 mr-1" />
                                          Upload
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Link de Clique (URL)</label>
                                        <input
                                          type="text"
                                          value={slide.linkUrl || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].linkUrl = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="https://..."
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto Alternativo (ALT)</label>
                                        <input
                                          type="text"
                                          value={slide.alt || ''}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setLayoutState(prev => {
                                              const blocks = [...prev.sidebar_blocks]
                                              blocks[blockIndex].slides[slideIndex].alt = val
                                              return { ...prev, sidebar_blocks: blocks }
                                            })
                                          }}
                                          placeholder="Descrição para acessibilidade"
                                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Add Slide Button inside Carousel Block */}
                            {block.mode === 'carousel' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSlide(blockIndex)}
                                className="w-full text-xs font-bold gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Adicionar Novo Slide a este Carrossel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveLayout}
                    disabled={saveLayoutMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2 shadow-md px-6 py-2.5"
                  >
                    <Save className="h-4 w-4" />
                    {saveLayoutMutation.isPending ? 'Salvando...' : 'Salvar Alterações de Layout'}
                  </Button>
                </div>
              </div>

              {/* Right Column (5 cols): Live Preview Info & Guidance */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm sticky top-24">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-600" />
                      Instruções de Layout do Blog
                    </h3>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      GenFlix Sync
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
                    <p>
                      Esta tela permite personalizar o layout completo da página pública <code>/blog</code>:
                    </p>

                    <ul className="space-y-2 list-disc list-inside text-slate-700 font-semibold">
                      <li><strong>Título Hero</strong>: Cabeçalho principal centralizado.</li>
                      <li><strong>Sliders de Texto (Pro Style)</strong>: Permite criar carrosséis de cards de divulgação personalizados reutilizando a estrutura visual do Cardappio Pro.</li>
                      <li><strong>Banners de Imagem</strong>: Carrosséis com imagens de banners na proporção recomendada <code>7:10</code> (640×920 px).</li>
                    </ul>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 pt-3">
                      <p className="font-bold text-slate-900 text-xs">🎯 Dica de Uso dos Sliders:</p>
                      <p className="text-[11px] text-slate-500">
                        Ao selecionar <strong>"Carrossel / Slider Automático"</strong> e adicionar mais de 1 slide, o card da barra lateral irá alternar automaticamente a cada 4,5 segundos no blog público!
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open('/blog', '_blank')}
                      className="w-full text-xs font-bold gap-2 text-slate-800 rounded-xl"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visualizar Blog Público no Navegador
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4.5: Main Carousel Settings (tab=carousel) */}
      {selectedTab === 'carousel' && (
        <div className="space-y-8">
          {isLoadingCarousel ? (
            <LoadingState message="Carregando carrossel em destaque..." />
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              
              {/* Left Column (7 cols): Main Slides Manager */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                        Slides do Carrossel em Destaque
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Crie e ordene os slides que aparecem no topo da página pública do blog.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddCarouselSlide}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Slide
                    </Button>
                  </div>

                  {carouselState.slides.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
                      <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">Nenhum slide customizado criado</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                        Atualmente, o carrossel padrão de fallback (artigos em destaque) está sendo exibido no blog público.
                      </p>
                      <Button size="sm" onClick={handleAddCarouselSlide} className="bg-emerald-600 text-white text-xs font-bold mt-1">
                        Criar Primeiro Slide Customizado
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {carouselState.slides.map((slide, slideIndex) => (
                        <div key={slide.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4 shadow-sm relative">
                          
                          {/* Slide Header & Controls */}
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-900 text-white text-[10px] font-black px-2.5 py-0.5">
                                Slide {slideIndex + 1}
                              </span>
                              <select
                                value={slide.slide_type}
                                onChange={(e) => {
                                  const val = e.target.value as 'image_only' | 'text_over_image'
                                  setCarouselState(prev => {
                                    const slides = [...prev.slides]
                                    slides[slideIndex] = { ...slides[slideIndex], slide_type: val }
                                    return { ...prev, slides }
                                  })
                                }}
                                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none"
                              >
                                <option value="text_over_image">🎨 Texto com Imagem de Fundo</option>
                                <option value="image_only">🖼️ Apenas Imagem Banner</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveCarouselSlide(slideIndex, 'up')}
                                disabled={slideIndex === 0}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                                title="Mover para cima"
                              >
                                <MoveUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCarouselSlide(slideIndex, 'down')}
                                disabled={slideIndex === carouselState.slides.length - 1}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                                title="Mover para baixo"
                              >
                                <MoveDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCarouselSlide(slideIndex)}
                                className="p-1 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 ml-1 cursor-pointer"
                                title="Remover slide"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Slide Form Inputs */}
                          <div className="space-y-4">
                            
                            {/* Background Image Upload */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                {slide.slide_type === 'text_over_image' ? 'Imagem de Fundo * (Aspecto 1920x520)' : 'Imagem do Banner * (Aspecto 1920x520)'}
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={slide.background_image_url || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setCarouselState(prev => {
                                      const slides = [...prev.slides]
                                      slides[slideIndex].background_image_url = val
                                      return { ...prev, slides }
                                    })
                                  }}
                                  placeholder="https://..."
                                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveCarouselSlideIndex(slideIndex)
                                    setCarouselMediaModalOpen(true)
                                  }}
                                  className="text-xs font-bold shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                >
                                  <Upload className="h-3.5 w-3.5 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            </div>

                            {slide.slide_type === 'text_over_image' ? (
                              /* Fields for TEXT_OVER_IMAGE slide */
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Selo / Categoria (Badge)</label>
                                  <input
                                    type="text"
                                    value={slide.badge_text || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].badge_text = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Ex: GERAL"
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Título / Headline *</label>
                                  <input
                                    type="text"
                                    value={slide.title || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].title = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Ex: A Origem do Cardappio"
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Descrição / Subtítulo</label>
                                  <input
                                    type="text"
                                    value={slide.description || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].description = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Ex: Do caos da cozinha à paz da organização..."
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto do Botão CTA</label>
                                  <input
                                    type="text"
                                    value={slide.cta_button_text || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].cta_button_text = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Ex: Ler Artigo Completo"
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Link de Destino (URL)</label>
                                  <input
                                    type="text"
                                    value={slide.cta_link_url || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].cta_link_url = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Ex: /blog/slug-do-artigo"
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            ) : (
                              /* Fields for IMAGE_ONLY slide */
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Link de Clique (URL)</label>
                                  <input
                                    type="text"
                                    value={slide.link_url || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].link_url = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Ex: /promocao-semana"
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Texto Alternativo (ALT)</label>
                                  <input
                                    type="text"
                                    value={slide.alt_text || ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setCarouselState(prev => {
                                        const slides = [...prev.slides]
                                        slides[slideIndex].alt_text = val
                                        return { ...prev, slides }
                                      })
                                    }}
                                    placeholder="Descrição da imagem para acessibilidade"
                                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveCarousel}
                    disabled={saveCarouselMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2 shadow-md px-6 py-2.5"
                  >
                    <Save className="h-4 w-4" />
                    {saveCarouselMutation.isPending ? 'Salvando...' : 'Salvar Carrossel do Blog'}
                  </Button>
                </div>
              </div>

              {/* Right Column (5 cols): Preview Info & Guidance */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm sticky top-24">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      Informações de Carrossel
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
                    <p>
                      Esta aba permite criar banners e carrosséis personalizados que substituem o carrossel padrão de artigos em destaque.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <p className="font-bold text-slate-900 text-xs">ℹ️ Tipos de Slides Suportados:</p>
                      <ul className="space-y-1 list-disc list-inside text-slate-700">
                        <li><strong>Texto com Imagem de Fundo</strong>: Ideal para destacar artigos, receitas ou promoções com overlay de texto, badge e botão de ação.</li>
                        <li><strong>Apenas Imagem Banner</strong>: Um banner puro que redireciona para um link específico ao ser clicado.</li>
                      </ul>
                    </div>

                    <div className="bg-emerald-50 text-emerald-950 p-4 rounded-xl border border-emerald-200">
                      <p className="font-bold text-xs">📸 Proporção Recomendada:</p>
                      <p className="text-[11px] mt-1 font-semibold">
                        As imagens dos slides devem seguir a proporção <strong>1920 × 520 px (Panorâmica 16:4)</strong> para perfeita exibição tanto em desktop quanto mobile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Comments Moderation */}
      {selectedTab === 'comments' && (
        <div className="space-y-6">
          {isLoadingComments ? (
            <LoadingState message="Carregando comentários..." />
          ) : !comments || comments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum comentário cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{comment.first_name} {comment.last_name}</span>
                      <span className="text-xs text-slate-400 ml-2">({comment.email})</span>
                      <span className="text-xs text-slate-400 ml-3">· Post: <strong className="text-slate-700">{comment.post_slug}</strong></span>
                    </div>

                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      comment.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : comment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {comment.status === 'approved' ? 'Aprovado' : comment.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl">
                    "{comment.content}"
                  </p>

                  {comment.admin_response && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950">
                      <p className="font-bold text-[10px] uppercase text-emerald-700">Resposta salva pelo Admin:</p>
                      <p className="mt-1">{comment.admin_response}</p>
                    </div>
                  )}

                  {/* Comment Reply Form */}
                  {commentReplyId === comment.id && (
                    <div className="pt-2 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva a resposta da administração..."
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCommentReplyId(null)} className="text-xs font-bold">
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSendReply(comment.id)} className="bg-emerald-600 text-white font-bold text-xs">
                          Responder & Aprovar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setCommentReplyId(comment.id); setReplyText(comment.admin_response || '') }}
                      className="text-xs font-bold gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {comment.admin_response ? 'Editar Resposta' : 'Responder'}
                    </Button>

                    {comment.status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleCommentStatus(comment.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprovar
                      </Button>
                    )}

                    {comment.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCommentStatus(comment.id, 'rejected')}
                        className="text-red-600 hover:bg-red-50 font-bold text-xs gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Rejeitar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category CRUD Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value)
                    if (!editingCategory) setCatSlug(slugify(e.target.value))
                  }}
                  placeholder="Ex: Planejamento Semanal"
                  required
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Slug (URL Amigável)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(slugify(e.target.value))}
                  placeholder="planejamento-semanal"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria Pai (Hierarquia)</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Nenhuma (Categoria Principal / Raiz)</option>
                  {categories?.filter(c => c.id !== editingCategory?.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryPathLabel(c, categories)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Selecione se esta categoria é uma subcategoria de outra.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Descrição breve da categoria..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catActive}
                      onChange={(e) => setCatActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Categoria Ativa
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Categoria
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag CRUD Modal */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingTag ? 'Editar Tag' : 'Nova Tag'}
              </h2>
              <button
                type="button"
                onClick={() => setTagModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Tag *</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => {
                    setTagName(e.target.value)
                    if (!editingTag) setTagSlug(slugify(e.target.value))
                  }}
                  placeholder="Ex: Marmitas & Prep"
                  required
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Slug (URL Amigável)</label>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(slugify(e.target.value))}
                  placeholder="marmitas-and-prep"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  placeholder="Descrição da tag..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setTagModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Tag
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Library Modal for Layout Banner Upload */}
      <MediaLibraryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        title="Selecionar Imagem para o Banner Lateral"
        onSelect={(url) => {
          if (activeMediaTarget) {
            const { blockIndex, slideIndex } = activeMediaTarget
            setLayoutState(prev => {
              const blocks = [...prev.sidebar_blocks]
              blocks[blockIndex].slides[slideIndex].url = url
              return { ...prev, sidebar_blocks: blocks }
            })
          }
        }}
      />

      {/* Media Library Modal for Custom Main Carousel */}
      <MediaLibraryModal
        open={carouselMediaModalOpen}
        onClose={() => setCarouselMediaModalOpen(false)}
        title="Selecionar Imagem de Fundo para o Carrossel"
        onSelect={(url) => {
          if (activeCarouselSlideIndex !== null) {
            setCarouselState(prev => {
              const slides = [...prev.slides]
              slides[activeCarouselSlideIndex].background_image_url = url
              return { ...prev, slides }
            })
          }
        }}
      />
    </div>
  )
}
