import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Edit, Trash2, ExternalLink, Check, X, MessageSquare, BookOpen, Search, Eye,
  Layers, Tag as TagIcon, Save, FolderPlus, Tag
} from 'lucide-react'
import { 
  useBlogPosts, 
  useBlogCategories, 
  useBlogTags, 
  useAdminBlogMutations, 
  useAdminBlogCategoriesMutations, 
  useAdminBlogTagsMutations, 
  useAdminBlogComments,
  slugify
} from '@/hooks/blog/useBlog'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { toast } from 'sonner'
import type { BlogCategory, BlogTag } from '@/types/blog'

export function AdminBlogPage() {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState<'posts' | 'categories' | 'tags' | 'comments'>('posts')
  
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
  const [catOrder, setCatOrder] = useState(0)
  const [catActive, setCatActive] = useState(true)

  // Tag Modal / Form state
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagSlug, setTagSlug] = useState('')
  const [tagDesc, setTagDesc] = useState('')

  // Data Queries
  const { data: postsData, isLoading: isLoadingPosts } = useBlogPosts({
    status: statusFilter,
    search: searchQuery,
    page: 1,
    pageSize: 50
  })

  const { data: categories, isLoading: isLoadingCategories } = useBlogCategories()
  const { data: tags, isLoading: isLoadingTags } = useBlogTags()
  const { data: comments, isLoading: isLoadingComments } = useAdminBlogComments('all')

  // Mutations
  const { deletePost, updateCommentStatus } = useAdminBlogMutations()
  const { saveCategory, deleteCategory } = useAdminBlogCategoriesMutations()
  const { saveTag, deleteTag } = useAdminBlogTagsMutations()

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
      setCatOrder(cat.sort_order || 0)
      setCatActive(cat.is_active ?? true)
    } else {
      setEditingCategory(null)
      setCatName('')
      setCatSlug('')
      setCatDesc('')
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

  const pendingCommentsCount = comments?.filter(c => c.status === 'pending').length || 0

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestão do Blog</h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie artigos, categorias, tags e moderação de comentários da comunidade.
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
        </div>
      </div>

      {/* Main Internal Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTab('posts')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
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
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
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
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            selectedTab === 'tags'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Tag className="h-4 w-4" />
          Tags ({tags?.length || 0})
        </button>

        <button
          onClick={() => setSelectedTab('comments')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
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
          {/* Search & Filters */}
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
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
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

          {/* Posts Table */}
          {isLoadingPosts ? (
            <LoadingState message="Carregando artigos..." />
          ) : !postsData || postsData.posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum artigo encontrado</p>
              <Button onClick={() => navigate('/admin/blog/novo')} size="sm" className="bg-emerald-600 text-white font-bold text-xs">
                Criar Primeiro Artigo
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold tracking-wider">
                  <tr>
                    <th className="p-4">Artigo</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Leitura</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {postsData.posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
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
                            <p className="font-bold text-slate-900 line-clamp-1">{post.title}</p>
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
                            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/blog/${post.id}`)}
                            title="Editar post"
                            className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id, post.title)}
                            title="Excluir post"
                            className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
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
                        {cat.name}
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
                            className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            title="Excluir categoria"
                            className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
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
                            className="p-2 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            title="Excluir tag"
                            className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
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

      {/* TAB 4: Comments Moderation */}
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
                        <Button size="sm" variant="outline" onClick={() => setCommentReplyId(null)} className="text-xs">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
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
    </div>
  )
}
