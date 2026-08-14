import { useState, useEffect } from 'react'
import { Upload, Image as ImageIcon, Search, Check, X, RefreshCw, HardDrive, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  name: string
  url: string
  source: 'storage' | 'blog' | 'recipe'
}

interface MediaLibraryModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  title?: string
}

export function MediaLibraryModal({
  open,
  onClose,
  onSelect,
  title = 'Biblioteca de Mídia da Plataforma'
}: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  // Fetch existing images from Supabase Storage & Database
  const fetchMediaItems = async () => {
    setLoading(true)
    try {
      const items: MediaItem[] = []

      // 1. Fetch from Supabase Storage 'system' bucket (blog folder)
      try {
        const { data: storageFiles } = await supabase.storage
          .from('system')
          .list('blog', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

        if (storageFiles && storageFiles.length > 0) {
          storageFiles.forEach((file) => {
            if (file.name && file.name !== '.emptyFolderPlaceholder') {
              const { data } = supabase.storage.from('system').getPublicUrl(`blog/${file.name}`)
              items.push({
                id: file.id || file.name,
                name: file.name,
                url: data.publicUrl,
                source: 'storage'
              })
            }
          })
        }
      } catch (err) {
        console.warn('Storage fetch notice:', err)
      }

      // 2. Fetch cover images from blog_posts table
      try {
        const { data: blogPosts } = await supabase
          .from('blog_posts')
          .select('id, title, cover_image_url, card_image_url')
          .order('created_at', { ascending: false })
          .limit(50)

        if (blogPosts) {
          blogPosts.forEach((post) => {
            if (post.cover_image_url && !items.some(i => i.url === post.cover_image_url)) {
              items.push({
                id: `blog-cover-${post.id}`,
                name: `Capa: ${post.title}`,
                url: post.cover_image_url,
                source: 'blog'
              })
            }
            if (post.card_image_url && !items.some(i => i.url === post.card_image_url)) {
              items.push({
                id: `blog-card-${post.id}`,
                name: `Card: ${post.title}`,
                url: post.card_image_url,
                source: 'blog'
              })
            }
          })
        }
      } catch (err) {
        console.warn('Blog posts fetch notice:', err)
      }

      // 3. Fetch cover images from recipes table
      try {
        const { data: recipes } = await supabase
          .from('recipes')
          .select('id, title, cover_image_url')
          .order('created_at', { ascending: false })
          .limit(50)

        if (recipes) {
          recipes.forEach((recipe) => {
            if (recipe.cover_image_url && !items.some(i => i.url === recipe.cover_image_url)) {
              items.push({
                id: `recipe-${recipe.id}`,
                name: `Receita: ${recipe.title}`,
                url: recipe.cover_image_url,
                source: 'recipe'
              })
            }
          })
        }
      } catch (err) {
        console.warn('Recipes fetch notice:', err)
      }

      setMediaItems(items)
    } catch (err: any) {
      console.error('Error fetching media library:', err)
      toast.error('Erro ao carregar biblioteca de mídia.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchMediaItems()
    }
  }, [open])

  // Handle direct file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const maxMB = 5
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`A imagem selecionada excede o limite de ${maxMB}MB.`)
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `blog/${cleanFileName}`

      const { error: uploadError } = await supabase.storage
        .from('system')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('system')
        .getPublicUrl(filePath)

      toast.success('Imagem enviada com sucesso para o banco de mídia!')
      onSelect(publicUrl)
      onClose()
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.message || 'Falha ao fazer upload da imagem.')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
    }
  }

  const filteredItems = mediaItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 font-medium">Faça upload ou escolha imagens salvas na plataforma</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload de Arquivo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'library'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Biblioteca Interna ({mediaItems.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-emerald-50/20 hover:border-emerald-300 transition-all text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Upload className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Arraste uma imagem ou clique para selecionar</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Formatos aceitos: PNG, JPG, WEBP, GIF, SVG (máx. 5MB)</p>
              </div>

              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-all active:scale-95">
                  {uploading ? 'Enviando Imagem...' : 'Selecionar Arquivo do Computador'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 2: Internal Media Library */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Refresh */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome ou título..."
                    className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchMediaItems}
                  disabled={loading}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>

              {/* Media Grid */}
              {loading ? (
                <LoadingState message="Carregando biblioteca de mídia..." />
              ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl">
                  Nenhuma imagem encontrada na biblioteca. Faça upload na primeira aba!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => {
                    const isSelected = selectedUrl === item.url
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedUrl(item.url)}
                        className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {isSelected && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm p-2 text-white text-[10px] font-bold truncate">
                          {item.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            {selectedUrl ? 'Uma imagem selecionada' : 'Selecione ou faça upload de uma imagem'}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedUrl}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
            >
              <Check className="h-4 w-4" />
              Usar Imagem Selecionada
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
